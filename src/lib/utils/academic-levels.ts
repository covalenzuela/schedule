/**
 * 🎓 Utilidades para manejar niveles académicos activos
 */

import type { AcademicLevel } from "@/types/schedule-config";

/**
 * Convierte el string de niveles activos a array
 * @example "BASIC,MIDDLE" -> ["BASIC", "MIDDLE"]
 * @example "BASIC" -> ["BASIC"]
 */
export function parseActiveAcademicLevels(
  activeAcademicLevels: string
): AcademicLevel[] {
  return activeAcademicLevels.split(",").filter(Boolean) as AcademicLevel[];
}

/**
 * Convierte array de niveles a string
 * @example ["BASIC", "MIDDLE"] -> "BASIC,MIDDLE"
 */
export function serializeActiveAcademicLevels(
  levels: AcademicLevel[]
): string {
  return levels.join(",");
}

/**
 * Verifica si un nivel está activo en el colegio
 */
export function isLevelActive(
  schoolActiveLevels: string,
  level: AcademicLevel
): boolean {
  return parseActiveAcademicLevels(schoolActiveLevels).includes(level);
}

/**
 * Valida que un nivel sea uno de los activos del colegio
 */
export function validateLevelIsActive(
  schoolActiveLevels: string,
  level: AcademicLevel
): { valid: boolean; error?: string } {
  const activeLevels = parseActiveAcademicLevels(schoolActiveLevels);

  if (!activeLevels.includes(level)) {
    const levelLabels = {
      BASIC: "Educación Básica",
      MIDDLE: "Educación Media",
    };

    return {
      valid: false,
      error: `El nivel ${levelLabels[level]} no está activo en este colegio. Niveles activos: ${activeLevels.map((l) => levelLabels[l]).join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Obtiene los niveles activos con sus labels
 */
export function getActiveLevelsWithLabels(schoolActiveLevels: string): Array<{
  value: AcademicLevel;
  label: string;
  emoji: string;
}> {
  const activeLevels = parseActiveAcademicLevels(schoolActiveLevels);

  const allLevels = [
    { value: "BASIC" as const, label: "Educación Básica (1° - 8°)", emoji: "🎒" },
    { value: "MIDDLE" as const, label: "Educación Media (1° - 4°)", emoji: "🎓" },
  ];

  return allLevels.filter((level) => activeLevels.includes(level.value));
}
