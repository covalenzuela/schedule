/**
 * 📅 Schedule Configuration Types
 * Sistema de configuración de horarios por nivel académico
 */

export type AcademicLevel = 'BASIC' | 'MIDDLE';

export interface BreakConfig {
  afterBlock: number;    // Después de qué bloque ocurre (1, 2, 3, ...)
  duration: number;      // Duración en minutos (múltiplo de 15)
  name: string;          // "Recreo", "Almuerzo", etc.
}

export interface ScheduleLevelConfig {
  id?: string;
  schoolId: string;
  academicLevel: AcademicLevel;
  startTime: string;     // "08:00"
  endTime: string;       // "17:00"
  blockDuration: number; // 45, 60, 90 (múltiplo de 15)
  breaks: BreakConfig[]; // Recreos explícitos
}

export interface TimeSlot {
  time: string;          // "08:00"
  endTime: string;       // "08:45"
  type: 'block' | 'break';
  blockNumber?: number;  // Solo para type='block'
  breakName?: string;    // Solo para type='break' ("Recreo", "Almuerzo")
}

// Configuración legacy (compatibilidad)
export interface LegacyScheduleConfig {
  startTime: string;
  endTime: string;
  blockDuration: number;
  breakDuration: number;
  lunchBreak: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  lunchBreakByDay?: Record<string, {enabled: boolean, start: string, end: string}>;
}

// Mapeo de nombres amigables
export const ACADEMIC_LEVEL_LABELS: Record<AcademicLevel, string> = {
  BASIC: 'Básica (1° a 8°)',
  MIDDLE: 'Media (1° a 4°)',
};

// Configuración por defecto para Básica
export const DEFAULT_BASIC_CONFIG: ScheduleLevelConfig = {
  schoolId: '',
  academicLevel: 'BASIC',
  startTime: '08:00',
  endTime: '17:00',
  blockDuration: 45,
  breaks: [
    { afterBlock: 2, duration: 15, name: 'Recreo' },
    { afterBlock: 4, duration: 15, name: 'Recreo' },
    { afterBlock: 6, duration: 45, name: 'Almuerzo' },
  ],
};

// Configuración por defecto para Media
export const DEFAULT_MIDDLE_CONFIG: ScheduleLevelConfig = {
  schoolId: '',
  academicLevel: 'MIDDLE',
  startTime: '08:00',
  endTime: '18:00',
  blockDuration: 90,
  breaks: [
    { afterBlock: 2, duration: 15, name: 'Recreo' },
    { afterBlock: 4, duration: 45, name: 'Almuerzo' },
    { afterBlock: 6, duration: 15, name: 'Recreo' },
  ],
};
