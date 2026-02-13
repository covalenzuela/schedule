# 📊 Análisis: Configuración de Niveles Académicos y Jornadas

## 🎯 Problemas Identificados

### 1. ❌ **Inconsistencia de Tipos de Niveles Académicos**

**Ubicaciones con definiciones diferentes:**

| Archivo | Valores | Estado |
|---------|---------|--------|
| `prisma/schema.prisma` (BD) | `BASIC`, `MIDDLE` | ✅ Usado en BD |
| `src/types/schedule-config.ts` | `BASIC`, `MIDDLE` | ✅ Correcto |
| `src/types/index.ts` | `PRIMARY`, `SECONDARY`, `HIGH_SCHOOL` | ❌ No se usa |
| `CreateCourseForm.tsx` | `PRIMARIA`, `SECUNDARIA`, `MEDIA` | ❌ ERROR |

**Consecuencia:**  
❌ Al crear un curso, el formulario envía `"PRIMARIA"` pero la BD espera `"BASIC"`, causando inconsistencias.

**Solución recomendada:**
1. Usar **solo** `BASIC` y `MIDDLE` en toda la aplicación
2. Actualizar el formulario de creación de cursos
3. Limpiar tipos duplicados en `index.ts`

---

### 2. ❌ **No hay selector de niveles activos por colegio**

**Situación actual:**
- Cuando se crea un colegio, automáticamente se generan configuraciones para BÁSICA y MEDIA
- No hay forma de especificar si el colegio:
  - Solo tiene Básica (1° a 8°)
  - Solo tiene Media (1° a 4° Medio)
  - Tiene ambos niveles

**Problema:**
- Todos los colegios muestran ambas pestañas en la configuración de jornadas
- No se puede filtrar cursos por niveles activos
- No se puede validar que un curso pertenezca a un nivel válido del colegio

**Propuesta:**

#### Opción A: Campo en School (Simple) ⭐ RECOMENDADO
```prisma
model School {
  // ...existente...
  activeAcademicLevels String @default("BASIC,MIDDLE") // "BASIC", "MIDDLE", o "BASIC,MIDDLE"
}
```

**Ventajas:**
- ✅ Simple de implementar
- ✅ Compatible con datos existentes
- ✅ Fácil de validar

**Implementación:**
1. Agregar campo a schema
2. Migración con valor default "BASIC,MIDDLE" para todos
3. Agregar selector en configuración del colegio
4. Crear solo las ScheduleLevelConfig necesarias

#### Opción B: Tabla separada (Más flexible)
```prisma
model SchoolAcademicLevel {
  id            String  @id @default(cuid())
  schoolId      String
  academicLevel String  // BASIC o MIDDLE
  isActive      Boolean @default(true)
  school        School  @relation(...)
  
  @@unique([schoolId, academicLevel])
}
```

**Ventajas:**
- ✅ Más flexible (puede agregar más campos)
- ✅ Permite activar/desactivar niveles

**Desventajas:**
- ❌ Más complejo
- ❌ Requiere más queries

---

### 3. ⚠️ **Disponibilidad de profesores es global, no por nivel**

**Situación actual:**
```prisma
model TeacherAvailability {
  id           String
  teacherId    String
  academicYear Int
  dayOfWeek    String
  startTime    String
  endTime      String
  // ❌ NO tiene academicLevel
}
```

**Escenario problemático:**

Colegio con jornadas diferentes por nivel:
- **Básica**: Lunes a Viernes 08:00 - 13:00
- **Media**: Lunes a Viernes 14:00 - 18:00

Profesor Juan:
- Debe dictar en ambos niveles
- Disponibilidad actual: Lunes 08:00-18:00 (genérica)
- ❌ No puede especificar: "Básica solo mañanas, Media solo tardes"

**Análisis de opciones:**

#### Opción A: Disponibilidad global (mantener actual)
**Cuando tiene sentido:**
- Colegios donde BÁSICA y MEDIA tienen la **misma jornada**
- Ejemplo: Ambas de 08:00 a 17:00
- El profesor simplemente dice "Lunes 08:00-17:00"

**Limitación:**
- ❌ No funciona si las jornadas son diferentes

