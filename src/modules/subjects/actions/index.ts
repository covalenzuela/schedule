/**
 * 📚 Server Actions - Subjects
 */

"use server";

import { prisma } from "@/lib/prisma";
import { getUserSchoolIds } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export async function getSubjects() {
  const schoolIds = await getUserSchoolIds();

  const subjects = await prisma.subject.findMany({
    where: {
      schoolId: {
        in: schoolIds,
      },
    },
    include: {
      school: {
        select: {
          name: true,
        },
      },
      teacherSubjects: {
        include: {
          teacher: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return subjects;
}

export async function getSubject(id: string) {
  const schoolIds = await getUserSchoolIds();

  const subject = await prisma.subject.findFirst({
    where: {
      id,
      schoolId: {
        in: schoolIds,
      },
    },
    include: {
      school: true,
      teacherSubjects: {
        include: {
          teacher: true,
        },
      },
    },
  });

  return subject;
}

export async function createSubject(data: {
  schoolId: string;
  name: string;
  code: string;
  description?: string;
  color?: string;
}) {
  const schoolIds = await getUserSchoolIds();

  // Debug: ver qué colegios tiene acceso el usuario
  console.log("User school IDs:", schoolIds);
  console.log("Trying to create subject in school:", data.schoolId);

  // Verificar que el usuario tiene acceso a esta escuela
  if (!schoolIds.includes(data.schoolId)) {
    throw new Error(
      `No tienes acceso a esta escuela. Tienes acceso a: ${schoolIds.join(
        ", "
      )}`
    );
  }

  const subject = await prisma.subject.create({
    data,
  });

  revalidatePath("/subjects");
  return subject;
}

export async function updateSubject(
  id: string,
  data: {
    name?: string;
    code?: string;
    description?: string;
    color?: string;
  }
) {
  const schoolIds = await getUserSchoolIds();

  const subject = await prisma.subject.update({
    where: {
      id,
      schoolId: {
        in: schoolIds,
      },
    },
    data,
  });

  revalidatePath("/subjects");
  return subject;
}

export async function deleteSubject(id: string) {
  const schoolIds = await getUserSchoolIds();

  await prisma.subject.delete({
    where: {
      id,
      schoolId: {
        in: schoolIds,
      },
    },
  });

  revalidatePath("/subjects");
}
