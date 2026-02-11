/**
 * 🤖 Tipos para Generación Automática de Horarios
 */

/**
 * Configuración para generación automática de horarios
 */
export interface ScheduleGenerationConfig {
  courseId: string;
  academicYear: number;

  // Asignaturas requeridas con horas semanales
  subjects: Array<{
    subjectId: string;
    subjectName: string;
    hoursPerWeek: number;
    preferredTeacherId?: string; // Profesor preferido (opcional)
  }>;

  // Restricciones
  constraints?: {
    maxBlocksPerDay?: number; // Máximo bloques por día (default: sin límite)
    avoidConsecutiveBlocks?: boolean; // Evitar bloques consecutivos de la misma asignatura
    preferredDays?: string[]; // Días preferidos para ciertas asignaturas
  };
}

/**
 * Resultado de la generación
 */
export interface ScheduleGenerationResult {
  success: boolean;
  blocks?: Array<{
    id: string;
    day: string;
    startTime: string;
    endTime: string;
    subject: string;
    subjectId: string;
    teacher: string;
    teacherId: string;
    color: string;
  }>;
  errors?: string[];
  warnings?: string[];
  stats?: {
    totalBlocks: number;
    teachersUsed: number;
    coveragePercentage: number; // % de horas requeridas cubiertas
    generationTimeMs?: number; // Tiempo de generación en ms
    subjectsCoverage: Array<{
      subject: string;
      required: number;
      assigned: number;
      percentage: number;
    }>;
  };
}

/**
 * Slot de tiempo disponible
 */
export interface TimeSlot {
  startTime: string;
  endTime: string;
  duration: number; // en minutos
}
