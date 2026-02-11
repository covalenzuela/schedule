"use server";

import { getScheduleConfigForCourse, getScheduleConfigForTeacher } from "./schedule-config";
import { prisma } from "@/lib/prisma";
import type { ScheduleLevelConfig } from "@/types/schedule-config";

/**
 * Centraliza la obtención de la configuración de jornada para cursos y profesores.
 * - Para cursos: usa getScheduleConfigForCourse
 * - Para profesores: busca todos los cursos asignados y usa la jornada más temprana de esos cursos
 *   (si no tiene cursos asignados, usa la más amplia del colegio como fallback)
 */
export async function getScheduleConfigForEntity(
  entityType: "course" | "teacher",
  entityId: string
): Promise<ScheduleLevelConfig> {
  if (entityType === "course") {
    return getScheduleConfigForCourse(entityId);
  }

  // entityType === "teacher"
  // Buscar todos los cursos a los que está asignado el profesor
  const blocks = await prisma.scheduleBlock.findMany({
    where: { teacherId: entityId },
    include: { course: true },
  });
  const courseIds = Array.from(
    new Set(blocks.map((b) => b.course?.id).filter(Boolean))
  ) as string[];

  // Si el profesor tiene cursos asignados, obtener la jornada más temprana de esos cursos
  if (courseIds.length > 0) {
    const configs = await Promise.all(
      courseIds.map((courseId) => getScheduleConfigForCourse(courseId))
    );
    // Ordenar por startTime más temprano
    configs.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return configs[0];
  }

  // Si no tiene cursos asignados, fallback a la lógica original
  return getScheduleConfigForTeacher(entityId);
}
