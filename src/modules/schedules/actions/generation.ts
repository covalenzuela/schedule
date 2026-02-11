/**
 * 🤖 Algoritmo de Generación Automática de Horarios
 * Versión optimizada con reducción de queries N+1 y cacheo
 */

import { prisma } from "@/lib/prisma";
import { validateTeacherSchedule } from "@/modules/teachers/actions";
import type {
  ScheduleGenerationConfig,
  ScheduleGenerationResult,
  TimeSlot,
} from "../types";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

/**
 * Convierte tiempo HH:MM a minutos desde medianoche
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Convierte minutos desde medianoche a formato HH:MM
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/**
 * Genera slots de tiempo basados en configuración del colegio
 */
function generateTimeSlots(config: {
  startTime: string;
  endTime: string;
  blockDuration: number;
  breakDuration: number;
  lunchBreakConfig: Record<
    string,
    { enabled: boolean; start: string; end: string }
  >;
  day: string;
}): TimeSlot[] {
  const slots: TimeSlot[] = [];

  let currentMinutes = timeToMinutes(config.startTime);
  const endMinutes = timeToMinutes(config.endTime);

  // Obtener configuración de almuerzo para este día
  const lunchConfig = config.lunchBreakConfig[config.day];
  let lunchStartMinutes = 0;
  let lunchEndMinutes = 0;

  if (lunchConfig && lunchConfig.enabled) {
    lunchStartMinutes = timeToMinutes(lunchConfig.start);
    lunchEndMinutes = timeToMinutes(lunchConfig.end);
  }

  while (currentMinutes < endMinutes) {
    const blockEndMinutes = currentMinutes + config.blockDuration;

    // Verificar si este slot se solapa con el almuerzo
    const isLunchTime =
      lunchConfig &&
      lunchConfig.enabled &&
      currentMinutes >= lunchStartMinutes &&
      currentMinutes < lunchEndMinutes;

    if (!isLunchTime && blockEndMinutes <= endMinutes) {
      slots.push({
        startTime: minutesToTime(currentMinutes),
        endTime: minutesToTime(blockEndMinutes),
        duration: config.blockDuration,
      });
    }

    // Avanzar al siguiente bloque (bloque + recreo)
    currentMinutes += config.blockDuration + config.breakDuration;

    // Si estamos en el almuerzo, saltar al final del almuerzo
    if (
      lunchConfig &&
      lunchConfig.enabled &&
      currentMinutes > lunchStartMinutes &&
      currentMinutes < lunchEndMinutes
    ) {
      currentMinutes = lunchEndMinutes;
    }
  }

  return slots;
}

/**
 * Verifica si dos rangos de tiempo se solapan
 */
function timesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const start1Minutes = timeToMinutes(start1);
  const end1Minutes = timeToMinutes(end1);
  const start2Minutes = timeToMinutes(start2);
  const end2Minutes = timeToMinutes(end2);

  return (
    (start1Minutes >= start2Minutes && start1Minutes < end2Minutes) ||
    (start2Minutes >= start1Minutes && start2Minutes < end1Minutes)
  );
}

/**
 * Genera horario automáticamente para un curso
 */
