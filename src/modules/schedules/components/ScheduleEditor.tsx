/**
 * 🎨 ScheduleEditor - Editor visual de horarios con drag and drop
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { saveSchedule, getSchedulesForCourse, getSchedulesForTeacher } from "@/modules/schedules/actions";
import { getSchoolScheduleConfig } from "@/modules/schools/actions";
import { getSubjects } from "@/modules/subjects/actions";
import { getTeachers, isTeacherAvailable } from "@/modules/teachers/actions";
import { getCourses } from "@/modules/courses/actions";
import { SubjectPalette } from "./SubjectPalette";
import { QuickAssignModal } from "./QuickAssignModal";

// Tipo para configuración de horario
interface ScheduleConfig {
  startTime: string;
  endTime: string;
  blockDuration: number;
  breakDuration: number;
  lunchBreak: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  lunchBreakByDay?: Record<string, {enabled: boolean, start: string, end: string}>;
}

interface ScheduleBlock {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  teacher?: string;
  teacherId?: string; // ID del profesor para validación
  course?: string;
  courseId?: string; // ID del curso
  color: string;
  hasConflict?: boolean; // Indica si hay conflicto de disponibilidad
}

interface ScheduleEditorProps {
  entityId: string;
  entityType: "course" | "teacher";
  entityName: string;
  schoolId: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

const DAYS = [
  { key: "MONDAY", label: "Lunes" },
  { key: "TUESDAY", label: "Martes" },
  { key: "WEDNESDAY", label: "Miércoles" },
  { key: "THURSDAY", label: "Jueves" },
  { key: "FRIDAY", label: "Viernes" },
];

const PREDEFINED_COLORS = [
  "#B4D7FF",
  "#FFB4D7",
  "#FFFBB4",
  "#FFD7B4",
  "#D7B4FF",
  "#B4FFD7",
  "#FFB4E5",
  "#B4FFEB",
  "#FFC4E7",
  "#B4EAFF",
];

// Configuración por defecto
const DEFAULT_CONFIG: ScheduleConfig = {
  startTime: '09:00',
  endTime: '18:00',
  blockDuration: 60,
  breakDuration: 15,
  lunchBreak: {
    enabled: true,
    startTime: '13:00',
    endTime: '14:00',
  }
};

// Función para generar slots dinámicamente
function generateTimeSlots(config: ScheduleConfig): string[] {
  const slots: string[] = [];
  const [startHour, startMin] = config.startTime.split(':').map(Number);
  const [endHour, endMin] = config.endTime.split(':').map(Number);
  
  let currentTime = startHour * 60 + startMin; // Convertir a minutos
  const endTime = endHour * 60 + endMin;
  
  while (currentTime < endTime) {
    const hours = Math.floor(currentTime / 60);
    const minutes = currentTime % 60;
    slots.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    currentTime += config.blockDuration + config.breakDuration;
  }
  
  // Agregar el tiempo final
  slots.push(config.endTime);
  
  return slots;
}

// Función para verificar si un slot está en horario de almuerzo
// Verifica si hay OVERLAP entre el bloque y el periodo de almuerzo
function isLunchBreak(blockStartTime: string, day: string, config: ScheduleConfig): boolean {
  // Calcular el tiempo de fin del bloque
  const [startHour, startMin] = blockStartTime.split(':').map(Number);
  const blockStartMinutes = startHour * 60 + startMin;
  const blockEndMinutes = blockStartMinutes + config.blockDuration;
  
  const blockEndHour = Math.floor(blockEndMinutes / 60);
  const blockEndMin = blockEndMinutes % 60;
  const blockEndTime = `${blockEndHour.toString().padStart(2, '0')}:${blockEndMin.toString().padStart(2, '0')}`;
  
  // Si hay configuración por día y tiene la configuración para este día específico, usarla
  if (config.lunchBreakByDay && Object.keys(config.lunchBreakByDay).length > 0) {
    const dayConfig = config.lunchBreakByDay[day];
    if (dayConfig) {
      if (!dayConfig.enabled) return false;
      
      // Verificar si hay overlap: el bloque solapa con almuerzo si:
      // - El bloque empieza antes de que termine el almuerzo Y
      // - El bloque termina después de que empiece el almuerzo
      const hasOverlap = blockStartTime < dayConfig.end && blockEndTime > dayConfig.start;
      return hasOverlap;
    }
    // Si lunchBreakByDay existe pero no tiene este día, no hay almuerzo
    return false;
  }
  
  // Fallback a configuración global
  if (!config.lunchBreak.enabled) return false;
  
  // Verificar overlap con configuración global
  const hasOverlap = blockStartTime < config.lunchBreak.endTime && blockEndTime > config.lunchBreak.startTime;
  return hasOverlap;
}

export function ScheduleEditor({
  entityId,
  entityType,
  entityName,
  schoolId,
}: ScheduleEditorProps) {
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastSavedBlocksRef = useRef<string>("");
  const [selectedBlock, setSelectedBlock] = useState<ScheduleBlock | null>(
    null
  );
  const [isAddingBlock, setIsAddingBlock] = useState(false);

  // Estados para datos reales
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Estados para configuración de horario
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>(DEFAULT_CONFIG);
  const [timeSlots, setTimeSlots] = useState<string[]>(() => generateTimeSlots(DEFAULT_CONFIG));

  // Estados para drag and drop
  const [draggedSubject, setDraggedSubject] = useState<any>(null);
  const [dropTarget, setDropTarget] = useState<{
    day: string;
    time: string;
  } | null>(null);
  const [showQuickAssign, setShowQuickAssign] = useState(false);
  const [pendingBlock, setPendingBlock] = useState<any>(null);

  const [newBlock, setNewBlock] = useState({
    day: "MONDAY",
    startTime: "09:00",
    endTime: "10:00",
    subject: "",
    subjectId: "",
    detail: "", // teacher o course según el tipo
    detailId: "",
    color: PREDEFINED_COLORS[0],
  });

  // Cargar datos reales al montar
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const [subjectsData, teachersData, coursesData] = await Promise.all([
          getSubjects(),
          getTeachers(),
          getCourses(),
        ]);
        setSubjects(subjectsData);
        setTeachers(teachersData);
        setCourses(coursesData);

        // Cargar configuración del colegio
        const config = await getSchoolScheduleConfig(schoolId);
        setScheduleConfig(config);
        setTimeSlots(generateTimeSlots(config));

        // Cargar bloques existentes según el tipo
        if (entityType === 'course') {
          console.log('[Editor] Cargando schedules para curso:', entityId);
          const schedules = await getSchedulesForCourse(entityId);
          console.log('[Editor] Schedules recibidos:', schedules.length);
          if (schedules.length > 0) {
            const schedule = schedules[0];
            console.log('[Editor] Schedule ID:', schedule.id, 'Bloques:', schedule.blocks.length);
            const transformedBlocks = schedule.blocks.map((block: any) => ({
              id: block.id,
              day: block.dayOfWeek,
              startTime: block.startTime,
              endTime: block.endTime,
              subject: block.subject.name,
              teacher: block.teacher ? `${block.teacher.firstName} ${block.teacher.lastName}` : '',
              teacherId: block.teacher?.id,
              color: block.subject.color || PREDEFINED_COLORS[0],
            }));
            console.log('[Editor] Bloques transformados:', transformedBlocks.length);
            console.log('[Editor] Detalle bloques:', transformedBlocks.map(b => `${b.day} ${b.startTime} ${b.subject}`));
            setBlocks(transformedBlocks);
            lastSavedBlocksRef.current = JSON.stringify(transformedBlocks);
          }
        } else if (entityType === 'teacher') {
          const teacherBlocks = await getSchedulesForTeacher(entityId);
          const transformedBlocks = teacherBlocks.map((block: any) => ({
            id: block.id,
            day: block.dayOfWeek,
            startTime: block.startTime,
            endTime: block.endTime,
            subject: block.subject.name,
            course: block.course?.name || '',
            courseId: block.course?.id,
            teacherId: block.teacherId,
            color: block.subject.color || PREDEFINED_COLORS[0],
          }));
          setBlocks(transformedBlocks);
          lastSavedBlocksRef.current = JSON.stringify(transformedBlocks);
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, [entityId, entityType, schoolId]);

  // Función de guardado automático
  const autoSave = useCallback(
    async (blocksToSave: ScheduleBlock[]) => {
      try {
        setSaveStatus("saving");

        await saveSchedule({
          entityId,
          entityType,
          blocks: blocksToSave,
        });

        lastSavedBlocksRef.current = JSON.stringify(blocksToSave);
        setSaveStatus("saved");

        // Después de 2 segundos, volver a idle
        setTimeout(() => {
          setSaveStatus("idle");
        }, 2000);
      } catch (error) {
        console.error("Error guardando automáticamente:", error);
        setSaveStatus("error");

        // Después de 3 segundos, volver a idle
        setTimeout(() => {
          setSaveStatus("idle");
        }, 3000);
      }
    },
    [entityId, entityType]
  );

  // Effect para guardado automático con debounce
  useEffect(() => {
    const currentBlocksString = JSON.stringify(blocks);

    // No guardar si no hay cambios
    if (currentBlocksString === lastSavedBlocksRef.current) {
      return;
    }

    // Limpiar timeout anterior
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Establecer nuevo timeout de 2 segundos
    saveTimeoutRef.current = setTimeout(() => {
      autoSave(blocks);
    }, 2000);

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [blocks, autoSave]);

  // Validar disponibilidad de profesores
  useEffect(() => {
    const validateAvailability = async () => {
      const updatedBlocks = await Promise.all(
        blocks.map(async (block) => {
          // Validar si hay un profesor asignado (en ambos tipos)
          const teacherId = entityType === 'course' ? block.teacherId : entityId;
          
          if (!teacherId) {
            return { ...block, hasConflict: false };
          }

          const available = await isTeacherAvailable(
            teacherId,
            block.day,
            block.startTime,
            block.endTime
          );

          return { ...block, hasConflict: !available };
        })
      );

      // Solo actualizar si hay cambios en los conflictos
      const hasChanges = updatedBlocks.some((updated, index) => 
        updated.hasConflict !== blocks[index].hasConflict
      );

      if (hasChanges) {
        setBlocks(updatedBlocks);
      }
    };

    validateAvailability();
  }, [blocks.length, entityType, entityId]); // Revalidar cuando cambia la cantidad de bloques

  // Drag and drop handlers  // Funciones de drag and drop
  const handleDragStart = (subject: any) => {
    setDraggedSubject(subject);
  };

  const handleDragOver = (e: React.DragEvent, day: string, time: string) => {
    // No permitir drop en horario de almuerzo
    if (isLunchBreak(time, day, scheduleConfig)) {
      return;
    }
    e.preventDefault();
    setDropTarget({ day, time });
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (
    e: React.DragEvent,
    day: string,
    time: string,
    timeIndex: number
  ) => {
    e.preventDefault();
    setDropTarget(null);

    if (!draggedSubject) return;

    // Crear bloque pendiente
    const pending = {
      day,
      startTime: time,
      endTime: timeSlots[timeIndex + 1],
      subject: draggedSubject,
    };

    setPendingBlock(pending);
    setShowQuickAssign(true);
    setDraggedSubject(null);
  };

  const handleQuickAssignConfirm = async (detailId: string, detailName: string) => {
    if (!pendingBlock) return;

    // Validar disponibilidad del profesor si estamos editando un curso
    if (entityType === "course") {
      const available = await isTeacherAvailable(
        detailId,
        pendingBlock.day,
        pendingBlock.startTime,
        pendingBlock.endTime
      );

      if (!available) {
        const confirm = window.confirm(
          `⚠️ El profesor ${detailName} no está disponible en este horario.\n\n¿Deseas asignarlo de todas formas?`
        );
        if (!confirm) {
          return;
        }
      }
    }

    const block: ScheduleBlock = {
      id: `${Date.now()}`,
      day: pendingBlock.day,
      startTime: pendingBlock.startTime,
      endTime: pendingBlock.endTime,
      subject: pendingBlock.subject.name,
      ...(entityType === "course"
        ? { teacher: detailName, teacherId: detailId }
        : { course: detailName, courseId: detailId }),
      color: pendingBlock.subject.color || PREDEFINED_COLORS[0],
    };

    setBlocks([...blocks, block]);
    setShowQuickAssign(false);
    setPendingBlock(null);
  };

  const handleQuickAssignCancel = () => {
    setShowQuickAssign(false);
    setPendingBlock(null);
  };

  const handleAddBlock = async () => {
    if (!newBlock.subjectId || !newBlock.detailId) {
      alert("Por favor completa todos los campos");
      return;
    }

    // Obtener nombres reales de las entidades seleccionadas
    const selectedSubject = subjects.find((s) => s.id === newBlock.subjectId);
    const subjectName = selectedSubject?.name || newBlock.subject;
    const subjectColor = selectedSubject?.color || newBlock.color;

    let detailName = newBlock.detail;
    let detailId = newBlock.detailId;

    if (entityType === "course") {
      const selectedTeacher = teachers.find((t) => t.id === newBlock.detailId);
      detailName = selectedTeacher
        ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}`
        : newBlock.detail;

      // Validar disponibilidad del profesor
      const available = await isTeacherAvailable(
        detailId,
        newBlock.day,
        newBlock.startTime,
        newBlock.endTime
      );

      if (!available) {
        const confirm = window.confirm(
          `⚠️ El profesor ${detailName} no está disponible en este horario.\n\n¿Deseas asignarlo de todas formas?`
        );
        if (!confirm) {
          return;
        }
      }
    } else {
      const selectedCourse = courses.find((c) => c.id === newBlock.detailId);
      detailName = selectedCourse?.name || newBlock.detail;
    }

    const block: ScheduleBlock = {
      id: `${Date.now()}`,
      day: newBlock.day,
      startTime: newBlock.startTime,
      endTime: newBlock.endTime,
      subject: subjectName,
      ...(entityType === "course"
        ? { teacher: detailName, teacherId: detailId }
        : { course: detailName, courseId: detailId }),
      color: subjectColor,
    };

    setBlocks([...blocks, block]);
    setIsAddingBlock(false);
    setNewBlock({
      day: "MONDAY",
      startTime: "09:00",
      endTime: "10:00",
      subject: "",
      subjectId: "",
      detail: "",
      detailId: "",
      color: PREDEFINED_COLORS[0],
    });
  };

  const handleDeleteBlock = (blockId: string) => {
    setBlocks(blocks.filter((b) => b.id !== blockId));
    setSelectedBlock(null);
  };

  const getBlocksForSlot = (day: string, time: string) => {
    return blocks.filter((b) => b.day === day && b.startTime === time);
  };

  // Renderizar indicador de estado de guardado
  const renderSaveStatus = () => {
    switch (saveStatus) {
      case "saving":
        return (
          <div className="schedule-save-status saving">
            <div className="schedule-save-spinner"></div>
            <span>Guardando...</span>
          </div>
        );
      case "saved":
        return (
          <div className="schedule-save-status saved">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Guardado</span>
          </div>
        );
      case "error":
        return (
          <div className="schedule-save-status error">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <span>Error al guardar</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="schedule-editor-with-palette">
        {/* Paleta de asignaturas */}
        <SubjectPalette subjects={subjects} onDragStart={handleDragStart} />

        <div className="schedule-editor" style={{ flex: 1 }}>
          {/* Banner de advertencia para profesores con conflictos */}
          {entityType === 'teacher' && blocks.some(b => b.hasConflict) && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 152, 0, 0.1))',
              border: '1px solid rgba(255, 193, 7, 0.3)',
              borderRadius: '0.75rem',
              padding: '1rem',
              margin: '0 0 1rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                  Tienes bloques fuera de tu disponibilidad
                </div>
                <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                  Los bloques marcados con ⚠️ están fuera de tu horario de disponibilidad. 
                  Ve a tu perfil para actualizar tu disponibilidad.
                </div>
              </div>
            </div>
          )}
          
          {/* Toolbar */}
          <div className="schedule-editor-toolbar">
            <button
              className="schedule-toolbar-btn primary"
              onClick={() => setIsAddingBlock(true)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Agregar Manual
            </button>

            <div className="schedule-toolbar-spacer"></div>

            {renderSaveStatus()}

            <div
              style={{
                fontSize: "0.875rem",
                color: "rgba(255, 255, 255, 0.6)",
              }}
            >
              {blocks.length} {blocks.length === 1 ? "bloque" : "bloques"}
            </div>
          </div>

          {/* Canvas principal */}
          <div className="schedule-editor-canvas">
            <div className="schedule-editor-grid">
              {/* Header */}
              <div className="schedule-editor-grid-header">
                <div className="schedule-editor-time-header">Horario</div>
                {DAYS.map((day) => (
                  <div key={day.key} className="schedule-editor-day-header">
                    {day.label}
                  </div>
                ))}
              </div>

              {/* Grid cells */}
              <div className="schedule-editor-grid-body">
                {timeSlots.slice(0, -1).map((time, index) => {
                  
                  return (<div key={time} className="schedule-editor-grid-row">
                    <div className="schedule-editor-time-cell">
                      {time} - {timeSlots[index + 1]}
                    </div>
                    {DAYS.map((day) => {
                      const isLunch = isLunchBreak(time, day.key, scheduleConfig);
                      const cellBlocks = getBlocksForSlot(day.key, time);
                      const isDropTarget =
                        dropTarget?.day === day.key &&
                        dropTarget?.time === time;

                      return (
                        <div
                          key={`${day.key}-${time}`}
                          className={`schedule-editor-cell ${
                            isLunch ? "lunch-break" : ""
                          } ${isDropTarget ? "drop-hover" : ""} ${draggedSubject ? "drop-active" : ""}`}
                          onDragOver={(e) => !isLunch && handleDragOver(e, day.key, time)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => !isLunch && handleDrop(e, day.key, time, index)}
                          onClick={() => {
                            if (!isLunch && cellBlocks.length === 0) {
                              setNewBlock({
                                ...newBlock,
                                day: day.key,
                                startTime: time,
                                endTime: timeSlots[index + 1],
                              });
                              setIsAddingBlock(true);
                            }
                          }}
                        >
                          {cellBlocks.map((block) => {
                            const conflictMessage = entityType === 'course' 
                              ? `⚠️ El profesor ${block.teacher} no está disponible en este horario`
                              : `⚠️ No tienes disponibilidad marcada en este horario. Ve a tu perfil para configurarla.`;
                            
                            return (
                            <div
                              key={block.id}
                              className={`schedule-editor-block ${block.hasConflict ? 'has-conflict' : ''}`}
                              style={{ backgroundColor: block.color }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBlock(block);
                              }}
                              title={block.hasConflict ? conflictMessage : ''}
                            >
                              {block.hasConflict && (
                                <div className="schedule-editor-block-warning">⚠️</div>
                              )}
                              <div className="schedule-editor-block-subject">
                                {block.subject}
                              </div>
                              <div className="schedule-editor-block-detail">
                                {entityType === "course"
                                  ? block.teacher
                                  : block.course}
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>);
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Modal para agregar bloque */}
        {isAddingBlock && (
          <div
            className="schedule-editor-modal-overlay"
            onClick={() => setIsAddingBlock(false)}
          >
            <div
              className="schedule-editor-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="schedule-editor-modal-header">
                <h3>Agregar Bloque de Clase</h3>
                <button
                  onClick={() => setIsAddingBlock(false)}
                  className="schedule-editor-modal-close"
                >
                  ×
                </button>
              </div>

              <div className="schedule-editor-modal-body">
                <div className="schedule-editor-form-group">
                  <label>Día</label>
                  <select
                    value={newBlock.day}
                    onChange={(e) =>
                      setNewBlock({ ...newBlock, day: e.target.value })
                    }
                  >
                    {DAYS.map((day) => (
                      <option key={day.key} value={day.key}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="schedule-editor-form-row">
                  <div className="schedule-editor-form-group">
                    <label>Hora Inicio</label>
                    <select
                      value={newBlock.startTime}
                      onChange={(e) =>
                        setNewBlock({ ...newBlock, startTime: e.target.value })
                      }
                    >
                      {timeSlots.slice(0, -1).map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="schedule-editor-form-group">
                    <label>Hora Fin</label>
                    <select
                      value={newBlock.endTime}
                      onChange={(e) =>
                        setNewBlock({ ...newBlock, endTime: e.target.value })
                      }
                    >
                      {timeSlots.slice(1).map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="schedule-editor-form-group">
                  <label>Asignatura</label>
                  {loadingData ? (
                    <div
                      style={{
                        padding: "0.75rem",
                        color: "rgba(255, 255, 255, 0.5)",
                      }}
                    >
                      Cargando asignaturas...
                    </div>
                  ) : subjects.length === 0 ? (
                    <div
                      style={{
                        padding: "0.75rem",
                        color: "rgba(255, 255, 255, 0.5)",
                      }}
                    >
                      No hay asignaturas disponibles
                    </div>
                  ) : (
                    <select
                      value={newBlock.subjectId}
                      onChange={(e) => {
                        const selectedSubject = subjects.find(
                          (s) => s.id === e.target.value
                        );
                        setNewBlock({
                          ...newBlock,
                          subjectId: e.target.value,
                          subject: selectedSubject?.name || "",
                          color: selectedSubject?.color || newBlock.color,
                        });
                      }}
                    >
                      <option value="">Selecciona una asignatura</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name} ({subject.code})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="schedule-editor-form-group">
                  <label>
                    {entityType === "course" ? "Profesor" : "Curso"}
                  </label>
                  {loadingData ? (
                    <div
                      style={{
                        padding: "0.75rem",
                        color: "rgba(255, 255, 255, 0.5)",
                      }}
                    >
                      Cargando{" "}
                      {entityType === "course" ? "profesores" : "cursos"}...
                    </div>
                  ) : entityType === "course" ? (
                    teachers.length === 0 ? (
                      <div
                        style={{
                          padding: "0.75rem",
                          color: "rgba(255, 255, 255, 0.5)",
                        }}
                      >
                        No hay profesores disponibles
                      </div>
                    ) : (
                      <select
                        value={newBlock.detailId}
                        onChange={(e) => {
                          const selectedTeacher = teachers.find(
                            (t) => t.id === e.target.value
                          );
                          setNewBlock({
                            ...newBlock,
                            detailId: e.target.value,
                            detail: selectedTeacher
                              ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}`
                              : "",
                          });
                        }}
                      >
                        <option value="">Selecciona un profesor</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.firstName} {teacher.lastName}
                            {teacher.specialization &&
                              ` - ${teacher.specialization}`}
                          </option>
                        ))}
                      </select>
                    )
                  ) : courses.length === 0 ? (
                    <div
                      style={{
                        padding: "0.75rem",
                        color: "rgba(255, 255, 255, 0.5)",
                      }}
                    >
                      No hay cursos disponibles
                    </div>
                  ) : (
                    <select
                      value={newBlock.detailId}
                      onChange={(e) => {
                        const selectedCourse = courses.find(
                          (c) => c.id === e.target.value
                        );
                        setNewBlock({
                          ...newBlock,
                          detailId: e.target.value,
                          detail: selectedCourse?.name || "",
                        });
                      }}
                    >
                      <option value="">Selecciona un curso</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.name}
                          {course.studentCount &&
                            ` - ${course.studentCount} estudiantes`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="schedule-editor-form-group">
                  <label>
                    Color {newBlock.subjectId && "(color de la asignatura)"}
                  </label>
                  {newBlock.subjectId ? (
                    <div className="schedule-editor-color-preview">
                      <div
                        className="schedule-editor-color-badge"
                        style={{ backgroundColor: newBlock.color }}
                      >
                        {
                          subjects.find((s) => s.id === newBlock.subjectId)
                            ?.name
                        }
                      </div>
                      <span
                        style={{
                          fontSize: "0.875rem",
                          color: "rgba(255, 255, 255, 0.6)",
                        }}
                      >
                        El color se asigna automáticamente según la asignatura
                      </span>
                    </div>
                  ) : (
                    <div className="schedule-editor-color-picker">
                      {PREDEFINED_COLORS.map((color) => (
                        <button
                          key={color}
                          className={`schedule-editor-color-option ${
                            newBlock.color === color ? "active" : ""
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewBlock({ ...newBlock, color })}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="schedule-editor-modal-footer">
                <button
                  onClick={() => setIsAddingBlock(false)}
                  className="schedule-toolbar-btn"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddBlock}
                  className="schedule-toolbar-btn primary"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Panel de detalles del bloque seleccionado */}
        {selectedBlock && (
          <div className="schedule-editor-details-panel">
            <div className="schedule-editor-details-header">
              <h3>Detalles del Bloque</h3>
              <button
                onClick={() => setSelectedBlock(null)}
                className="schedule-editor-modal-close"
              >
                ×
              </button>
            </div>
            <div className="schedule-editor-details-body">
              <div className="schedule-editor-details-item">
                <strong>Asignatura:</strong> {selectedBlock.subject}
              </div>
              <div className="schedule-editor-details-item">
                <strong>
                  {entityType === "course" ? "Profesor" : "Curso"}:
                </strong>{" "}
                {entityType === "course"
                  ? selectedBlock.teacher
                  : selectedBlock.course}
              </div>
              <div className="schedule-editor-details-item">
                <strong>Horario:</strong> {selectedBlock.startTime} -{" "}
                {selectedBlock.endTime}
              </div>
              <div className="schedule-editor-details-item">
                <strong>Día:</strong>{" "}
                {DAYS.find((d) => d.key === selectedBlock.day)?.label}
              </div>
            </div>
            <div className="schedule-editor-details-footer">
              <button
                onClick={() => handleDeleteBlock(selectedBlock.id)}
                className="schedule-toolbar-btn danger"
              >
                Eliminar Bloque
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal rápido de asignación */}
      {showQuickAssign && pendingBlock && (
        <QuickAssignModal
          subjectName={pendingBlock.subject.name}
          subjectColor={pendingBlock.subject.color || PREDEFINED_COLORS[0]}
          day={pendingBlock.day}
          startTime={pendingBlock.startTime}
          endTime={pendingBlock.endTime}
          entityType={entityType}
          teachers={teachers}
          courses={courses}
          onConfirm={handleQuickAssignConfirm}
          onCancel={handleQuickAssignCancel}
        />
      )}
    </>
  );
}
