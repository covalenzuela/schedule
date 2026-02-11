/**
 * 📅 Helper para obtener el rango completo de horarios de un colegio
 * Considera TODAS las jornadas académicas (Básica y Media)
 */

"use server";

import { prisma } from "@/lib/prisma";
import { getUserSchoolIds } from "@/lib/auth-helpers";

export async function getSchoolScheduleRange(schoolId: string) {
  const schoolIds = await getUserSchoolIds();

  if (!schoolIds.includes(schoolId)) {
    throw new Error("No tienes acceso a este colegio");
  }

  // Obtener todas las configuraciones de nivel para el colegio
  const levelConfigs = await prisma.scheduleLevelConfig.findMany({
    where: { schoolId },
    select: {
      startTime: true,
      endTime: true,
      blockDuration: true,
    },
  });

  // Si no hay configuraciones de nivel, usar los campos legacy del colegio
  if (levelConfigs.length === 0) {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        scheduleStartTime: true,
        scheduleEndTime: true,
        blockDuration: true,
      },
    });

    if (!school) {
      throw new Error("Colegio no encontrado");
    }

    return {
      startTime: school.scheduleStartTime,
      endTime: school.scheduleEndTime,
      blockDuration: school.blockDuration,
      source: "legacy" as const,
    };
  }

  // Encontrar el rango más amplio
  const startTimes = levelConfigs.map((c) => c.startTime);
  const endTimes = levelConfigs.map((c) => c.endTime);

  // La hora más temprana de inicio
  const earliestStart = startTimes.reduce((min, time) =>
    time < min ? time : min
  );

  // La hora más tardía de fin
  const latestEnd = endTimes.reduce((max, time) => (time > max ? time : max));

  // Usar el blockDuration más pequeño para máxima flexibilidad
  const minBlockDuration = Math.min(
    ...levelConfigs.map((c) => c.blockDuration)
  );

  return {
    startTime: earliestStart,
    endTime: latestEnd,
    blockDuration: minBlockDuration,
    source: "levelConfigs" as const,
    details: levelConfigs.map((c) => ({
      start: c.startTime,
      end: c.endTime,
      duration: c.blockDuration,
    })),
  };
}
