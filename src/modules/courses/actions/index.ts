/**
 * 🎓 Server Actions - Courses
 */

"use server";

import { prisma } from "@/lib/prisma";
import { getUserSchoolIds } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export async function getCourses() {
  const schoolIds = await getUserSchoolIds();

  const courses = await prisma.course.findMany({
    where: {
      schoolId: {
        in: schoolIds,
      },
    },
    include: {
      school: {
        select: {
          id: true,
          name: true,
        },
      },
      schedules: {
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ academicLevel: "asc" }, { grade: "asc" }, { section: "asc" }],
  });

  return courses;
}

export async function getCourse(id: string) {
  const schoolIds = await getUserSchoolIds();

  const course = await prisma.course.findFirst({
    where: {
      id,
      schoolId: {
        in: schoolIds,
      },
    },
    include: {
      school: true,
      schedules: true,
    },
  });

  return course;
}

export async function createCourse(data: {
  schoolId: string;
  name: string;
  grade: string;
  section: string;
  academicLevel: string;
  academicYear: number;
  studentCount?: number;
}) {
  const schoolIds = await getUserSchoolIds();

  // Verificar que el usuario tiene acceso a esta escuela
  if (!schoolIds.includes(data.schoolId)) {
    throw new Error("No tienes acceso a esta escuela");
  }

  const course = await prisma.course.create({
    data,
  });

  revalidatePath("/courses");
  return course;
}

export async function updateCourse(
  id: string,
  data: {
    name?: string;
    grade?: string;
    section?: string;
    academicLevel?: string;
    academicYear?: number;
    studentCount?: number;
  }
) {
  const schoolIds = await getUserSchoolIds();

  const course = await prisma.course.update({
    where: {
      id,
      schoolId: {
        in: schoolIds,
      },
    },
    data,
  });

  revalidatePath("/courses");
  return course;
}

export async function deleteCourse(id: string) {
  const schoolIds = await getUserSchoolIds();

  await prisma.course.delete({
    where: {
      id,
      schoolId: {
        in: schoolIds,
      },
    },
  });

  revalidatePath("/courses");
}

export async function countCourses() {
  const schoolIds = await getUserSchoolIds();

  const count = await prisma.course.count({
    where: {
      schoolId: {
        in: schoolIds,
      },
    },
  });

  return count;
}
