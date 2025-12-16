/**
 * 👨‍🏫 Server Actions - Teachers
 */

'use server';

import { prisma } from '@/lib/prisma';
import { getUserSchoolIds } from '@/lib/auth-helpers';
import { revalidatePath } from 'next/cache';

export async function getTeachers() {
  const schoolIds = await getUserSchoolIds();
  
  const teachers = await prisma.teacher.findMany({
    where: {
      schoolId: {
        in: schoolIds
      }
    },
    include: {
      school: {
        select: {
          id: true,
          name: true
        }
      },
      teacherSubjects: {
        include: {
          subject: {
            select: {
              name: true,
              code: true
            }
          }
        }
      },
      availability: true
    },
    orderBy: {
      lastName: 'asc'
    }
  });

  return teachers;
}

export async function getTeacher(id: string) {
  const schoolIds = await getUserSchoolIds();
  
  const teacher = await prisma.teacher.findFirst({
    where: {
      id,
      schoolId: {
        in: schoolIds
      }
    },
    include: {
      school: true,
      teacherSubjects: {
        include: {
          subject: true
        }
      },
      availability: true
    }
  });

  return teacher;
}

export async function createTeacher(data: {
  schoolId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialization?: string;
}) {
  const schoolIds = await getUserSchoolIds();
  
  // Verificar que el usuario tiene acceso a esta escuela
  if (!schoolIds.includes(data.schoolId)) {
    throw new Error('No tienes acceso a esta escuela');
  }

  const teacher = await prisma.teacher.create({
    data
  });

  revalidatePath('/teachers');
  return teacher;
}

export async function updateTeacher(id: string, data: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  specialization?: string;
}) {
  const schoolIds = await getUserSchoolIds();
  
  const teacher = await prisma.teacher.update({
    where: {
      id,
      schoolId: {
        in: schoolIds
      }
    },
    data
  });

  revalidatePath('/teachers');
  return teacher;
}

export async function deleteTeacher(id: string) {
  const schoolIds = await getUserSchoolIds();
  
  // Eliminar registros relacionados primero para evitar violación de FK
  // 1. Eliminar bloques de horario donde este profesor está asignado
  await prisma.scheduleBlock.deleteMany({
    where: {
      teacherId: id
    }
  });
  
  // 2. Eliminar disponibilidad del profesor
  await prisma.teacherAvailability.deleteMany({
    where: {
      teacherId: id
    }
  });
  
  // 3. Ahora sí podemos eliminar el profesor
  await prisma.teacher.delete({
    where: {
      id,
      schoolId: {
        in: schoolIds
      }
    }
  });

  revalidatePath('/teachers');
  revalidatePath('/schedules');
}

export async function countTeachers() {
  const schoolIds = await getUserSchoolIds();
  
  const count = await prisma.teacher.count({
    where: {
      schoolId: {
        in: schoolIds
      }
    }
  });

  return count;
}

// ============================================
// 📅 TEACHER AVAILABILITY ACTIONS
// ============================================

export async function getTeacherAvailability(
  teacherId: string,
  academicYear?: number
) {
  const schoolIds = await getUserSchoolIds();
  const year = academicYear || new Date().getFullYear();
  
  // Verificar que el profesor pertenece a una escuela del usuario
  const teacher = await prisma.teacher.findFirst({
    where: {
      id: teacherId,
      schoolId: {
        in: schoolIds
      }
    }
  });

  if (!teacher) {
    throw new Error('Profesor no encontrado o no tienes acceso');
  }

  const availability = await prisma.teacherAvailability.findMany({
    where: {
      teacherId,
      academicYear: year
    },
    orderBy: [
      { dayOfWeek: 'asc' },
      { startTime: 'asc' }
    ]
  });

  return availability;
}

