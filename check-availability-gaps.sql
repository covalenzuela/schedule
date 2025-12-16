-- Script para verificar profesores con disponibilidad que necesita ajuste
-- Compara disponibilidad actual vs rango completo de jornadas

-- Ver configuraciones de nivel por colegio
SELECT 
  s.id as school_id,
  s.name as school_name,
  slc."academicLevel",
  slc."startTime",
  slc."endTime",
  slc."blockDuration"
FROM schools s
LEFT JOIN schedule_level_configs slc ON s.id = slc."schoolId"
ORDER BY s.name, slc."academicLevel";

-- Ver profesores y su disponibilidad actual
SELECT 
  t.id as teacher_id,
  t."firstName" || ' ' || t."lastName" as teacher_name,
  s.name as school_name,
  ta."dayOfWeek",
  ta."startTime" as avail_start,
  ta."endTime" as avail_end,
  ta."academicYear"
FROM teachers t
JOIN schools s ON t."schoolId" = s.id
LEFT JOIN teacher_availability ta ON t.id = ta."teacherId"
WHERE ta."academicYear" = 2025
ORDER BY s.name, teacher_name, ta."dayOfWeek", ta."startTime";

-- Verificar si hay gaps entre disponibilidad y jornadas
-- (Profesores cuya disponibilidad no cubre todas las jornadas)
WITH school_ranges AS (
  SELECT 
    "schoolId",
    MIN("startTime") as min_start,
    MAX("endTime") as max_end
  FROM schedule_level_configs
  GROUP BY "schoolId"
)
SELECT 
  t."firstName" || ' ' || t."lastName" as teacher,
  s.name as school,
  sr.min_start as school_start,
  sr.max_end as school_end,
  ta."dayOfWeek",
  ta."startTime" as avail_start,
  ta."endTime" as avail_end,
  CASE 
    WHEN ta."startTime" > sr.min_start THEN '⚠️ Empieza tarde'
    WHEN ta."endTime" < sr.max_end THEN '⚠️ Termina temprano'
    ELSE '✅ OK'
  END as status
FROM teachers t
JOIN schools s ON t."schoolId" = s.id
JOIN school_ranges sr ON s.id = sr."schoolId"
LEFT JOIN teacher_availability ta ON t.id = ta."teacherId"
WHERE ta."academicYear" = 2025
  AND (ta."startTime" > sr.min_start OR ta."endTime" < sr.max_end)
ORDER BY s.name, teacher;
