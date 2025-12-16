"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { validateTeacherSchedule, hasTeacherScheduleConflict } from "@/modules/teachers/actions";
import { generateScheduleForCourse } from "./generation";
import type { ScheduleGenerationConfig } from "../types";

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

async function findTeacherById(
  teacherId: string
): Promise<string | null> {
  // Solo buscar profesor por ID, no crear
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
  });

  return teacher ? teacher.id : null;
}

async function findOrCreateCourse(
  schoolId: string,
  name: string
): Promise<string | undefined> {
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

  return course?.id;
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
  teacherId?: string; // ID del profesor
  course?: string;
  courseId?: string; // ID del curso
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
      `[getSchedulesForCourse] 🔍 Buscando schedules para curso: ${courseId}, año: ${currentYear}`
    );

    const schedules = await prisma.schedule.findMany({
      where: {
        courseId,
        academicYear: currentYear,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        isDeprecated: true,
        configSnapshot: true,
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
      `[getSchedulesForCourse] ✅ Encontrados ${schedules.length} schedules`
    );
    if (schedules.length > 0) {
      console.log(
        `[getSchedulesForCourse] 📋 Schedule ID: ${schedules[0].id}, Total Bloques: ${schedules[0].blocks.length}`
      );
      schedules[0].blocks.forEach((b, idx) => {
        console.log(
          `[getSchedulesForCourse] Bloque ${idx + 1}: ${b.dayOfWeek} ${b.startTime}-${b.endTime} | ${b.subject.name} | Profesor: ${b.teacher ? `${b.teacher.firstName} ${b.teacher.lastName}` : 'Sin asignar'}`
        );
      });
    }

    // Revalidar la ruta para asegurar datos frescos
    revalidatePath("/schedules");
    revalidatePath("/schedules/editor");

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
      // Obtener el schedule primero para excluir sus bloques en la validación
      let schedule = await prisma.schedule.findFirst({
        where: { courseId, academicYear, isActive: true },
      });

      // ✨ VALIDACIÓN: Verificar SOLO conflictos reales (bloques en otros cursos)
      // La disponibilidad declarada se muestra como warning visual, pero NO bloquea
      const validationErrors: string[] = [];

      for (const block of blocks) {
        if (!block.teacherId) continue;

        // Verificar solo conflictos reales (bloques asignados en otros horarios)
        const conflictCheck = await hasTeacherScheduleConflict(
          block.teacherId,
          block.day,
          block.startTime,
          block.endTime,
          undefined, // excludeBlockId
          academicYear,
          schedule?.id // Excluir bloques del horario actual
        );

        // Solo bloquear si hay conflictos REALES con otros cursos
        if (conflictCheck.hasConflict) {
          const teacherInfo = await prisma.teacher.findUnique({
            where: { id: block.teacherId },
          });
          const teacherName = teacherInfo
            ? `${teacherInfo.firstName} ${teacherInfo.lastName}`
            : 'Profesor';

          const conflictMessages = conflictCheck.conflictingBlocks!.map(
            (conflict) =>
              `Ya asignado en ${conflict.schoolName} - ${conflict.courseName} (${conflict.startTime}-${conflict.endTime})`
          );

          validationErrors.push(
            `${teacherName} (${block.subject}, ${block.day} ${block.startTime}-${block.endTime}): ${conflictMessages.join(', ')}`
          );
        }
      }

      // Si hay conflictos reales, devolver como warnings en lugar de bloquear
      const warnings = validationErrors.length > 0 ? validationErrors : undefined;

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
        
        // Usar teacherId si está disponible, sino buscar por nombre (legacy)
        let blockTeacherId = "";
        if (block.teacherId) {
          // Verificar que el profesor existe
          const teacherExists = await findTeacherById(block.teacherId);
          if (teacherExists) {
            blockTeacherId = block.teacherId;
          } else {
            console.warn(`[saveSchedule] Profesor con ID ${block.teacherId} no encontrado`);
          }
        }

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
      return { 
        success: true, 
        scheduleId: schedule.id,
        warnings: warnings // Incluir warnings si existen
      };
    }

    // Si es horario de PROFESOR
    if (entityType === "teacher" && teacherId) {
      // Eliminar todos los bloques donde este profesor está asignado
      await prisma.scheduleBlock.deleteMany({
        where: { teacherId },
      });

      // Crear nuevos bloques (asignando el profesor a CURSOS)
      for (const block of blocks) {
        // Usar courseId si está disponible
        let blockCourseId = block.courseId;
        
        // Si no hay courseId pero hay nombre de curso, buscar/crear (legacy)
        if (!blockCourseId && block.course) {
          blockCourseId = await findOrCreateCourse(schoolId, block.course);
        }
        
        if (!blockCourseId) continue;

        const subject = await findOrCreateSubject(
          schoolId,
          block.subject,
          block.color
        );

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

/**
 * Genera y guarda horario automáticamente
 * @param config - Configuración de generación con asignaturas y restricciones
 * @returns Resultado de la generación con estadísticas
 */
export async function generateAndSaveSchedule(
  config: ScheduleGenerationConfig
) {
  const session = await getSession();
  if (!session?.id) {
    throw new Error("No autorizado");
  }

  console.log("[generateAndSaveSchedule] Iniciando generación automática");

  // Verificar acceso al curso
  const course = await prisma.course.findFirst({
    where: {
      id: config.courseId,
      school: {
        users: {
          some: { userId: session.id },
        },
      },
    },
  });

  if (!course) {
    throw new Error("No tienes acceso a este curso");
  }

  console.log("[generateAndSaveSchedule] Curso validado:", course.name);

  // Generar horario
  const result = await generateScheduleForCourse(config);

  console.log("[generateAndSaveSchedule] Resultado de generación:", {
    success: result.success,
    blocksCount: result.blocks?.length || 0,
    errorsCount: result.errors?.length || 0,
    warningsCount: result.warnings?.length || 0,
  });

  if (!result.success || !result.blocks || result.blocks.length === 0) {
    const errorMsg = result.errors?.join(", ") || "No se pudo generar horario";
    throw new Error(`Error generando horario: ${errorMsg}`);
  }

  // Guardar usando la función existente
  console.log("[generateAndSaveSchedule] Guardando bloques generados...");
  
  try {
    await saveSchedule({
      entityId: config.courseId,
      entityType: "course",
      blocks: result.blocks,
    });

    console.log("[generateAndSaveSchedule] Horario guardado exitosamente");
  } catch (saveError) {
    console.error("[generateAndSaveSchedule] Error al guardar:", saveError);
    throw new Error(
      `El horario se generó pero no se pudo guardar: ${
        saveError instanceof Error ? saveError.message : "Error desconocido"
      }`
    );
  }

  revalidatePath("/schedules");
  return result;
}
