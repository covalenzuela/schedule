/**
 * ⚙️ Schedule Configuration Actions
 * Manejo de configuración de horarios por nivel académico
 */

'use server';

import { prisma } from '@/lib/prisma';
import { getUserSchoolIds } from '@/lib/auth-helpers';
import type { ScheduleLevelConfig, AcademicLevel, BreakConfig } from '@/types/schedule-config';
import { markSchedulesAsDeprecatedForLevel } from '@/modules/schedules/actions/compatibility';
import { DEFAULT_BASIC_CONFIG, DEFAULT_MIDDLE_CONFIG } from '@/types/schedule-config';

/**
 * Obtener configuración de horario para un nivel específico
 */
export async function getScheduleConfigForLevel(
  schoolId: string,
  academicLevel: AcademicLevel
): Promise<ScheduleLevelConfig> {
  const schoolIds = await getUserSchoolIds();
  
  if (!schoolIds.includes(schoolId)) {
    throw new Error('No tienes acceso a este colegio');
  }

  const config = await prisma.scheduleLevelConfig.findUnique({
    where: {
      schoolId_academicLevel: {
        schoolId,
        academicLevel,
      },
    },
  });

  if (!config) {
    // Retornar configuración por defecto
    const defaultConfig = academicLevel === 'BASIC' 
      ? DEFAULT_BASIC_CONFIG 
      : DEFAULT_MIDDLE_CONFIG;
    
    return { ...defaultConfig, schoolId };
  }

  // Parsear breaks desde JSON
  const breaks: BreakConfig[] = JSON.parse(config.breaks);

  return {
    id: config.id,
    schoolId: config.schoolId,
    academicLevel: config.academicLevel as AcademicLevel,
    startTime: config.startTime,
    endTime: config.endTime,
    blockDuration: config.blockDuration,
    breaks,
  };
}

/**
 * Crear o actualizar configuración de horario para un nivel
 */
export async function saveScheduleConfigForLevel(
  config: ScheduleLevelConfig
): Promise<ScheduleLevelConfig> {
  const schoolIds = await getUserSchoolIds();
  
  if (!schoolIds.includes(config.schoolId)) {
    throw new Error('No tienes acceso a este colegio');
  }

  // Validar que blockDuration sea múltiplo de 15
  if (config.blockDuration % 15 !== 0) {
    throw new Error('La duración de bloques debe ser múltiplo de 15 minutos');
  }

  // Validar que las duraciones de recreos sean múltiplos de 15
  for (const breakConfig of config.breaks) {
    if (breakConfig.duration % 15 !== 0) {
      throw new Error('La duración de recreos debe ser múltiplo de 15 minutos');
    }
  }

  const breaksJson = JSON.stringify(config.breaks);

  // Obtener configuración previa para detectar cambios críticos
  const previousConfig = await prisma.scheduleLevelConfig.findUnique({
    where: {
      schoolId_academicLevel: {
        schoolId: config.schoolId,
        academicLevel: config.academicLevel,
      },
    },
  });

  // Detectar cambios críticos
  const hasCriticalChanges = previousConfig && (
    previousConfig.startTime !== config.startTime ||
    previousConfig.endTime !== config.endTime ||
    previousConfig.blockDuration !== config.blockDuration
  );

  const savedConfig = await prisma.scheduleLevelConfig.upsert({
    where: {
      schoolId_academicLevel: {
        schoolId: config.schoolId,
        academicLevel: config.academicLevel,
      },
    },
    create: {
      schoolId: config.schoolId,
      academicLevel: config.academicLevel,
      startTime: config.startTime,
      endTime: config.endTime,
      blockDuration: config.blockDuration,
      breaks: breaksJson,
    },
    update: {
      startTime: config.startTime,
      endTime: config.endTime,
      blockDuration: config.blockDuration,
      breaks: breaksJson,
    },
  });

  // Si hubo cambios críticos, marcar schedules existentes como obsoletos
  if (hasCriticalChanges) {
    await markSchedulesAsDeprecatedForLevel(config.schoolId, config.academicLevel);
  }

  return {
    id: savedConfig.id,
    schoolId: savedConfig.schoolId,
    academicLevel: savedConfig.academicLevel as AcademicLevel,
    startTime: savedConfig.startTime,
    endTime: savedConfig.endTime,
    blockDuration: savedConfig.blockDuration,
    breaks: JSON.parse(savedConfig.breaks),
  };
}

/**
 * Obtener configuración para un curso específico (basado en su nivel)
 */
export async function getScheduleConfigForCourse(
  courseId: string
): Promise<ScheduleLevelConfig> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      schoolId: true,
      academicLevel: true,
    },
  });

  if (!course) {
    throw new Error('Curso no encontrado');
  }

  return getScheduleConfigForLevel(
    course.schoolId,
    course.academicLevel as AcademicLevel
  );
}

/**
 * Obtener todas las configuraciones de un colegio
 */
export async function getAllScheduleConfigsForSchool(
  schoolId: string
): Promise<ScheduleLevelConfig[]> {
  const schoolIds = await getUserSchoolIds();
  
  if (!schoolIds.includes(schoolId)) {
    throw new Error('No tienes acceso a este colegio');
  }

  const configs = await prisma.scheduleLevelConfig.findMany({
    where: { schoolId },
  });

  return configs.map(config => ({
    id: config.id,
    schoolId: config.schoolId,
    academicLevel: config.academicLevel as AcademicLevel,
    startTime: config.startTime,
    endTime: config.endTime,
    blockDuration: config.blockDuration,
    breaks: JSON.parse(config.breaks),
  }));
}
