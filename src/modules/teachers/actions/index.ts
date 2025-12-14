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

export async function getTeacherAvailability(teacherId: string) {
  const schoolIds = await getUserSchoolIds();
  
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
      teacherId
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
  }>
) {
  console.log('[Server] setTeacherAvailability llamado');
  console.log('[Server] teacherId:', teacherId);
  console.log('[Server] availability count:', availability.length);
  
  const schoolIds = await getUserSchoolIds();
  
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

  // Eliminar disponibilidad existente
  const deleteResult = await prisma.teacherAvailability.deleteMany({
    where: {
      teacherId
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
  }
) {
  const schoolIds = await getUserSchoolIds();
  
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
 * Verifica si un profesor está disponible en un día y hora específicos
 * @returns true si está disponible, false si no
 */
export async function isTeacherAvailable(
  teacherId: string,
  dayOfWeek: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  // Si no hay teacherId, no hay conflicto
  if (!teacherId) {
    return true;
  }

  // Obtener disponibilidad del profesor para ese día
  const availability = await prisma.teacherAvailability.findMany({
    where: {
      teacherId,
      dayOfWeek
    }
  });

  // Si no tiene configurada disponibilidad para este día, NO está disponible
  if (availability.length === 0) {
    return false;
  }

  // Verificar si el rango solicitado está cubierto por algún slot de disponibilidad
  const hasAvailability = availability.some(slot => {
    // El profesor está disponible si el bloque cae completamente dentro de su disponibilidad
    return startTime >= slot.startTime && endTime <= slot.endTime;
  });

  return hasAvailability;
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
