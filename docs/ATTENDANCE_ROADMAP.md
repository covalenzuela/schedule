# 📋 Sistema de Asistencia - Funcionalidades Pendientes

## ✅ Funcionalidades Implementadas (v1.0)

### Modelos de Datos
- ✅ **Student**: Modelo de alumnos con fecha de ingreso y estado activo
- ✅ **Attendance**: Registro de asistencia con estados (presente, ausente, tarde, justificado)
- ✅ Relaciones con cursos y colegios
- ✅ Validación de fecha de ingreso (no permite asistencia antes del enrollment)

### Acciones Backend
- ✅ `getStudentsByCourse()`: Listar alumnos de un curso
- ✅ `createStudent()`: Crear nuevo alumno
- ✅ `updateStudent()`: Actualizar datos del alumno
- ✅ `recordAttendance()`: Registrar asistencia individual
- ✅ `recordBulkAttendance()`: Registrar asistencia masiva para un curso
- ✅ `getAttendanceByCourse()`: Consultar asistencia por curso y rango de fechas
- ✅ `getAttendanceByStudent()`: Consultar historial de asistencia de un alumno
- ✅ `getStudentAttendanceStats()`: Calcular estadísticas (%, totales, alertas)
- ✅ `getStudentsWithLowAttendance()`: Detectar alumnos con baja asistencia

### Características
- ✅ Soporte para historial de años anteriores (filtrado por fecha)
- ✅ Soporte para alumnos que ingresan durante el año (campo `enrollmentDate`)
- ✅ Cálculo automático de porcentajes de asistencia
- ✅ Sistema de alertas básico (asistencia < 85%)

---

## 📌 Funcionalidades Pendientes (Roadmap)

### 🔴 Prioridad Alta (Sprint 2)

#### 1. **Interfaz de Usuario para Registro de Asistencia**
- [ ] Página `/attendance` con vista de calendario mensual
- [ ] Tabla tipo Excel (similar a la referencia) con:
  - Filas: alumnos ordenados alfabéticamente
  - Columnas: días del mes
  - Celdas: P (Presente), X (Ausente), T (Tarde), J (Justificado)
  - Totales automáticos por alumno
  - Porcentaje de asistencia
  - Destacado visual para alumnos con baja asistencia
- [ ] Selector de curso y mes
- [ ] Botón "Guardar" para enviar registros en lote
- [ ] Validación en tiempo real

#### 2. **Gestión de Alumnos**
- [ ] Página `/students` para listar todos los alumnos
- [ ] Modal/formulario para agregar nuevo alumno
- [ ] Modal/formulario para editar datos del alumno
- [ ] Acción para "retirar" alumno (marcar `isActive: false`)
- [ ] Filtros por curso, año académico, estado

#### 3. **Dashboard de Asistencia**
- [ ] Card con estadísticas generales del colegio
- [ ] Lista de alumnos con alertas de baja asistencia
- [ ] Gráfico de tendencia de asistencia mensual
- [ ] Exportar reporte a Excel/PDF

---

### 🟡 Prioridad Media (Sprint 3)

#### 4. **Justificaciones y Documentos**
- [ ] Ampliar modelo `Attendance` con campo `attachmentUrl` (opcional)
- [ ] Endpoint para subir justificativos (PDF, imágenes)
- [ ] Interfaz para adjuntar documento al marcar "justificado"
- [ ] Validación de tipos de archivo y tamaño máximo
- [ ] Almacenamiento en S3/MinIO o filesystem local

#### 5. **Notificaciones y Alertas**
- [ ] Sistema de notificaciones por email/SMS
- [ ] Envío automático de alertas a apoderados cuando:
  - Alumno supera umbral de inasistencias (configurable)
  - Alumno acumula X llegadas tarde consecutivas
- [ ] Plantillas de email personalizables
- [ ] Log de notificaciones enviadas

#### 6. **Reportes Avanzados**
- [ ] Reporte mensual de asistencia por curso (exportable)
- [ ] Reporte anual de asistencia por alumno
- [ ] Reporte comparativo entre cursos
- [ ] Gráficos de tendencias (Chart.js o Recharts)
- [ ] Filtros personalizados (por fecha, curso, nivel académico)

---

### 🟢 Prioridad Baja (Sprint 4+)

