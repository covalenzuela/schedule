-- Verificar disponibilidad de Laura Fernández
SELECT 
  t.id,
  t."firstName",
  t."lastName",
  ta."dayOfWeek",
  ta."startTime",
  ta."endTime",
  ta."academicYear"
FROM teachers t
LEFT JOIN teacher_availability ta ON t.id = ta."teacherId"
WHERE t."firstName" = 'Laura' AND t."lastName" = 'Fernández'
ORDER BY ta."academicYear", ta."dayOfWeek", ta."startTime";