export async function generateScheduleForCourse(
  config: ScheduleGenerationConfig
): Promise<ScheduleGenerationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const generatedBlocks: any[] = [];
  const startTime = Date.now();

  try {
    console.log(
      "[Generation] Iniciando generación para curso:",
      config.courseId
    );

    // 1. Cargar todos los datos necesarios de una vez (evitar N+1)
    const course = await prisma.course.findUnique({
      where: { id: config.courseId },
      include: {
        school: true,
      },
    });

    if (!course) {
      throw new Error("Curso no encontrado");
    }

    const schoolConfig = {
      startTime: course.school.scheduleStartTime,
      endTime: course.school.scheduleEndTime,
      blockDuration: course.school.blockDuration,
      breakDuration: course.school.breakDuration,
      lunchBreakConfig: JSON.parse(course.school.lunchBreakConfig),
    };

    // Cargar todas las asignaturas de una vez
    const subjects = await prisma.subject.findMany({
      where: {
        id: { in: config.subjects.map((s) => s.subjectId) },
      },
    });

    const subjectsMap = new Map(subjects.map((s) => [s.id, s]));

    // Cargar todos los profesores con su disponibilidad de una vez
    const allTeachers = await prisma.teacher.findMany({
      where: {
        schoolId: course.schoolId,
      },
      include: {
        availability: {
          where: { academicYear: config.academicYear },
        },
        teacherSubjects: {
          include: {
            subject: true,
          },
        },
      },
    });

    // Crear mapa de profesores por asignatura
    const teachersBySubject = new Map<string, typeof allTeachers>();
    config.subjects.forEach((sc) => {
      const subjectTeachers = allTeachers.filter((t) =>
        t.teacherSubjects.some((ts) => ts.subjectId === sc.subjectId)
      );

      // Priorizar profesor preferido si existe
      if (sc.preferredTeacherId) {
        const preferredIndex = subjectTeachers.findIndex(
          (t) => t.id === sc.preferredTeacherId
        );
        if (preferredIndex > 0) {
          const preferred = subjectTeachers.splice(preferredIndex, 1)[0];
          subjectTeachers.unshift(preferred);
        }
      }

      teachersBySubject.set(sc.subjectId, subjectTeachers);
    });

    console.log("[Generation] Datos cargados:", {
      subjects: subjects.length,
      teachers: allTeachers.length,
      duration: `${Date.now() - startTime}ms`,
    });

    // Cache para validaciones de profesores
    const teacherValidationCache = new Map<string, boolean>();

    const getCacheKey = (
      teacherId: string,
      day: string,
      startTime: string,
      endTime: string
    ) => `${teacherId}:${day}:${startTime}:${endTime}`;

    // 2. Rastreo de horas asignadas por asignatura
    const subjectHoursAssigned: Record<string, number> = {};
    config.subjects.forEach((s) => {
      subjectHoursAssigned[s.subjectId] = 0;
    });

    // Rastreo de bloques por día para cada profesor
    const teacherBlocksPerDay = new Map<string, Map<string, number>>();

    // Rastreo de bloques por día para cada asignatura (para distribución uniforme)
    const subjectBlocksPerDay = new Map<string, Map<string, number>>();
    config.subjects.forEach((s) => {
      subjectBlocksPerDay.set(s.subjectId, new Map());
    });

    // 3. Generar todos los slots de tiempo para toda la semana de una vez
    const allTimeSlots = new Map<string, TimeSlot[]>();
    for (const day of DAYS) {
      allTimeSlots.set(
        day,
        generateTimeSlots({
          ...schoolConfig,
          day,
        })
      );
    }

    // Crear lista de todas las combinaciones (día, slot, asignatura) para distribución uniforme
    type SlotAssignment = {
      day: string;
      slot: TimeSlot;
      subjectConfig: (typeof config.subjects)[0];
      subject: (typeof subjects)[0];
      priority: number;
    };

    const possibleAssignments: SlotAssignment[] = [];

    for (const day of DAYS) {
      const timeSlots = allTimeSlots.get(day)!;
      console.log(`[Generation] ${day}: ${timeSlots.length} slots disponibles`);

      for (const slot of timeSlots) {
        for (const subjectConfig of config.subjects) {
          const subject = subjectsMap.get(subjectConfig.subjectId);
          if (!subject) continue;

          // Calcular prioridad: asignaturas con menos bloques asignados tienen mayor prioridad
          const hoursAssigned = subjectHoursAssigned[subject.id] || 0;
          const hoursNeeded = subjectConfig.hoursPerWeek;
          const blocksThisDay =
            subjectBlocksPerDay.get(subject.id)!.get(day) || 0;

          // Prioridad más alta = más urgente de asignar
          // - Asignaturas con menos cobertura
          // - Días con menos bloques de esta asignatura
          const priority = (hoursNeeded - hoursAssigned) * 10 - blocksThisDay;

          possibleAssignments.push({
            day,
            slot,
            subjectConfig,
            subject,
            priority,
          });
        }
      }
    }

    // Ordenar asignaciones por prioridad (mayor a menor)
    possibleAssignments.sort((a, b) => b.priority - a.priority);

    console.log(
      `[Generation] Total de posibles asignaciones: ${possibleAssignments.length}`
    );

    // 4. Iterar sobre asignaciones en orden de prioridad
    for (const assignment of possibleAssignments) {
      const { day, slot, subjectConfig, subject } = assignment;

      // Calcular cuántas horas faltan por asignar
      const hoursAssigned = subjectHoursAssigned[subject.id] || 0;
      const hoursNeeded = subjectConfig.hoursPerWeek;

      if (hoursAssigned >= hoursNeeded) continue; // Ya completamos las horas

      // Verificar si el curso ya tiene un bloque en este horario
      const courseHasBlock = generatedBlocks.some(
        (b) =>
          b.day === day &&
          timesOverlap(b.startTime, b.endTime, slot.startTime, slot.endTime)
      );

      if (courseHasBlock) continue;

      // Verificar constraint: evitar bloques consecutivos de la misma asignatura
      if (config.constraints?.avoidConsecutiveBlocks) {
        const hasPreviousBlock = generatedBlocks.some(
          (b) =>
            b.day === day &&
            b.subjectId === subject.id &&
            b.endTime === slot.startTime
        );
        if (hasPreviousBlock) continue;
      }

      // Límite: máximo 2 bloques por día de la misma asignatura
      const blocksThisDay = subjectBlocksPerDay.get(subject.id)!.get(day) || 0;
      if (blocksThisDay >= 2) continue;

      // Obtener profesores disponibles
      const availableTeachers = teachersBySubject.get(subject.id) || [];

      if (availableTeachers.length === 0) {
        // Solo advertir una vez por asignatura
        if (!warnings.some((w) => w.includes(subject.name))) {
          warnings.push(`No hay profesores disponibles para ${subject.name}`);
        }
        continue;
      }

      // Intentar asignar un profesor
      let assigned = false;
      for (const teacher of availableTeachers) {
        // Verificar límite de bloques por día (máximo 4)
        const teacherDayKey = `${teacher.id}:${day}`;
        if (!teacherBlocksPerDay.has(teacherDayKey)) {
          teacherBlocksPerDay.set(teacherDayKey, new Map());
        }
        const dayBlocks = teacherBlocksPerDay.get(teacherDayKey)!;
        const blocksCount = dayBlocks.size;

        if (blocksCount >= 4) continue;

        // Verificar bloques consecutivos del mismo profesor
        const hasConsecutive = generatedBlocks.some(
          (b) =>
            b.day === day &&
            b.teacherId === teacher.id &&
            (b.endTime === slot.startTime || b.startTime === slot.endTime)
        );
        if (hasConsecutive) continue;

        // Usar cache para validación
        const cacheKey = getCacheKey(
          teacher.id,
          day,
          slot.startTime,
          slot.endTime
        );
        let isValid = teacherValidationCache.get(cacheKey);

        if (isValid === undefined) {
          const validation = await validateTeacherSchedule(
            teacher.id,
            day,
            slot.startTime,
            slot.endTime,
            { academicYear: config.academicYear }
          );
          isValid = validation.isValid;
          teacherValidationCache.set(cacheKey, isValid);
        }

        if (isValid) {
          // ✅ Asignar bloque
          const blockId = `gen-${Date.now()}-${generatedBlocks.length}`;

          generatedBlocks.push({
            id: blockId,
            day,
            startTime: slot.startTime,
            endTime: slot.endTime,
            subject: subject.name,
            subjectId: subject.id,
            teacher: `${teacher.firstName} ${teacher.lastName}`,
            teacherId: teacher.id,
            color: subject.color || "#3b82f6",
          });

          // Actualizar contadores
          const hoursInBlock = slot.duration / 60;
          subjectHoursAssigned[subject.id] += hoursInBlock;
          dayBlocks.set(slot.startTime, 1);

          // Actualizar contador de bloques por día de la asignatura
          const currentDayBlocks =
            subjectBlocksPerDay.get(subject.id)!.get(day) || 0;
          subjectBlocksPerDay.get(subject.id)!.set(day, currentDayBlocks + 1);

          assigned = true;
          break;
        }
      }
    }

    // 5. Calcular estadísticas
    const totalRequiredHours = config.subjects.reduce(
      (sum, s) => sum + s.hoursPerWeek,
      0
    );
    const totalAssignedBlocks = generatedBlocks.length;

    const uniqueTeachers = new Set(generatedBlocks.map((b) => b.teacherId))
      .size;

    const subjectsCoverage = config.subjects.map((s) => {
      const assigned = subjectHoursAssigned[s.subjectId] || 0;
      const required = s.hoursPerWeek;
      return {
        subject: s.subjectName,
        required,
        assigned,
        percentage: Math.round((assigned / required) * 100),
      };
    });

    const totalAssignedHours = Object.values(subjectHoursAssigned).reduce(
      (sum, hours) => sum + hours,
      0
    );
    const coveragePercentage = Math.round(
      (totalAssignedHours / totalRequiredHours) * 100
    );

    // Agregar warnings para asignaturas incompletas
    subjectsCoverage.forEach((sc) => {
      if (sc.percentage < 100) {
        warnings.push(
          `${sc.subject}: solo se asignaron ${sc.assigned}/${sc.required} horas (${sc.percentage}%)`
        );
      }
    });

    const totalTime = Date.now() - startTime;

    console.log("[Generation] ✅ Generación completada:");
    console.log(`  - Tiempo total: ${totalTime}ms`);
    console.log(`  - Bloques generados: ${totalAssignedBlocks}`);
    console.log(`  - Profesores utilizados: ${uniqueTeachers}`);
    console.log(`  - Cobertura: ${coveragePercentage}%`);
    console.log(`  - Cache hits: ${teacherValidationCache.size} validaciones`);

    return {
      success: errors.length === 0,
      blocks: generatedBlocks,
      errors,
      warnings,
      stats: {
        totalBlocks: totalAssignedBlocks,
        teachersUsed: uniqueTeachers,
        coveragePercentage,
        subjectsCoverage,
        generationTimeMs: totalTime,
      },
    };
  } catch (error) {
    console.error("[Generation] ❌ Error generando horario:", error);
    return {
      success: false,
      errors: [error instanceof Error ? error.message : "Error desconocido"],
    };
  }
}