#### 7. **Días Especiales y Excepciones**
- [ ] Modelo `SpecialDay` para registrar:
  - Feriados
  - Suspensiones de clases
  - Salidas pedagógicas
  - Actividades extraescolares
- [ ] Interfaz para marcar días especiales en calendario
- [ ] Excluir días especiales de cálculos de asistencia

#### 8. **Transferencias de Alumnos**
- [ ] Acción `transferStudent(studentId, newCourseId)` para cambiar de curso
- [ ] Mantener historial de asistencia al transferir
- [ ] Registro de fecha de transferencia

#### 9. **Auditoría y Trazabilidad**
- [ ] Agregar campos `createdBy`, `updatedBy` a modelos
- [ ] Historial de cambios en asistencias
- [ ] Log de quién registró/modificó cada asistencia
- [ ] Prevención de modificaciones no autorizadas

#### 10. **Permisos y Roles**
- [ ] Roles específicos para asistencia:
  - `attendance_admin`: puede ver y editar todo
  - `attendance_teacher`: solo su(s) curso(s)
  - `attendance_viewer`: solo consultar
- [ ] Validación de permisos en backend

#### 11. **Integración con Otros Módulos**
- [ ] Vincular asistencia con horarios (detectar bloques de clase)
- [ ] Mostrar asistencia en vista de curso/profesor
- [ ] Alertas en dashboard principal si hay alumnos con baja asistencia

#### 12. **Exportación Oficial**
- [ ] Formato Excel compatible con MINEDUC u otros organismos
- [ ] Firma digital de reportes
- [ ] Certificados de asistencia para alumnos

---

## 🛠️ Consideraciones Técnicas

### Privacidad y Seguridad
- [ ] Cumplimiento GDPR / Ley de Protección de Datos
- [ ] Encriptación de datos sensibles (si aplica)
- [ ] Políticas de retención de datos históricos
- [ ] Backup automático de registros de asistencia

### Escalabilidad
- [ ] Paginación en listados de alumnos y asistencias
- [ ] Caché de consultas frecuentes (Redis opcional)
- [ ] Índices optimizados en base de datos (ya implementados)

### Testing
- [ ] Tests unitarios para acciones de asistencia
- [ ] Tests de integración para flujos completos
- [ ] Tests de carga para registros masivos

---

## 📊 Ejemplo de Flujo Completo (Futura UI)

### Registro Diario de Asistencia
1. Profesor ingresa a `/attendance`
2. Selecciona su curso y la fecha de hoy
3. Ve tabla tipo Excel con todos sus alumnos
4. Marca P/X/T/J para cada alumno
5. Hace clic en "Guardar"
6. Sistema registra todas las asistencias
7. Calcula automáticamente estadísticas
8. Envía alertas si algún alumno supera umbral de inasistencias

### Vista de Alumno con Alerta
1. Administrador ingresa a dashboard
2. Ve card "⚠️ 3 alumnos con baja asistencia"
3. Hace clic y ve lista filtrada
4. Selecciona alumno
5. Ve historial completo, gráficos, porcentaje
6. Puede exportar reporte para apoderado

---

## 📝 Notas de Implementación

### Stack Recomendado para UI
- **Tabla tipo Excel**: `react-table` o `ag-grid` (si es compleja)
- **Calendario**: `react-big-calendar` o custom con CSS Grid
- **Gráficos**: `recharts` o `chart.js`
- **Exportación**: `exceljs` (ya en dependencias)

### Modelo de Estado Excel (P/X/T/J)
```typescript
type AttendanceStatus = "present" | "absent" | "late" | "justified";

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "P",
  absent: "X",
  late: "T",
  justified: "J",
};

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: "#4ade80", // verde
  absent: "#ef4444",  // rojo
  late: "#fbbf24",    // amarillo
  justified: "#60a5fa", // azul
};
```

---

## 🎯 Objetivo Final

Un sistema de asistencia escolar completo, intuitivo y robusto que:
- Simplifique el registro diario para profesores
- Genere alertas automáticas para prevenir deserción
- Proporcione reportes oficiales exportables
- Mantenga historial completo y auditable
- Se integre perfectamente con el sistema de horarios existente

---

**Fecha de creación**: 15 de febrero de 2026  
**Versión actual**: 1.0 (Backend básico implementado)  
**Próximo Sprint**: Implementar UI de registro de asistencia tipo Excel
