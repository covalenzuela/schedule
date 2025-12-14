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
  
  await prisma.teacher.delete({
    where: {
      id,
      schoolId: {
        in: schoolIds
      }
    }
  });

  revalidatePath('/teachers');
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