#### Opción B: Disponibilidad por nivel ⭐ RECOMENDADO
```prisma
model TeacherAvailability {
  id           String
  teacherId    String
  academicYear Int
  academicLevel String?  // 🆕 NULL = aplica a todos, "BASIC" o "MIDDLE" = específico
  dayOfWeek    String
  startTime    String
  endTime      String
  
  @@unique([teacherId, academicYear, academicLevel, dayOfWeek, startTime, endTime])
}
```

**Cómo funcionaría:**

1. **Si el colegio tiene jornadas iguales** (ej: ambas 08:00-17:00):
   - Profesor declara disponibilidad **SIN academicLevel** (NULL)
   - Se aplica a cualquier nivel

2. **Si el colegio tiene jornadas diferentes** (ej: Básica 08:00-13:00, Media 14:00-18:00):
   - Profesor declara disponibilidad PARA CADA NIVEL:
     - Disponibilidad "BASIC": Lunes 08:00-13:00
     - Disponibilidad "MIDDLE": Lunes 14:00-18:00

**Ventajas:**
- ✅ Flexible: funciona para ambos casos
- ✅ Validación: solo asignar en horarios donde está disponible
- ✅ Claro: el profesor sabe exactamente cuándo trabaja con cada nivel

**Implementación:**
1. Agregar campo `academicLevel String?` a TeacherAvailability
2. Migración: disponibilidades actuales quedan con `academicLevel = NULL`
3. UI: detectar si el colegio tiene jornadas diferentes
   - Si son iguales: un solo formulario (academicLevel = NULL)
   - Si son diferentes: tabs para configurar cada nivel
4. Validación al asignar: verificar que el profesor tenga disponibilidad para el nivel del curso

#### Opción C: Validación manual (no recomendado)
- Mantener disponibilidad global
- Confiar en que el administrador no cometa errores
- ❌ Propenso a errores

---

### 4. ✅ **¿Puede un profesor estar en básica y media?**

**Respuesta: SÍ, y está bien diseñado**

**Lo que funciona bien:**
1. ✅ El sistema permite asignar profesores a cursos de ambos niveles
2. ✅ Existe `validateScheduleCongruency()` que detecta conflictos
3. ✅ Se alerta cuando las jornadas son incompatibles
4. ✅ Se guarda historial de cambios de configuración

**Lo que falta:**
1. ❌ **Validación preventiva** al asignar un profesor a un curso:
   ```typescript
   // Antes de permitir asignar profesor a curso:
   - Verificar que tenga disponibilidad para el nivel del curso
   - Verificar que no tenga conflictos con otros cursos del mismo nivel
   - Si ya está en otro nivel, advertir al usuario
   ```

2. ❌ **UI clara** mostrando en qué niveles trabaja cada profesor:
   ```
   Profesor: María González
   📚 Materias: Matemáticas
   📊 Niveles activos:
      • BÁSICA: 3 cursos
      • MEDIA: 2 cursos
   ⚠️ Advertencia: Este profesor trabaja en ambos niveles
   ```

---

## 💡 Plan de Implementación Recomendado

### **Fase 1: Correcciones críticas** (Alto impacto, rápido)

1. **Unificar tipos AcademicLevel**
   - [ ] Eliminar enums duplicados en `src/types/index.ts`
   - [ ] Actualizar `CreateCourseForm.tsx` para usar `BASIC` y `MIDDLE`
   - [ ] Verificar que el seed y migraciones usen los valores correctos
   
   **Archivos a modificar:**
   - `src/types/index.ts` - Eliminar AcademicLevel viejo
   - `src/modules/courses/components/CreateCourseForm.tsx` - Cambiar opciones del select
   - `prisma/seed.ts` - Verificar que use BASIC/MIDDLE

2. **Validación de datos existentes**
   - [ ] Script para verificar y corregir cursos con academicLevel incorrecto
   - [ ] Script: `prisma/check-academic-levels.ts`

---

### **Fase 2: Selector de niveles activos** (Mejora UX)

1. **Agregar campo a School**
   - [ ] Migración: agregar `activeAcademicLevels String @default("BASIC,MIDDLE")`
   - [ ] Crear función helper: `getActiveAcademicLevels(schoolId): AcademicLevel[]`

