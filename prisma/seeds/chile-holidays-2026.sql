-- Días feriados y especiales de Chile 2026
-- Este script agrega los feriados nacionales principales

-- Nota: Ajustar el schoolId según corresponda
-- Este ejemplo usa 'school-id-placeholder' que debe ser reemplazado

-- Año Nuevo
INSERT INTO special_days (id, "schoolId", date, name, type, description, recurring, "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  id,
  '2026-01-01'::date,
  'Año Nuevo',
  'holiday',
  'Feriado Nacional - Celebración del Año Nuevo',
  true,
  true,
  NOW(),
  NOW()
FROM schools;

-- Viernes Santo (se ajusta cada año según calendario litúrgico)
INSERT INTO special_days (id, "schoolId", date, name, type, description, recurring, "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  id,
  '2026-04-03'::date,
  'Viernes Santo',
  'holiday',
  'Feriado Religioso',
  false,
  true,
  NOW(),
  NOW()
FROM schools;

-- Sábado Santo
INSERT INTO special_days (id, "schoolId", date, name, type, description, recurring, "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  id,
  '2026-04-04'::date,
  'Sábado Santo',
  'holiday',
  'Feriado Religioso',
  false,
  true,
  NOW(),
  NOW()
FROM schools;

-- Día del Trabajo
INSERT INTO special_days (id, "schoolId", date, name, type, description, recurring, "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  id,
  '2026-05-01'::date,
  'Día del Trabajo',
  'holiday',
  'Feriado Nacional',
  true,
  true,
  NOW(),
  NOW()
FROM schools;

-- Día de las Glorias Navales
INSERT INTO special_days (id, "schoolId", date, name, type, description, recurring, "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  id,
  '2026-05-21'::date,
  'Día de las Glorias Navales',
  'holiday',
  'Feriado Nacional - Combate Naval de Iquique',
  true,
  true,
  NOW(),
  NOW()
FROM schools;

-- San Pedro y San Pablo
INSERT INTO special_days (id, "schoolId", date, name, type, description, recurring, "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  id,
  '2026-06-29'::date,
  'San Pedro y San Pablo',
  'holiday',
  'Feriado Religioso',
  true,
  true,
  NOW(),
  NOW()
FROM schools;

-- Día de la Virgen del Carmen
INSERT INTO special_days (id, "schoolId", date, name, type, description, recurring, "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  id,
  '2026-07-16'::date,
  'Día de la Virgen del Carmen',
  'holiday',
  'Feriado Religioso',
  true,
  true,
  NOW(),
  NOW()
FROM schools;

-- Asunción de la Virgen
INSERT INTO special_days (id, "schoolId", date, name, type, description, recurring, "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  id,
  '2026-08-15'::date,
  'Asunción de la Virgen',
  'holiday',
  'Feriado Religioso',
  true,
  true,
  NOW(),
  NOW()
FROM schools;

-- Día de la Independencia
INSERT INTO special_days (id, "schoolId", date, name, type, description, recurring, "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  id,
  '2026-09-18'::date,
  'Fiestas Patrias - Independencia',
  'holiday',
  'Feriado Nacional - Día de la Independencia de Chile',
  true,
  true,
  NOW(),
  NOW()
FROM schools;

-- Día de las Glorias del Ejército
INSERT INTO special_days (id, "schoolId", date, name, type, description, recurring, "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  id,
  '2026-09-19'::date,
  'Fiestas Patrias - Glorias del Ejército',
  'holiday',
  'Feriado Nacional',
  true,
  true,
  NOW(),
  NOW()
FROM schools;

-- Encuentro de Dos Mundos
INSERT INTO special_days (id, "schoolId", date, name, type, description, recurring, "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  id,
  '2026-10-12'::date,
  'Día del Encuentro de Dos Mundos',
  'holiday',
  'Feriado Nacional',
  true,
  true,
  NOW(),
  NOW()
FROM schools;

-- Día de las Iglesias Evangélicas
INSERT INTO special_days (id, "schoolId", date, name, type, description, recurring, "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  id,
  '2026-10-31'::date,
  'Día de las Iglesias Evangélicas',
  'holiday',
  'Feriado Religioso',
  true,
  true,
  NOW(),
  NOW()
FROM schools;

-- Día de Todos los Santos
INSERT INTO special_days (id, "schoolId", date, name, type, description, recurring, "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  id,
  '2026-11-01'::date,
  'Día de Todos los Santos',
  'holiday',
  'Feriado Religioso',
  true,
  true,
  NOW(),
  NOW()
FROM schools;

-- Inmaculada Concepción
INSERT INTO special_days (id, "schoolId", date, name, type, description, recurring, "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  id,
  '2026-12-08'::date,
  'Inmaculada Concepción',
  'holiday',
  'Feriado Religioso',
  true,
  true,
  NOW(),
  NOW()
FROM schools;

-- Navidad
INSERT INTO special_days (id, "schoolId", date, name, type, description, recurring, "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  id,
  '2026-12-25'::date,
  'Navidad',
  'holiday',
  'Feriado Religioso - Celebración del Nacimiento de Jesús',
  true,
  true,
  NOW(),
  NOW()
FROM schools;
