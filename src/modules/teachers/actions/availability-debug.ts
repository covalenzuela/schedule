/**
 * 🔍 Debug helper para disponibilidad de profesores
 */

"use server";

import { prisma } from "@/lib/prisma";

export async function checkTeacherAvailabilityDebug(
  teacherId: string,
  dayOfWeek: string,
  startTime: string,
  endTime: string,
  academicYear?: number
) {
  if (!teacherId) {
    return {
      isAvailable: true,
      reason: "Sin profesor asignado",
      availabilitySlots: []
    };
  }

  const year = academicYear || new Date().getFullYear();

  const availability = await prisma.teacherAvailability.findMany({
    where: {
      teacherId,
      academicYear: year,
      dayOfWeek
    },
    select: {
      startTime: true,
      endTime: true
    }
  });

  if (availability.length === 0) {
    return {
      isAvailable: false,
      reason: `Sin disponibilidad para ${dayOfWeek} en ${year}`,
      availabilitySlots: []
    };
  }

  const matchingSlot = availability.find(slot => 
    startTime >= slot.startTime && endTime <= slot.endTime
  );

  if (matchingSlot) {
    return {
      isAvailable: true,
      reason: `Slot ${matchingSlot.startTime}-${matchingSlot.endTime}`,
      availabilitySlots: availability.map(s => ({ start: s.startTime, end: s.endTime }))
    };
  }

  return {
    isAvailable: false,
    reason: `Bloque ${startTime}-${endTime} fuera de slots: ${availability.map(s => `${s.startTime}-${s.endTime}`).join(', ')}`,
    availabilitySlots: availability.map(s => ({ start: s.startTime, end: s.endTime }))
  };
}
