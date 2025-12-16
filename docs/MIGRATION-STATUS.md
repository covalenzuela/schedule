# 🚧 MIGRACIÓN A SISTEMA DE NIVELES ACADÉMICOS

## ✅ Completado

1. **Schema de Base de Datos**
   - ✅ Agregado modelo `ScheduleLevelConfig` 
   - ✅ Actualizado `Course.academicLevel` para BASIC/MIDDLE
   - ✅ Aplicado cambios con `prisma db push`

2. **Types TypeScript**
   - ✅ Creado `/src/types/schedule-config.ts` con tipos para niveles académicos
   - ✅ Definidos `AcademicLevel`, `BreakConfig`, `ScheduleLevelConfig`, `TimeSlot`

3. **Actions**
   - ✅ Creado `/src/modules/schools/actions/schedule-config.ts`
   - ✅ Funciones: `getScheduleConfigForLevel`, `saveScheduleConfigForLevel`, `getScheduleConfigForCourse`

4. **Utilidades**
   - ✅ Creado `/src/lib/utils/time-slots.ts`
   - ✅ Función `generateTimeSlotsWithBreaks` que incluye recreos explícitos
   - ✅ Sistema basado en intervalos de 15 minutos

## 🔄 En Progreso

5. **ScheduleEditor Component**
   - ⚠️ PARCIALMENTE actualizado
   - ✅ Imports actualizados
   - ✅ Estado `scheduleConfig` y `timeSlots` actualizado
   - ❌ Renderizado del grid NO actualizado (aún usa string[] en lugar de TimeSlot[])
   - ❌ Handlers de drag & drop necesitan actualización

## ❌ Pendiente

6. **Actualizar ScheduleEditor**
   - Reescribir el renderizado del grid para usar `TimeSlot[]`
   - Agregar estilos para filas de recreos
   - Actualizar handlers de eventos (drag, drop, click)
   - Actualizar modal de agregar bloque

7. **Actualizar Cursos**
   - Modificar formulario de creación/edición de cursos para seleccionar nivel (BASIC/MIDDLE)
   - Actualizar `academicLevel` de cursos existentes (migración de datos)

8. **UI de Configuración**
   - Crear página para configurar horarios por nivel
   - Interfaz para definir recreos personalizados
   - Validación de tiempos (múltiplos de 15)

9. **Accordion y Vistas**
   - Actualizar `ScheduleGrid` para mostrar recreos
   - Actualizar accordion de horarios
   - PDF/Export con recreos visibles

10. **Migración de Datos**
    - Script para actualizar cursos existentes con `academicLevel` correcto
    - Crear configuraciones por defecto para escuelas existentes

## 🎯 Siguiente Paso Inmediato

El ScheduleEditor necesita ser completamente reescrito para trabajar con `TimeSlot[]`. 

**Opciones:**
1. **Reescribir ScheduleEditor completo** (2-3 horas) - Más limpio
2. **Agregar capa de compatibilidad** (30 min) - Más rápido pero temporal
3. **Crear nuevo componente ScheduleEditorV2** (3-4 horas) - Mejor a largo plazo

**Recomendación:** Opción 2 (compatibilidad temporal) para que el sistema funcione YA, luego hacer opción 3 cuando haya tiempo.
