"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

/**
 * Obtener lista de alumnos de un curso
 */
export async function getStudentsByCourse(courseId: string) {
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
      orderBy: [
        { lastName: "asc" },
        { firstName: "asc" },
      ],
      include: {
        course: {
          select: {
            name: true,
            academicYear: true,
          },
        },
      },
    });

    return students;
  } catch (error) {
    console.error("[getStudentsByCourse] Error:", error);
    throw error;
  }
}

/**
 * Crear un nuevo alumno
 */
export async function createStudent(data: {
  schoolId: string;
  courseId: string;
  firstName: string;
  lastName: string;
  rut?: string;
  birthDate?: Date;
  gender?: string;
  email?: string;
  phone?: string;
  address?: string;
  enrollmentDate?: Date;
  guardianName?: string;
  guardianRelation?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianRut?: string;
  guardianAddress?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  bloodType?: string;
  allergies?: string;
  medicalConditions?: string;
  medications?: string;
  healthInsurance?: string;
  notes?: string;
}) {
  try {
    const session = await getSession();
    if (!session?.id) {
      throw new Error("No autorizado");
    }

    const enrollmentDate = data.enrollmentDate || new Date();

    // Crear el estudiante
    const student = await prisma.student.create({
      data: {
        ...data,
        enrollmentDate,
      },
    });

    // Crear entrada en el historial de cursos
    await prisma.studentCourseHistory.create({
      data: {
        studentId: student.id,
        courseId: data.courseId,
        schoolId: data.schoolId,
        startDate: enrollmentDate,
        academicYear: new Date().getFullYear(),
        changeReason: "ingreso",
      },
    });

    revalidatePath("/students");
    revalidatePath(`/courses/${data.courseId}`);
    revalidatePath("/attendance");
    return student;
  } catch (error) {
    console.error("[createStudent] Error:", error);
    throw error;
  }
}

/**
 * Actualizar información de un alumno
 */
export async function updateStudent(
  id: string,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    courseId?: string;
    isActive?: boolean;
  }
) {
  try {
    const session = await getSession();
    if (!session?.id) {
      throw new Error("No autorizado");
    }

    const student = await prisma.student.update({
      where: { id },
      data,
    });

    revalidatePath("/students");
    return student;
  } catch (error) {
    console.error("[updateStudent] Error:", error);
    throw error;
  }
}

/**
 * Obtener alumno por ID
 */
export async function getStudentById(id: string) {
  try {
    const session = await getSession();
    if (!session?.id) {
      throw new Error("No autorizado");
    }

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        course: true,
        school: true,
        courseHistory: {
          orderBy: { startDate: "desc" },
        },
        attendances: {
          orderBy: { date: "desc" },
          take: 30, // Últimas 30 asistencias
        },
      },
    });

    return student;
  } catch (error) {
    console.error("[getStudentById] Error:", error);
    throw error;
  }
}

/**
 * Cambiar alumno de curso (con historial)
 */
export async function changeStudentCourse(
  studentId: string,
  newCourseId: string,
  reason: string,
  changeDate?: Date
) {
  try {
    const session = await getSession();
    if (!session?.id) {
      throw new Error("No autorizado");
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { course: true },
    });

    if (!student) {
      throw new Error("Alumno no encontrado");
    }

    const date = changeDate || new Date();

    // Cerrar el registro actual en el historial
    const currentHistory = await prisma.studentCourseHistory.findFirst({
      where: {
        studentId,
        endDate: null,
      },
    });

    if (currentHistory) {
      await prisma.studentCourseHistory.update({
        where: { id: currentHistory.id },
        data: {
          endDate: date,
        },
      });
    }

    // Crear nuevo registro en el historial
    await prisma.studentCourseHistory.create({
      data: {
        studentId,
        courseId: newCourseId,
        schoolId: student.schoolId,
        startDate: date,
        academicYear: date.getFullYear(),
        changeReason: reason,
      },
    });

    // Actualizar el curso actual del estudiante
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        courseId: newCourseId,
      },
    });

    revalidatePath("/students");
    revalidatePath(`/courses/${student.courseId}`);
    revalidatePath(`/courses/${newCourseId}`);
    revalidatePath("/attendance");

    return updatedStudent;
  } catch (error) {
    console.error("[changeStudentCourse] Error:", error);
    throw error;
  }
}

/**
 * Promover alumnos al siguiente año académico
 */
export async function promoteStudents(
  studentIds: string[],
  targetCourseId: string,
  academicYear: number
) {
  try {
    const session = await getSession();
    if (!session?.id) {
      throw new Error("No autorizado");
    }

    const results = [];

    for (const studentId of studentIds) {
      try {
        const result = await changeStudentCourse(
          studentId,
          targetCourseId,
          "promocion",
          new Date(academicYear, 2, 1) // 1 de marzo del nuevo año
        );
        results.push({ studentId, success: true, data: result });
      } catch (error) {
        results.push({ 
          studentId, 
          success: false, 
          error: error instanceof Error ? error.message : "Error desconocido" 
        });
      }
    }

    return results;
  } catch (error) {
    console.error("[promoteStudents] Error:", error);
    throw error;
  }
}
