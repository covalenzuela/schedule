"use server";

import { prisma } from "@/lib/prisma";

export async function getTeacherAvailability(teacherId: string) {
  const year = new Date().getFullYear();

  const availability = await prisma.teacherAvailability.findMany({
    where: {
      teacherId,
      academicYear: year,
    },
    orderBy: [
      { dayOfWeek: "asc" },
      { startTime: "asc" },
    ],
  });

  return availability;
}