export async function setTeacherAvailability(
  teacherId: string,
  availability: Array<{
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }>,
  academicYear?: number
) {
  console.log('[Server] setTeacherAvailability llamado');
  console.log('[Server] teacherId:', teacherId);
  console.log('[Server] availability count:', availability.length);
  
  const schoolIds = await getUserSchoolIds();
  const year = academicYear || new Date().getFullYear();
  
  // Verificar que el profesor pertenece a una escuela del usuario
  const teacher = await prisma.teacher.findFirst({
    where: {
      id: teacherId,
      schoolId: {
        in: schoolIds
      }
    }
  });

  if (!teacher) {
    console.log('[Server] Profesor no encontrado');
    throw new Error('Profesor no encontrado o no tienes acceso');
  }

  // Eliminar disponibilidad existente para este año
  const deleteResult = await prisma.teacherAvailability.deleteMany({
    where: {
      teacherId,
      academicYear: year
    }
  });
  console.log('[Server] Registros eliminados:', deleteResult.count);

  // Crear nueva disponibilidad
  if (availability.length > 0) {
    // Validar que todos los slots tengan los campos requeridos
    const validSlots = availability.filter(slot => 
      slot.dayOfWeek && slot.startTime && slot.endTime
    );
    
    console.log('[Server] Slots válidos:', validSlots.length);
    
    if (validSlots.length > 0) {
      const createResult = await prisma.teacherAvailability.createMany({
        data: validSlots.map(slot => ({
          teacherId,
          academicYear: year,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime
        }))
      });
      console.log('[Server] Registros creados:', createResult.count);
    }
  }

  revalidatePath('/teachers');
  console.log('[Server] Disponibilidad guardada exitosamente');
  return { success: true };
}

export async function addTeacherAvailabilitySlot(
  teacherId: string,
  slot: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  },
  academicYear?: number
) {
  const schoolIds = await getUserSchoolIds();
  const year = academicYear || new Date().getFullYear();
  
  const teacher = await prisma.teacher.findFirst({
    where: {
      id: teacherId,
      schoolId: {
        in: schoolIds
      }
    }
  });

  if (!teacher) {
    throw new Error('Profesor no encontrado o no tienes acceso');
  }

  const availability = await prisma.teacherAvailability.create({
    data: {
      teacherId,
      academicYear: year,
      ...slot
    }
  });

  revalidatePath('/teachers');
  return availability;
}

export async function deleteTeacherAvailabilitySlot(slotId: string) {
  const schoolIds = await getUserSchoolIds();
  
  // Verificar que el slot pertenece a un profesor de una escuela del usuario
  const slot = await prisma.teacherAvailability.findUnique({
    where: { id: slotId },
    include: {
      teacher: true
    }
  });

  if (!slot || !schoolIds.includes(slot.teacher.schoolId)) {
    throw new Error('No tienes acceso a este registro');
  }

  await prisma.teacherAvailability.delete({
    where: { id: slotId }
  });

  revalidatePath('/teachers');
  return { success: true };
}

/**
 * Función auxiliar: Verifica si dos rangos de tiempo se solapan
 */
function timesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const [h1, m1] = start1.split(':').map(Number);
  const [h2, m2] = end1.split(':').map(Number);
  const [h3, m3] = start2.split(':').map(Number);
  const [h4, m4] = end2.split(':').map(Number);

  const start1Minutes = h1 * 60 + m1;
  const end1Minutes = h2 * 60 + m2;
  const start2Minutes = h3 * 60 + m3;
  const end2Minutes = h4 * 60 + m4;

  // Hay solapamiento si:
  // - start1 está dentro de [start2, end2)
  // - start2 está dentro de [start1, end1)
  return (
    (start1Minutes >= start2Minutes && start1Minutes < end2Minutes) ||
    (start2Minutes >= start1Minutes && start2Minutes < end1Minutes)
  );
}

/**
 * Verifica si un profesor está disponible en un día y hora específicos
 * @param academicYear - Año académico (por defecto año actual)
 * @returns true si está disponible, false si no
 */
export async function isTeacherAvailable(
  teacherId: string,
  dayOfWeek: string,
  startTime: string,
  endTime: string,
  academicYear?: number
): Promise<boolean> {
  // Si no hay teacherId, no hay conflicto
  if (!teacherId) {
    return true;
  }

  const year = academicYear || new Date().getFullYear();

  // Obtener disponibilidad del profesor para ese día y año
  const availability = await prisma.teacherAvailability.findMany({
    where: {
      teacherId,
      academicYear: year,
      dayOfWeek
    }
  });

  // Si no tiene configurada disponibilidad para este día/año, NO está disponible
  if (availability.length === 0) {
    return false;
  }

  // Verificar si el rango solicitado está cubierto por algún slot de disponibilidad
  const hasAvailability = availability.some(slot => {
    const isWithinSlot = startTime >= slot.startTime && endTime <= slot.endTime;
    return isWithinSlot;
  });

  return hasAvailability;
}

