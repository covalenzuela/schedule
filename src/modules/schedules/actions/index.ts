"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

// Funciones auxiliares
async function findOrCreateSubject(
  schoolId: string,
  name: string,
  color: string
) {
  let subject = await prisma.subject.findFirst({
    where: { schoolId, name },
  });

  if (!subject) {
    const code = name
      .substring(0, 3)
      .toUpperCase()
      .replace(/\s/g, "")
      .padEnd(3, "X");
    subject = await prisma.subject.create({
      data: {
        schoolId,
        name,
        code: `${code}${Date.now().toString().slice(-3)}`,
        color,
      },
    });
  }

  return subject;
}

async function findOrCreateTeacher(
  schoolId: string,
  fullName: string
): Promise<string> {
  const [firstName, ...lastNameParts] = fullName.split(" ");
  const lastName = lastNameParts.join(" ") || firstName;

  let teacher = await prisma.teacher.findFirst({
    where: {
      schoolId,
      firstName: { contains: firstName },
      lastName: { contains: lastName },
    },
  });

  if (!teacher) {
    teacher = await prisma.teacher.create({
      data: {
        schoolId,
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@school.edu`,
      },
    });
  }

  return teacher.id;
}

async function findOrCreateCourse(
  schoolId: string,
  name: string
): Promise<string | null> {
  let course = await prisma.course.findFirst({
    where: { schoolId, name },
  });

  if (!course) {
    // Crear curso si no existe
    const year = new Date().getFullYear();
    course = await prisma.course.create({
      data: {
        schoolId,
        name,
        grade: "1",
        section: "A",
        academicLevel: "SECONDARY",
        academicYear: year,
      },
    });
  }

  return course?.id || null;
}

function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  return endHour * 60 + endMin - (startHour * 60 + startMin);
}

function calculateBlockNumber(startTime: string): number {
  const [startHour, startMin] = startTime.split(":").map(Number);
  return Math.floor((startHour - 9) * 2 + startMin / 30) + 1;
}

interface ScheduleBlock {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  teacher?: string;
  course?: string;
  color: string;
}

/**
 * Obtener horarios de un curso
 */
export async function getSchedulesForCourse(courseId: string) {
  try {
    const session = await getSession();
    if (!session?.id) {
      throw new Error("No autorizado");
    }

    const currentYear = new Date().getFullYear();

    console.log(
      `[getSchedulesForCourse] Buscando schedules para curso: ${courseId}, año: ${currentYear}`
    );

    const schedules = await prisma.schedule.findMany({
      where: {
        courseId,
        academicYear: currentYear,
        isActive: true,
      },
      include: {
        blocks: {
          include: {
            subject: true,
            teacher: true,
          },
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 1, // Solo tomar el más reciente
    });

    console.log(
      `[getSchedulesForCourse] Encontrados ${schedules.length} schedules`
    );
    if (schedules.length > 0) {
      console.log(
        `[getSchedulesForCourse] Schedule ID: ${schedules[0].id}, Bloques: ${schedules[0].blocks.length}`
      );
      console.log(
        `[getSchedulesForCourse] Bloques detalles:`,
        schedules[0].blocks.map(
          (b) => `${b.dayOfWeek} ${b.startTime}-${b.endTime} ${b.subject.name}`
        )
      );
    }

    // Revalidar la ruta para asegurar datos frescos
    revalidatePath("/schedules");

    return schedules;
  } catch (error) {
    console.error("Error obteniendo horarios:", error);
    throw error;
  }
}

/**
 * Obtener bloques de horario para un profesor
 */
export async function getSchedulesForTeacher(teacherId: string) {
  try {
    const session = await getSession();
    if (!session?.id) {
      throw new Error("No autorizado");
    }

    // Obtener todos los bloques donde este profesor está asignado
    const blocks = await prisma.scheduleBlock.findMany({
      where: {
        teacherId,
        schedule: {
          isActive: true,
        },
      },
      include: {
        subject: true,
        course: true,
        schedule: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return blocks;
  } catch (error) {
    console.error("Error obteniendo horarios del profesor:", error);
    throw error;
  }
}

/**
 * Guardar/actualizar horario con bloques
 */
export async function saveSchedule(data: {
  entityId: string;
  entityType: "course" | "teacher";
  blocks: ScheduleBlock[];
}) {
  try {
    const session = await getSession();
    if (!session?.id) {
      throw new Error("No autorizado");
    }

    const { entityId, entityType, blocks } = data;
    let schoolId: string;
    let courseId: string | undefined;
    let teacherId: string | undefined;

    // Verificar acceso según el tipo de entidad
    if (entityType === "course") {
      const course = await prisma.course.findFirst({
        where: { id: entityId },
        include: {
          school: {
            include: {
              users: {
                where: { userId: session.id },
              },
            },
          },
        },
      });

      if (!course || course.school.users.length === 0) {
        throw new Error("No tienes acceso a este curso");
      }

      schoolId = course.schoolId;
      courseId = course.id;
    } else {
      // entityType === 'teacher'
      const teacher = await prisma.teacher.findFirst({
        where: { id: entityId },
        include: {
          school: {
            include: {
              users: {
                where: { userId: session.id },
              },
            },
          },
        },
      });

      if (!teacher || teacher.school.users.length === 0) {
        throw new Error("No tienes acceso a este profesor");
      }

      schoolId = teacher.schoolId;
      teacherId = teacher.id;
    }

    const academicYear = new Date().getFullYear();

    // Si es horario de CURSO
    if (entityType === "course" && courseId) {
      let schedule = await prisma.schedule.findFirst({
        where: { courseId, academicYear, isActive: true },
      });

      if (!schedule) {
        const course = await prisma.course.findUnique({
          where: { id: courseId },
        });
        const startDate = new Date(academicYear, 0, 1);
        const endDate = new Date(academicYear, 11, 31);

        schedule = await prisma.schedule.create({
          data: {
            schoolId,
            courseId,
            name: `Horario ${course?.name} - ${academicYear}`,
            academicYear,
            semester: new Date().getMonth() < 6 ? 1 : 2,
            startDate,
            endDate,
            isActive: true,
          },
        });
      }

      // Eliminar bloques existentes
      await prisma.scheduleBlock.deleteMany({
        where: { scheduleId: schedule.id },
      });

      // Crear nuevos bloques (asignando PROFESORES a asignaturas del curso)
      for (const block of blocks) {
        const subject = await findOrCreateSubject(
          schoolId,
          block.subject,
          block.color
        );
        const blockTeacherId = block.teacher
          ? await findOrCreateTeacher(schoolId, block.teacher)
          : "";

        const duration = calculateDuration(block.startTime, block.endTime);
        const blockNumber = calculateBlockNumber(block.startTime);

        await prisma.scheduleBlock.create({
          data: {
            scheduleId: schedule.id,
            courseId,
            subjectId: subject.id,
            teacherId: blockTeacherId,
            dayOfWeek: block.day,
            blockNumber,
            startTime: block.startTime,
            endTime: block.endTime,
            duration,
          },
        });
      }

      revalidatePath("/schedules");
      return { success: true, scheduleId: schedule.id };
    }

    // Si es horario de PROFESOR
    if (entityType === "teacher" && teacherId) {
      // Eliminar todos los bloques donde este profesor está asignado
      await prisma.scheduleBlock.deleteMany({
        where: { teacherId },
      });

      // Crear nuevos bloques (asignando el profesor a CURSOS)
      for (const block of blocks) {
        if (!block.course) continue;

        const subject = await findOrCreateSubject(
          schoolId,
          block.subject,
          block.color
        );
        const blockCourseId = await findOrCreateCourse(schoolId, block.course);

        if (!blockCourseId) continue;

        // Buscar o crear schedule para ese curso
        let schedule = await prisma.schedule.findFirst({
          where: { courseId: blockCourseId, academicYear, isActive: true },
        });

        if (!schedule) {
          const course = await prisma.course.findUnique({
            where: { id: blockCourseId },
          });
          const startDate = new Date(academicYear, 0, 1);
          const endDate = new Date(academicYear, 11, 31);

          schedule = await prisma.schedule.create({
            data: {
              schoolId,
              courseId: blockCourseId,
              name: `Horario ${course?.name} - ${academicYear}`,
              academicYear,
              semester: new Date().getMonth() < 6 ? 1 : 2,
              startDate,
              endDate,
              isActive: true,
            },
          });
        }

        const duration = calculateDuration(block.startTime, block.endTime);
        const blockNumber = calculateBlockNumber(block.startTime);

        await prisma.scheduleBlock.create({
          data: {
            scheduleId: schedule.id,
            courseId: blockCourseId,
            subjectId: subject.id,
            teacherId,
            dayOfWeek: block.day,
            blockNumber,
            startTime: block.startTime,
            endTime: block.endTime,
            duration,
          },
        });
      }

      revalidatePath("/schedules");
      return { success: true };
    }

    throw new Error("Tipo de entidad no válido");
  } catch (error) {
    console.error("Error guardando horario:", error);
    throw error;
  }
}

/**
 * Eliminar un horario completo
 */
export async function deleteSchedule(scheduleId: string) {
  try {
    const session = await getSession();
    if (!session?.id) {
      throw new Error("No autorizado");
    }

    // Verificar acceso
    const schedule = await prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        school: {
          users: {
            some: { userId: session.id },
          },
        },
      },
    });

    if (!schedule) {
      throw new Error("No tienes acceso a este horario");
    }

    // Los bloques se eliminan en cascada
    await prisma.schedule.delete({
      where: { id: scheduleId },
    });

    revalidatePath("/schedules");
    return { success: true };
  } catch (error) {
    console.error("Error eliminando horario:", error);
    throw error;
  }
}

/**
 * Contar horarios del usuario
 */
export async function countSchedules() {
  try {
    const session = await getSession();
    if (!session?.id) {
      throw new Error("No autorizado");
    }

    const count = await prisma.schedule.count({
      where: {
        school: {
          users: {
            some: { userId: session.id },
          },
        },
        isActive: true,
      },
    });

    return count;
  } catch (error) {
    console.error("Error contando horarios:", error);
    return 0;
  }
}