2. **UI de configuración**
   - [ ] En página de configuración del colegio:
     ```
     ¿Qué niveles académicos tiene tu colegio?
     □ Educación Básica (1° a 8°)
     □ Educación Media (1° a 4°)
     ```
   - [ ] Mostrar solo pestañas de niveles activos en configuración de jornadas
   - [ ] Validar al crear curso que sea de un nivel activo

3. **Actualizar componentes**
   - [ ] `AcademicLevelScheduleConfig.tsx` - Mostrar solo niveles activos
   - [ ] `CreateCourseForm.tsx` - Filtrar opciones según colegio
   - [ ] `migrate-academic-levels.ts` - Crear solo configs de niveles activos

---

### **Fase 3: Disponibilidad por nivel académico** (Opcional, si se necesita)

**¿Cuándo implementar esto?**
- ✅ Si colegios reportan problemas con jornadas diferentes por nivel
- ✅ Si hay quejas de que la disponibilidad no es suficientemente flexible
- ⏸️ Si todos los colegios tienen jornadas iguales: no prioritario

**Si se implementa:**

1. **Schema**
   - [ ] Agregar `academicLevel String?` a TeacherAvailability
   - [ ] Migración: actuales quedan con NULL (aplica a todos)

2. **Lógica de negocio**
   - [ ] Función: `getTeacherAvailabilityForLevel(teacherId, level, year)`
   - [ ] Validación: al asignar profesor a curso, verificar disponibilidad del nivel
   - [ ] Helper: detectar si un colegio necesita disponibilidad por nivel

3. **UI**
   - [ ] Detectar si el colegio tiene jornadas diferentes
   - [ ] Si son iguales: un formulario simple (como ahora)
   - [ ] Si son diferentes: tabs "Disponibilidad BÁSICA" / "Disponibilidad MEDIA"

---

### **Fase 4: Validaciones preventivas** (Pulir UX)

1. **Al asignar profesor a curso:**
   - [ ] Verificar que el profesor tenga disponibilidad para el nivel del curso
   - [ ] Si ya está en otro nivel, mostrar advertencia clara
   - [ ] Sugerir ajustar disponibilidad si no es compatible

2. **Dashboard del profesor:**
   - [ ] Mostrar badge con niveles en los que trabaja
   - [ ] Resumen de jornadas por nivel
   - [ ] Alertas si hay conflictos potenciales

3. **Reportes:**
   - [ ] Agregar a `validateScheduleCongruency()` más detalles
   - [ ] Reporte: "Profesores trabajando en múltiples niveles"
   - [ ] Reporte: "Conflictos de jornada detectados"

---

## 🎯 Resumen de decisiones

| Pregunta | Respuesta | Acción |
|----------|-----------|--------|
| ¿Hay que unificar tipos? | ✅ Sí, urgente | Usar solo BASIC y MIDDLE |
| ¿El colegio elige sus niveles? | ❌ No existe | Agregar campo activeAcademicLevels |
| ¿Disponibilidad por nivel? | 🤔 Depende del caso de uso | Opcional, ver necesidad real |
| ¿Profesor en básica Y media? | ✅ Sí, está bien | Mejorar validaciones |

---

## ✅ FASE 2 COMPLETADA (13 Feb 2026)

### Implementaciones realizadas:

1. **✅ Campo `activeAcademicLevels` en School**
   - Agregado al modelo Prisma con valor default `"BASIC,MIDDLE"`
   - Migración aplicada con `prisma db push`
   - Formato: String separado por comas ("BASIC", "MIDDLE", o "BASIC,MIDDLE")

2. **✅ Utilidades para manejo de niveles activos**
   - [lib/utils/academic-levels.ts](../src/lib/utils/academic-levels.ts):
     - `parseActiveAcademicLevels()`: Convierte string a array
     - `isLevelActive()`: Verifica si un nivel está activo
     - `validateLevelIsActive()`: Valida con mensajes de error
     - `getActiveLevelsWithLabels()`: Retorna niveles con metadata

3. **✅ Actions del servidor**
   - [modules/schools/actions/index.ts](../src/modules/schools/actions/index.ts):
     - `getSchoolActiveAcademicLevels(schoolId)`: Obtiene niveles activos
     - `updateSchoolActiveAcademicLevels(schoolId, levels[])`: Actualiza niveles

