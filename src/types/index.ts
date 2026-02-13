/**
 * 📘 Tipos del dominio - Sistema de Gestión de Horarios Escolares
 * 
 * Siguiendo principios de Domain-Driven Design (DDD)
 * Tipado estricto con TypeScript
 */

// ============================================
// 🏫 ESCUELAS (Schools)
// ============================================

export interface School {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateSchoolInput = Omit<School, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateSchoolInput = Partial<CreateSchoolInput> & { id: string };

// ============================================
// 👨‍🏫 PROFESORES (Teachers)
// ============================================

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export interface TimeSlot {
  startTime: string; // Format: "HH:mm" e.g., "08:00"
  endTime: string;   // Format: "HH:mm" e.g., "09:00"
}

export interface TeacherAvailability {
  teacherId: string;
  dayOfWeek: DayOfWeek;
  timeSlots: TimeSlot[];
}

export interface Teacher {
  id: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialization?: string;
  availability: TeacherAvailability[];
  subjectIds: string[]; // Asignaturas que puede dictar
  createdAt: Date;
  updatedAt: Date;
}

export type CreateTeacherInput = Omit<Teacher, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTeacherInput = Partial<CreateTeacherInput> & { id: string };

// ============================================
// 📚 ASIGNATURAS (Subjects)
// ============================================

export interface Subject {
  id: string;
  schoolId: string;
  name: string;
  code: string; // e.g., "MAT101", "FIS201"
  description?: string;
  color?: string; // Color para visualización en horario
  teacherIds: string[]; // Profesores que pueden dictar esta asignatura
  createdAt: Date;
  updatedAt: Date;
}

export type CreateSubjectInput = Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateSubjectInput = Partial<CreateSubjectInput> & { id: string };

// ============================================
// 🎓 CURSOS (Courses)
// ============================================

// Importar AcademicLevel desde schedule-config (fuente única de verdad)
import type { AcademicLevel } from './schedule-config';

export type { AcademicLevel } from './schedule-config';

export interface Course {
  id: string;
  schoolId: string;
  name: string; // e.g., "1° Básico A", "4° Medio B"
  grade: string; // e.g., "1", "2", "3"
  section: string; // e.g., "A", "B", "C"
  academicLevel: AcademicLevel; // BASIC o MIDDLE
  academicYear: number; // e.g., 2024, 2025
  studentCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateCourseInput = Omit<Course, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateCourseInput = Partial<CreateCourseInput> & { id: string };

// ============================================
// 🗓️ HORARIOS (Schedules)
// ============================================

export interface TimeBlock {
  id: string;
  blockNumber: number; // 1, 2, 3... (orden del bloque en el día)
  startTime: string; // "08:00"
  endTime: string;   // "08:45"
  duration: number;  // Duración en minutos
}

export interface ScheduleBlock {
  id: string;
  scheduleId: string;
  courseId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: DayOfWeek;
  timeBlock: TimeBlock;
  classroom?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Schedule {
  id: string;
  schoolId: string;
  courseId: string;
  name: string; // e.g., "Horario 1° Básico A - Semestre 1"
  academicYear: number;
  semester: 1 | 2;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  blocks: ScheduleBlock[];
  createdAt: Date;
  updatedAt: Date;
}

export type CreateScheduleInput = Omit<Schedule, 'id' | 'blocks' | 'createdAt' | 'updatedAt'>;
export type UpdateScheduleInput = Partial<CreateScheduleInput> & { id: string };

export type CreateScheduleBlockInput = Omit<
  ScheduleBlock, 
  'id' | 'createdAt' | 'updatedAt'
>;
export type UpdateScheduleBlockInput = Partial<CreateScheduleBlockInput> & { id: string };

// ============================================
// ⚠️ VALIDACIONES Y CONFLICTOS
// ============================================

export enum ConflictType {
  TEACHER_DOUBLE_BOOKING = 'TEACHER_DOUBLE_BOOKING', // Profesor en dos lugares al mismo tiempo
  TEACHER_UNAVAILABLE = 'TEACHER_UNAVAILABLE',       // Profesor no disponible en ese horario
  CLASSROOM_CONFLICT = 'CLASSROOM_CONFLICT',         // Sala ocupada
  COURSE_OVERLAP = 'COURSE_OVERLAP',                 // Curso con bloques superpuestos
  SUBJECT_TEACHER_MISMATCH = 'SUBJECT_TEACHER_MISMATCH', // Profesor no dicta esa asignatura
}

export interface ScheduleConflict {
  type: ConflictType;
  message: string;
  blockId: string;
  affectedBlocks?: string[];
  severity: 'error' | 'warning';
}

export interface ScheduleValidationResult {
  isValid: boolean;
  conflicts: ScheduleConflict[];
}

// ============================================
// 🔍 FILTROS Y BÚSQUEDA
// ============================================

export interface SchoolFilters {
  search?: string;
}

export interface TeacherFilters {
  schoolId?: string;
  subjectId?: string;
  search?: string;
}

export interface SubjectFilters {
  schoolId?: string;
  teacherId?: string;
  search?: string;
}

export interface CourseFilters {
  schoolId?: string;
  academicLevel?: AcademicLevel;
  academicYear?: number;
  search?: string;
}

export interface ScheduleFilters {
  schoolId?: string;
  courseId?: string;
  academicYear?: number;
  semester?: 1 | 2;
  isActive?: boolean;
}

// ============================================
// 📊 ESTADÍSTICAS Y REPORTES
// ============================================

export interface SchoolStatistics {
  totalTeachers: number;
  totalCourses: number;
  totalSubjects: number;
  totalStudents: number;
  activeSchedules: number;
}

export interface TeacherWorkload {
  teacherId: string;
  teacherName: string;
  totalHoursPerWeek: number;
  totalClasses: number;
  courses: string[];
  subjects: string[];
}

// ============================================
// 🎨 UI Y VISUALIZACIÓN
// ============================================

export interface WeekView {
  days: DayOfWeek[];
  timeBlocks: TimeBlock[];
}

export interface ScheduleGridCell {
  dayOfWeek: DayOfWeek;
  timeBlock: TimeBlock;
  scheduleBlock?: ScheduleBlock;
  hasConflict?: boolean;
}

export interface ScheduleGridData {
  schedule: Schedule;
  grid: ScheduleGridCell[][];
  conflicts: ScheduleConflict[];
}

// ============================================
// 🔐 CONSTANTES
// ============================================

export const DAYS_OF_WEEK: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: 'Lunes',
  [DayOfWeek.TUESDAY]: 'Martes',
  [DayOfWeek.WEDNESDAY]: 'Miércoles',
  [DayOfWeek.THURSDAY]: 'Jueves',
  [DayOfWeek.FRIDAY]: 'Viernes',
  [DayOfWeek.SATURDAY]: 'Sábado',
  [DayOfWeek.SUNDAY]: 'Domingo',
};

// Etiquetas de niveles académicos (importadas desde schedule-config)
export { ACADEMIC_LEVEL_LABELS } from './schedule-config';

export const DEFAULT_TIME_BLOCKS: TimeBlock[] = [
  { id: '1', blockNumber: 1, startTime: '08:00', endTime: '08:45', duration: 45 },
  { id: '2', blockNumber: 2, startTime: '08:45', endTime: '09:30', duration: 45 },
  { id: '3', blockNumber: 3, startTime: '09:45', endTime: '10:30', duration: 45 },
  { id: '4', blockNumber: 4, startTime: '10:30', endTime: '11:15', duration: 45 },
  { id: '5', blockNumber: 5, startTime: '11:30', endTime: '12:15', duration: 45 },
  { id: '6', blockNumber: 6, startTime: '12:15', endTime: '13:00', duration: 45 },
  { id: '7', blockNumber: 7, startTime: '14:00', endTime: '14:45', duration: 45 },
  { id: '8', blockNumber: 8, startTime: '14:45', endTime: '15:30', duration: 45 },
];
