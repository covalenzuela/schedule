# 📅 Sistema de Días Especiales y Feriados

Sistema completo para gestionar días especiales, feriados y eventos escolares que bloquean el registro de asistencia.

## 🎯 Características

### Tipos de Días Especiales

1. **🎉 Feriado Nacional** (`holiday`)
   - Color: Rojo (#ef4444)
   - Uso: Feriados nacionales oficiales
   - Ejemplo: Año Nuevo, Fiestas Patrias

2. **🏫 Evento Escolar** (`school_event`)
   - Color: Azul (#3b82f6)
   - Uso: Eventos propios del colegio
   - Ejemplo: Aniversario, Día del Colegio

3. **🚫 Sin Asistencia** (`no_attendance`)
   - Color: Naranja (#f59e0b)
   - Uso: Días sin clases por razones específicas
   - Ejemplo: Paro de profesores, corte de luz

4. **📌 Otro** (`other`)
   - Color: Gris (#6b7280)
   - Uso: Cualquier otro tipo de día especial

### Funcionalidades

- ✅ **Días Recurrentes**: Marcar días que se repiten cada año
- ✅ **Bloqueo en Calendario**: Los días especiales aparecen bloqueados en la grilla de asistencia
- ✅ **Gestión por Colegio**: Cada colegio tiene su propia configuración
- ✅ **Visualización Clara**: Íconos y colores distintivos por tipo
- ✅ **Tooltips Informativos**: Hover sobre días especiales muestra nombre y descripción

## 🛠️ Uso

### Agregar un Día Especial

1. Ir a **⚙️ Configuración** en el menú
2. Seleccionar el colegio (si hay más de uno)
3. Hacer clic en **➕ Agregar Día Especial**
4. Completar el formulario:
   - **Nombre**: Nombre descriptivo del día
   - **Fecha**: Fecha del día especial
   - **Tipo**: Seleccionar entre los 4 tipos disponibles
   - **Descripción**: (Opcional) Información adicional
   - **Repetir cada año**: Marcar si es un día recurrente

### Editar un Día Especial

1. En la tarjeta del día especial, hacer clic en **✏️**
2. Modificar los campos necesarios
3. Guardar cambios

### Eliminar un Día Especial

1. En la tarjeta del día especial, hacer clic en **🗑️**
2. Confirmar la eliminación

## 📊 Visualización en el Calendario de Asistencia

Los días especiales aparecen en el calendario con:
- **Ícono**: 🗓️
- **Color de fondo**: Según el tipo de día
- **Tooltip**: Al pasar el mouse, muestra el nombre y descripción
- **Bloqueado**: No se puede marcar asistencia en estos días

### Ejemplo Visual

```
┌────┬────┬────┬────┬────┬────┬────┐
│ 1  │ 2  │ 3  │ 4  │ 5  │ 6  │ 7  │
│ P  │ P  │ P  │ 🗓️  │ P  │    │    │ <- Día 4: Feriado
│    │    │    │ Red │    │    │    │
└────┴────┴────┴────┴────┴────┴────┘
```

## 🗄️ Modelo de Base de Datos

```prisma
model SpecialDay {
  id          String   @id @default(cuid())
  schoolId    String
  date        DateTime
  name        String
  type        String   // holiday, school_event, no_attendance, other
  description String?
  recurring   Boolean  @default(false)
  isActive    Boolean  @default(true)
  
  school School @relation(fields: [schoolId], references: [id])
}
```

## 🌍 Feriados Precargados (Chile 2026)

El sistema incluye un script SQL para cargar automáticamente los feriados nacionales de Chile:

```sql
prisma/seeds/chile-holidays-2026.sql
```

Para aplicar:
```bash
docker exec -it classytime_db_service psql -U postgres -d postgres -f /path/to/chile-holidays-2026.sql
```

### Feriados Incluidos

- Año Nuevo (01/01)
- Viernes Santo y Sábado Santo (Abril)
- Día del Trabajo (01/05)
- Glorias Navales (21/05)
- San Pedro y San Pablo (29/06)
- Virgen del Carmen (16/07)
- Asunción de la Virgen (15/08)
- Fiestas Patrias (18-19/09)
- Encuentro de Dos Mundos (12/10)
- Día de las Iglesias Evangélicas (31/10)
- Todos los Santos (01/11)
- Inmaculada Concepción (08/12)
- Navidad (25/12)

## 🎨 Estilos CSS

Los estilos se encuentran en:
- `src/modules/special-days/components/SpecialDaysManager.css`
- `src/modules/attendance/components/AttendanceGrid.css`

### Clases CSS para Días Especiales

```css
.cell-special                    /* Celda base */
.cell-special.special-holiday    /* Feriado nacional */
.cell-special.special-school_event /* Evento escolar */
.cell-special.special-no_attendance /* Sin asistencia */
.cell-special.special-other      /* Otro */
```

## 🔧 API / Server Actions

### Funciones Disponibles

```typescript
// Obtener días especiales
getSpecialDays(schoolId: string, year?: number)

// Crear día especial
createSpecialDay(data: {
  schoolId: string;
  date: Date;
  name: string;
  type: "holiday" | "school_event" | "no_attendance" | "other";
  description?: string;
  recurring?: boolean;
})

// Actualizar día especial
updateSpecialDay(id: string, data: {...})

// Eliminar día especial
deleteSpecialDay(id: string)

// Verificar si una fecha es especial
isSpecialDay(schoolId: string, date: Date)

// Obtener días especiales en un rango
getSpecialDaysInRange(schoolId: string, startDate: Date, endDate: Date)
```

## 📝 Ejemplos de Uso

### Agregar Día del Colegio

```typescript
await createSpecialDay({
  schoolId: "school-123",
  date: new Date("2026-09-15"),
  name: "Aniversario del Colegio",
  type: "school_event",
  description: "75° Aniversario de nuestro colegio",
  recurring: true
});
```

### Agregar Día Sin Clases

```typescript
await createSpecialDay({
  schoolId: "school-123",
  date: new Date("2026-06-10"),
  name: "Suspensión de Clases",
  type: "no_attendance",
  description: "Corte de agua potable en el sector",
  recurring: false
});
```

## 🔄 Integración con Asistencia

El componente `AttendanceGrid` automáticamente:
1. Carga los días especiales del mes seleccionado
2. Detecta si cada día es especial usando `isSpecialDayDate()`
3. Renderiza celdas bloqueadas con el ícono 🗓️
4. Aplica colores según el tipo de día
5. Muestra tooltips informativos

## 🚀 Próximas Mejoras

- [ ] Importación masiva desde CSV
- [ ] Sincronización con calendarios externos (Google Calendar, iCal)
- [ ] Notificaciones automáticas de días especiales próximos
- [ ] Historial de cambios en días especiales
- [ ] Permisos de edición por rol de usuario
- [ ] Exportación de calendario en formato PDF

## 📞 Soporte

Para más información o reportar problemas:
- Documentación: `/docs/SPECIAL_DAYS.md`
- Issues: GitHub Issues del proyecto