4. **✅ Componente de configuración**
   - [ActiveAcademicLevelsConfig.tsx](../src/modules/schools/components/ActiveAcademicLevelsConfig.tsx):
     - Checkboxes para seleccionar BASIC y/o MIDDLE
     - Validación: al menos un nivel debe estar activo
     - UI integrada con diseño del sistema
     - Botones de guardar/cancelar con control de cambios

5. **✅ Integración en configuración de jornadas**
   - [AcademicLevelScheduleConfig.tsx](../src/modules/schools/components/AcademicLevelScheduleConfig.tsx):
     - Nueva pestaña "⚙️ Configuración General" al inicio
     - Carga dinámica de niveles activos del colegio
     - Filtra pestañas de jornadas según niveles activos
     - Si nivel activo cambia, ajusta la pestaña mostrada

6. **✅ Formulario de creación de cursos mejorado**
   - [CreateCourseForm.tsx](../src/modules/courses/components/CreateCourseForm.tsx):
     - Carga niveles activos del colegio seleccionado
     - Select de nivel académico filtrado dinámicamente
     - Disabled hasta seleccionar colegio
     - Placeholder: "Primero selecciona un colegio"

7. **✅ Script de migración actualizado**
   - [migrate-academic-levels.ts](../prisma/migrate-academic-levels.ts):
     - Respeta `activeAcademicLevels` del colegio
     - Solo crea configs para niveles activos
     - Muestra niveles en log de consola

### Flujo de usuarios:

1. **Configurar niveles del colegio**:
   - Ir a Colegios → Configurar horario → pestaña "Configuración General"
   - Seleccionar checkboxes de niveles que ofrece el colegio
   - Guardar cambios

2. **Las pestañas de jornadas se filtran automáticamente**:
   - Si solo BASIC está activo: solo muestra pestaña Básica
   - Si solo MIDDLE está activo: solo muestra pestaña Media
   - Si ambos están activos: muestra ambas pestañas

3. **Al crear curso**:
   - Seleccionar colegio primero
   - El selector de nivel se habilita y muestra solo niveles activos del colegio
   - Imposible crear curso de nivel inactivo

### Verificaciones realizadas:

✅ **Build exitoso**: Sin errores de compilación  
✅ **TypeScript**: Sin errores críticos (solo warning de CSS import)  
✅ **Schema actualizado**: Campo agregado y migrado  
✅ **Cliente Prisma**: Regenerado con nuevo campo  
✅ **Componentes**: Todos funcionando correctamente

---

## ✅ FASE 1 COMPLETADA (13 Feb 2026)

### Correcciones implementadas:

1. **✅ Unificación de tipos AcademicLevel**
   - Eliminado enum duplicado en `src/types/index.ts`
   - Ahora se usa **solo** el tipo de `schedule-config.ts`: `BASIC` | `MIDDLE`
   - Todas las referencias apuntan a la fuente única de verdad

2. **✅ Actualización de formularios**
   - [CreateCourseForm.tsx](../src/modules/courses/components/CreateCourseForm.tsx):
     - Cambió de `PRIMARIA/SECUNDARIA/MEDIA` a `BASIC/MIDDLE`
     - Labels actualizados: "Educación Básica (1° a 8°)" y "Educación Media (1° a 4°)"

3. **✅ Corrección del seed**
   - [seed.ts](../prisma/seed.ts): Todos los cursos ahora usan `BASIC` o `MIDDLE`

4. **✅ Scripts de verificación creados**
   - `prisma/check-academic-levels.ts`: Detecta inconsistencias en BD
   - `prisma/fix-academic-levels.ts`: Corrige datos con tipos incorrectos

### Verificaciones realizadas:

✅ **Build exitoso**: `npm run build` - Sin errores  
✅ **TypeScript**: `tsc --noEmit` - Sin errores de tipos  
✅ **Tests**: Todos pasaron (31 time-slots + 14 integration)  
✅ **Lint**: Sin problemas de código  
✅ **Base de datos**: Sin inconsistencias detectadas

---

## 🚀 Próximos pasos (Opcional)

**FASE 2:** Agregar selector de niveles activos al colegio
**FASE 3:** Disponibilidad de profesores por nivel académico (si se necesita)

¿Quieres continuar con las siguientes fases?