/**
 * Verifica si un profesor YA ESTÁ ASIGNADO en otro horario a la misma hora
 * (Valida conflictos cross-school)
 * @returns Información sobre conflictos encontrados
 */
export async function hasTeacherScheduleConflict(
  teacherId: string,
  dayOfWeek: string,
  startTime: string,
  endTime: string,
  excludeBlockId?: string,
  academicYear?: number,
  excludeScheduleId?: string
): Promise<{
  hasConflict: boolean;
  conflictingBlocks?: Array<{
    courseId: string;
    courseName: string;
    schoolName: string;
    startTime: string;
    endTime: string;
  }>;
}> {
  const year = academicYear || new Date().getFullYear();

  // Buscar bloques existentes del profesor que se solapen
  const conflictingBlocks = await prisma.scheduleBlock.findMany({
    where: {
      teacherId,
      dayOfWeek,
      schedule: {
        academicYear: year,
        isActive: true,
        // Excluir todos los bloques del horario que estamos editando
        ...(excludeScheduleId ? { NOT: { id: excludeScheduleId } } : {}),
      },
      // Excluir el bloque actual si es edición
      ...(excludeBlockId ? { NOT: { id: excludeBlockId } } : {}),
    },
    include: {
      course: {
        include: {
          school: true,
        },
      },
    },
  });

  // Filtrar bloques que se solapan en tiempo
  const overlapping = conflictingBlocks.filter((block) => {
    return timesOverlap(
      block.startTime,
      block.endTime,
      startTime,
      endTime
    );
  });

  if (overlapping.length === 0) {
    return { hasConflict: false };
  }

  return {
    hasConflict: true,
    conflictingBlocks: overlapping.map((block) => ({
      courseId: block.courseId,
      courseName: block.course.name,
      schoolName: block.course.school.name,
      startTime: block.startTime,
      endTime: block.endTime,
    })),
  };
}

/**
 * Validación COMPLETA de disponibilidad del profesor
 * Combina disponibilidad declarada + conflictos reales
 */
export async function validateTeacherSchedule(
  teacherId: string,
  dayOfWeek: string,
  startTime: string,
  endTime: string,
  options?: {
    excludeBlockId?: string;
    academicYear?: number;
    excludeScheduleId?: string;
  }
): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Verificar disponibilidad DECLARADA
  const hasAvailability = await isTeacherAvailable(
    teacherId,
    dayOfWeek,
    startTime,
    endTime,
    options?.academicYear
  );

  if (!hasAvailability) {
    errors.push(
      'El profesor no tiene disponibilidad declarada en este horario'
    );
  }

  // 2. Verificar conflictos REALES (bloques ya asignados)
  const conflictCheck = await hasTeacherScheduleConflict(
    teacherId,
    dayOfWeek,
    startTime,
    endTime,
    options?.excludeBlockId,
    options?.academicYear,
    options?.excludeScheduleId
  );

  if (conflictCheck.hasConflict) {
    const conflictMessages = conflictCheck.conflictingBlocks!.map(
      (block) =>
        `Ya asignado en ${block.schoolName} - ${block.courseName} (${block.startTime}-${block.endTime})`
    );
    errors.push(...conflictMessages);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Obtiene todos los profesores con su disponibilidad para un día específico
 */
export async function getTeachersWithAvailability(dayOfWeek?: string) {
  const schoolIds = await getUserSchoolIds();
  
  const teachers = await prisma.teacher.findMany({
    where: {
      schoolId: {
        in: schoolIds
      }
    },
    include: {
      availability: dayOfWeek ? {
        where: {
          dayOfWeek
        }
      } : true
    },
    orderBy: {
      lastName: 'asc'
    }
  });

  return teachers;
}
