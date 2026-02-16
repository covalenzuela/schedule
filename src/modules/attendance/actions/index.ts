"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { checkAndNotifyAbsences } from "@/modules/notifications/actions";

/**
 * Registrar asistencia de un alumno
 */
export async function recordAttendance(data: {
  studentId: string;
  courseId: string;
  date: Date;
  status: "present" | "absent" | "late" | "justified";
  notes?: string;
}) {
  try {
    const session = await getSession();
    if (!session?.id) {
      throw new Error("No autorizado");
    }

    // Verificar que el alumno pertenece al curso
    const student = await prisma.student.findFirst({
      where: {
        id: data.studentId,
        courseId: data.courseId,
      },
    });

    if (!student) {
      throw new Error("El alumno no pertenece a este curso");
    }

    // Verificar que la fecha no sea anterior a la fecha de ingreso del alumno
    if (new Date(data.date) < new Date(student.enrollmentDate)) {
      throw new Error("No se puede registrar asistencia antes de la fecha de ingreso del alumno");
    }

    // Crear o actualizar el registro de asistencia
    const attendance = await prisma.attendance.upsert({
      where: {
        studentId_date: {
          studentId: data.studentId,
          date: data.date,
        },
      },
      update: {
        status: data.status,
        notes: data.notes,
      },
      create: data,
    });

    // Verificar ausencias y crear notificación si corresponde
    if (data.status === "absent") {
      try {
        await checkAndNotifyAbsences(data.studentId);
      } catch (notificationError) {
        console.error("[recordAttendance] Error checking absences:", notificationError);
        // No lanzar error aquí para no afectar el registro de asistencia
      }
    }

    revalidatePath("/attendance");
    revalidatePath(`/courses/${data.courseId}/attendance`);
    return attendance;
  } catch (error) {
    console.error("[recordAttendance] Error:", error);
    throw error;
  }
}

/**
 * Registrar asistencia para múltiples alumnos de un curso en una fecha
 */
export async function recordBulkAttendance(
  courseId: string,
  date: Date,
  attendances: Array<{
    studentId: string;
    status: "present" | "absent" | "late" | "justified";
    notes?: string;
  }>
) {
  try {
    const session = await getSession();
    if (!session?.id) {
      throw new Error("No autorizado");
    }

    // Registrar cada asistencia
    const results = await Promise.all(
      attendances.map((att) =>
        recordAttendance({
          studentId: att.studentId,
          courseId,
          date,
          status: att.status,
          notes: att.notes,
        })
      )
    );

    return results;
  } catch (error) {
    console.error("[recordBulkAttendance] Error:", error);
    throw error;
  }
}

/**
 * Obtener asistencia de un curso en un rango de fechas
 */
export async function getAttendanceByCourse(
  courseId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const session = await getSession();
    if (!session?.id) {
      throw new Error("No autorizado");
    }

    const attendances = await prisma.attendance.findMany({
      where: {
        courseId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            enrollmentDate: true,
          },
        },
      },
      orderBy: [
        { date: "asc" },
        { student: { lastName: "asc" } },
        { student: { firstName: "asc" } },
      ],
    });

    return attendances;
  } catch (error) {
    console.error("[getAttendanceByCourse] Error:", error);
    throw error;
  }
}

/**
 * Obtener asistencia de un alumno en un rango de fechas
 */
export async function getAttendanceByStudent(
  studentId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const session = await getSession();
    if (!session?.id) {
      throw new Error("No autorizado");
    }

    const attendances = await prisma.attendance.findMany({
      where: {
        studentId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    });

    return attendances;
  } catch (error) {
    console.error("[getAttendanceByStudent] Error:", error);
    throw error;
  }
}

/**
 * Calcular estadísticas de asistencia de un alumno
 */
export async function getStudentAttendanceStats(
  studentId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const session = await getSession();
    if (!session?.id) {
      throw new Error("No autorizado");
    }

    const attendances = await getAttendanceByStudent(studentId, startDate, endDate);

    const total = attendances.length;
    const present = attendances.filter((a: any) => a.status === "present").length;
    const absent = attendances.filter((a: any) => a.status === "absent").length;
    const late = attendances.filter((a: any) => a.status === "late").length;
    const justified = attendances.filter((a: any) => a.status === "justified").length;

    const attendancePercentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      total,
      present,
      absent,
      late,
      justified,
      attendancePercentage,
      needsAlert: attendancePercentage < 85, // Alerta si asistencia < 85%
    };
  } catch (error) {
    console.error("[getStudentAttendanceStats] Error:", error);
    throw error;
  }
}

/**
 * Obtener alumnos con baja asistencia (para alertas)
 */
export async function getStudentsWithLowAttendance(
  courseId: string,
  startDate: Date,
  endDate: Date,
  threshold: number = 85 // Porcentaje mínimo de asistencia
) {
  try {
    const session = await getSession();
    if (!session?.id) {
      throw new Error("No autorizado");
    }

    const students = await prisma.student.findMany({
      where: {
        courseId,
        isActive: true,
      },
      include: {
        attendances: {
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
    });

    const studentsWithStats = students.map((student: any) => {
      const total = student.attendances.length;
      const present = student.attendances.filter((a: any) => a.status === "present").length;
      const attendancePercentage = total > 0 ? Math.round((present / total) * 100) : 0;

      return {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        total,
        present,
        attendancePercentage,
        needsAlert: attendancePercentage < threshold,
      };
    });

    // Filtrar solo los que necesitan alerta
    return studentsWithStats.filter((s: any) => s.needsAlert);
  } catch (error) {
    console.error("[getStudentsWithLowAttendance] Error:", error);
    throw error;
  }
}
