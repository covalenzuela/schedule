/**
 * 🎨 ScheduleEditor V2 - Editor visual de horarios con drag and drop
 * Sistema de niveles académicos con recreos explícitos
 */

"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { saveSchedule, getSchedulesForCourse, getSchedulesForTeacher } from "@/modules/schedules/actions";
import { getScheduleConfigForCourse } from "@/modules/schools/actions/schedule-config";
import { getSubjects } from "@/modules/subjects/actions";
import { getTeachers } from "@/modules/teachers/actions";
import { checkTeacherAvailabilityDebug } from "@/modules/teachers/actions/availability-debug";
import { getCourses } from "@/modules/courses/actions";
import { SubjectPalette } from "./SubjectPalette";
import { QuickAssignModal } from "./QuickAssignModal";
import { generateTimeSlotsWithBreaks } from "@/lib/utils/time-slots";
import type { ScheduleLevelConfig, TimeSlot } from "@/types/schedule-config";

// Tipo para bloques de horario
interface ScheduleBlock {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  teacher?: string;
  teacherId?: string;
  course?: string;
  courseId?: string;
  color: string;
  hasConflict?: boolean;
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
  "#B4D7FF", "#FFB4D7", "#FFFBB4", "#FFD7B4", "#D7B4FF",
  "#B4FFD7", "#FFB4E5", "#B4FFEB", "#FFC4E7", "#B4EAFF",
];

export function ScheduleEditor({
  entityId,
  entityType,
  entityName,
  schoolId,
}: ScheduleEditorProps) {
  // Estados principales
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastSavedBlocksRef = useRef<string>("");
  const [selectedBlock, setSelectedBlock] = useState<ScheduleBlock | null>(null);
  const [isAddingBlock, setIsAddingBlock] = useState(false);

  // Datos del sistema
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Configuración de horario
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleLevelConfig | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  // Drag and drop
  const [draggedSubject, setDraggedSubject] = useState<any>(null);
  const [dropTarget, setDropTarget] = useState<{ day: string; time: string } | null>(null);
  const [showQuickAssign, setShowQuickAssign] = useState(false);
  const [pendingBlock, setPendingBlock] = useState<any>(null);

  // Nuevo bloque
  const [newBlock, setNewBlock] = useState({
    day: "MONDAY",
    startTime: "08:00",
    endTime: "08:45",
    subject: "",
    subjectId: "",
    detail: "",
    detailId: "",
    color: PREDEFINED_COLORS[0],
  });

  // ============================================
  // CARGA INICIAL DE DATOS
  // ============================================
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        
        // Cargar datos en paralelo
        const [subjectsData, teachersData, coursesData] = await Promise.all([
          getSubjects(),
          getTeachers(),
          getCourses(),
        ]);
        
        setSubjects(subjectsData);
        setTeachers(teachersData);
        setCourses(coursesData);

        // Cargar configuración del nivel académico
        const config = await getScheduleConfigForCourse(entityId);
        console.log('[Editor] ⚙️ Configuración cargada:', config);
        
        const slots = generateTimeSlotsWithBreaks(config);
        console.log('[Editor] 🕐 TimeSlots generados:', slots.length, 'slots');
        
        setScheduleConfig(config);
        setTimeSlots(slots);

        // Cargar bloques existentes
        if (entityType === 'course') {
          const schedules = await getSchedulesForCourse(entityId);
          if (schedules.length > 0) {
            const schedule = schedules[0];
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
            setBlocks(transformedBlocks);
            lastSavedBlocksRef.current = JSON.stringify(transformedBlocks);
          }
        } else {
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

  // ============================================
  // GUARDADO AUTOMÁTICO
  // ============================================
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
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (error) {
        console.error("Error guardando:", error);
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    },
    [entityId, entityType]
  );

  useEffect(() => {
    const currentBlocksString = JSON.stringify(blocks);
    if (currentBlocksString === lastSavedBlocksRef.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      autoSave(blocks);
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [blocks, autoSave]);

  // ============================================
  // VALIDACIÓN DE DISPONIBILIDAD (OPTIMIZADA)
  // ============================================
  // Signature para detectar cambios relevantes sin causar re-renders
  const blockSignature = useMemo(() => 
    blocks.map(b => `${b.id}:${b.teacherId || 'none'}:${b.day}:${b.startTime}`).join('|'),
    [blocks]
  );

  useEffect(() => {
    if (blocks.length === 0) return;

    const validateAvailability = async () => {
      console.log('[Validación] 🔍 Iniciando validación para', blocks.length, 'bloques');
      
      const updatedBlocks = await Promise.all(
        blocks.map(async (block, index) => {
          const teacherId = entityType === 'course' ? block.teacherId : entityId;
          const teacherName = entityType === 'course' ? block.teacher : entityName;
          
          if (!teacherId) {
            return { ...block, hasConflict: false };
          }

          const debugInfo = await checkTeacherAvailabilityDebug(
            teacherId,
            block.day,
            block.startTime,
            block.endTime
          );

          // Log solo cuando hay conflicto para reducir ruido
          if (!debugInfo.isAvailable) {
            console.log(`⚠️ Bloque ${index + 1}: ${block.subject} (${block.day} ${block.startTime})`);
            console.log(`   Profesor: ${teacherName}`);
            console.log(`   Razón: ${debugInfo.reason}`);
          }
          
          return { ...block, hasConflict: !debugInfo.isAvailable };
        })
      );

      const hasChanges = updatedBlocks.some(
        (newBlock, index) => newBlock.hasConflict !== blocks[index]?.hasConflict
      );

      if (hasChanges) {
        console.log('[Validación] ✅ Actualizando bloques con nuevos estados de conflicto');
        setBlocks(updatedBlocks);
      }
    };

    const timeoutId = setTimeout(validateAvailability, 300);
    return () => clearTimeout(timeoutId);
  }, [blockSignature, entityType, entityId]);

  // ============================================
  // UTILIDADES
  // ============================================
  const getBlocksForSlot = (day: string, time: string) => {
    return blocks.filter((b) => b.day === day && b.startTime === time);
  };

  const handleDeleteBlock = (blockId: string) => {
    setBlocks(blocks.filter((b) => b.id !== blockId));
    setSelectedBlock(null);
  };

  // ============================================
  // DRAG AND DROP HANDLERS
  // ============================================
  const handleDragOver = (e: React.DragEvent, day: string, time: string) => {
    e.preventDefault();
    setDropTarget({ day, time });
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = async (
    e: React.DragEvent,
    day: string,
    time: string,
    slot: TimeSlot
  ) => {
    e.preventDefault();
    setDropTarget(null);

    if (!draggedSubject) return;

    setPendingBlock({
      day,
      startTime: time,
      endTime: slot.endTime,
      subjectId: draggedSubject.id,
      subjectName: draggedSubject.name,
      subjectColor: draggedSubject.color || PREDEFINED_COLORS[0],
    });
    setShowQuickAssign(true);
  };



  // ============================================
  // MODAL DE AGREGAR BLOQUE
  // ============================================
  const handleAddBlock = () => {
    const selectedSubject = subjects.find((s) => s.id === newBlock.subjectId);
    const newBlockData: ScheduleBlock = {
      id: `temp-${Date.now()}`,
      day: newBlock.day,
      startTime: newBlock.startTime,
      endTime: newBlock.endTime,
      subject: selectedSubject?.name || "",
      color: selectedSubject?.color || newBlock.color,
    };

    if (entityType === "course") {
      const selectedTeacher = teachers.find((t) => t.id === newBlock.detailId);
      if (selectedTeacher) {
        newBlockData.teacher = `${selectedTeacher.firstName} ${selectedTeacher.lastName}`;
        newBlockData.teacherId = selectedTeacher.id;
      }
    } else {
      const selectedCourse = courses.find((c) => c.id === newBlock.detailId);
      if (selectedCourse) {
        newBlockData.course = selectedCourse.name;
        newBlockData.courseId = selectedCourse.id;
      }
    }

    setBlocks([...blocks, newBlockData]);
    setIsAddingBlock(false);
    setNewBlock({
      day: "MONDAY",
      startTime: "08:00",
      endTime: "08:45",
      subject: "",
      subjectId: "",
      detail: "",
      detailId: "",
      color: PREDEFINED_COLORS[0],
    });
  };

  // ============================================
  // RENDERIZADO DE ESTADO
  // ============================================
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
            <span>✓ Guardado</span>
          </div>
        );
      case "error":
        return (
          <div className="schedule-save-status error">
            <span>✗ Error al guardar</span>
          </div>
        );
      default:
        return null;
    }
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (loadingData || !scheduleConfig) {
    return (
      <div className="schedule-editor-loading">
        <div className="schedule-editor-loading-spinner"></div>
        <p>Cargando editor...</p>
      </div>
    );
  }

  // ============================================
  // RENDER PRINCIPAL
  // ============================================
  return (
    <div className="schedule-editor">
      {/* Subject Palette */}
      <SubjectPalette
        subjects={subjects}
        onDragStart={(subject) => setDraggedSubject(subject)}
      />

      {/* Main Canvas */}
      <div className="schedule-editor-main">
        {/* Toolbar */}
        <div className="schedule-editor-toolbar">
          <button
            onClick={() => setIsAddingBlock(true)}
            className="schedule-editor-add-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Agregar Manual
          </button>

          <div className="schedule-toolbar-spacer"></div>

          {renderSaveStatus()}

          <div className="schedule-editor-block-count">
            {blocks.length} {blocks.length === 1 ? "bloque" : "bloques"}
          </div>
        </div>

        {/* Grid */}
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

            {/* Body */}
            <div className="schedule-editor-grid-body">
              {timeSlots.map((slot) => {
                // RECREO - Fila especial
                if (slot.type === 'break') {
                  return (
                    <div key={`break-${slot.time}`} className="schedule-editor-grid-row schedule-editor-break-row">
                      <div className="schedule-editor-time-cell schedule-editor-break-time">
                        <span className="schedule-editor-break-icon">🌤️</span>
                        <div>
                          <div className="schedule-editor-break-name">{slot.breakName}</div>
                          <div className="schedule-editor-break-duration">
                            {slot.time} - {slot.endTime}
                          </div>
                        </div>
                      </div>
                      {DAYS.map((day) => (
                        <div
                          key={`${day.key}-break-${slot.time}`}
                          className="schedule-editor-cell schedule-editor-break-cell"
                        >
                          <span className="schedule-editor-break-label">{slot.breakName}</span>
                        </div>
                      ))}
                    </div>
                  );
                }

                // BLOQUE - Fila normal
                return (
                  <div key={slot.time} className="schedule-editor-grid-row">
                    <div className="schedule-editor-time-cell">
                      <div className="schedule-editor-block-number">Bloque {slot.blockNumber}</div>
                      <div className="schedule-editor-block-time">{slot.time} - {slot.endTime}</div>
                    </div>
                    {DAYS.map((day) => {
                      const cellBlocks = getBlocksForSlot(day.key, slot.time);
                      const isDropTarget = dropTarget?.day === day.key && dropTarget?.time === slot.time;

                      return (
                        <div
                          key={`${day.key}-${slot.time}`}
                          className={`schedule-editor-cell ${isDropTarget ? "drop-hover" : ""} ${draggedSubject ? "drop-active" : ""}`}
                          onDragOver={(e) => handleDragOver(e, day.key, slot.time)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, day.key, slot.time, slot)}
                          onClick={() => {
                            if (cellBlocks.length === 0) {
                              setNewBlock({
                                ...newBlock,
                                day: day.key,
                                startTime: slot.time,
                                endTime: slot.endTime,
                              });
                              setIsAddingBlock(true);
                            }
                          }}
                        >
                          {cellBlocks.map((block) => {
                            const conflictMessage = entityType === 'course' 
                              ? `⚠️ El profesor ${block.teacher} no está disponible en este horario`
                              : `⚠️ No tienes disponibilidad marcada en este horario`;
                            
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
                                <div className="schedule-editor-block-subject">{block.subject}</div>
                                <div className="schedule-editor-block-detail">
                                  {entityType === "course" ? block.teacher : block.course}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Assign Modal */}
      {showQuickAssign && pendingBlock && (
        <QuickAssignModal
          subjectName={pendingBlock.subjectName}
          subjectColor={pendingBlock.subjectColor}
          day={pendingBlock.day}
          startTime={pendingBlock.startTime}
          endTime={pendingBlock.endTime}
          entityType={entityType}
          teachers={teachers}
          courses={courses}
          onConfirm={(detailId, detailName) => {
            const newBlockData: ScheduleBlock = {
              id: `temp-${Date.now()}`,
              day: pendingBlock.day,
              startTime: pendingBlock.startTime,
              endTime: pendingBlock.endTime,
              subject: pendingBlock.subjectName,
              color: pendingBlock.subjectColor,
            };

            if (entityType === "course") {
              newBlockData.teacher = detailName;
              newBlockData.teacherId = detailId;
            } else {
              newBlockData.course = detailName;
              newBlockData.courseId = detailId;
            }

            setBlocks([...blocks, newBlockData]);
            setShowQuickAssign(false);
            setPendingBlock(null);
            setDraggedSubject(null);
          }}
          onCancel={() => {
            setShowQuickAssign(false);
            setPendingBlock(null);
            setDraggedSubject(null);
          }}
        />
      )}

      {/* Add Block Modal */}
      {isAddingBlock && (
        <div className="schedule-editor-modal-overlay" onClick={() => setIsAddingBlock(false)}>
          <div className="schedule-editor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="schedule-editor-modal-header">
              <h3>Agregar Bloque de Clase</h3>
              <button onClick={() => setIsAddingBlock(false)} className="schedule-editor-modal-close">×</button>
            </div>

            <div className="schedule-editor-modal-body">
              <div className="schedule-editor-form-group">
                <label>Día</label>
                <select value={newBlock.day} onChange={(e) => setNewBlock({ ...newBlock, day: e.target.value })}>
                  {DAYS.map((day) => (
                    <option key={day.key} value={day.key}>{day.label}</option>
                  ))}
                </select>
              </div>

              <div className="schedule-editor-form-row">
                <div className="schedule-editor-form-group">
                  <label>Inicio</label>
                  <select value={newBlock.startTime} onChange={(e) => {
                    const startTime = e.target.value;
                    const slot = timeSlots.find(s => s.type === 'block' && s.time === startTime);
                    setNewBlock({ 
                      ...newBlock, 
                      startTime, 
                      endTime: slot?.endTime || newBlock.endTime 
                    });
                  }}>
                    {timeSlots.filter(s => s.type === 'block').map((slot) => (
                      <option key={slot.time} value={slot.time}>{slot.time}</option>
                    ))}
                  </select>
                </div>

                <div className="schedule-editor-form-group">
                  <label>Fin</label>
                  <input type="text" value={newBlock.endTime} readOnly />
                </div>
              </div>

              <div className="schedule-editor-form-group">
                <label>Asignatura</label>
                <select value={newBlock.subjectId} onChange={(e) => setNewBlock({ ...newBlock, subjectId: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </select>
              </div>

              <div className="schedule-editor-form-group">
                <label>{entityType === "course" ? "Profesor" : "Curso"}</label>
                <select value={newBlock.detailId} onChange={(e) => setNewBlock({ ...newBlock, detailId: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  {entityType === "course"
                    ? teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.firstName} {teacher.lastName}
                        </option>
                      ))
                    : courses.map((course) => (
                        <option key={course.id} value={course.id}>{course.name}</option>
                      ))}
                </select>
              </div>
            </div>

            <div className="schedule-editor-modal-footer">
              <button onClick={() => setIsAddingBlock(false)} className="schedule-editor-btn-secondary">
                Cancelar
              </button>
              <button 
                onClick={handleAddBlock} 
                className="schedule-editor-btn-primary"
                disabled={!newBlock.subjectId}
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Block Panel */}
      {selectedBlock && (
        <div className="schedule-editor-panel-overlay" onClick={() => setSelectedBlock(null)}>
          <div className="schedule-editor-panel" onClick={(e) => e.stopPropagation()}>
            <div className="schedule-editor-panel-header">
              <h3>Detalles del Bloque</h3>
              <button onClick={() => setSelectedBlock(null)} className="schedule-editor-panel-close">×</button>
            </div>

            <div className="schedule-editor-panel-body">
              <div className="schedule-editor-panel-field">
                <label>Asignatura</label>
                <div className="schedule-editor-panel-value">{selectedBlock.subject}</div>
              </div>

              <div className="schedule-editor-panel-field">
                <label>{entityType === "course" ? "Profesor" : "Curso"}</label>
                <div className="schedule-editor-panel-value">
                  {entityType === "course" ? selectedBlock.teacher : selectedBlock.course}
                </div>
              </div>

              <div className="schedule-editor-panel-field">
                <label>Día</label>
                <div className="schedule-editor-panel-value">
                  {DAYS.find((d) => d.key === selectedBlock.day)?.label}
                </div>
              </div>

              <div className="schedule-editor-panel-field">
                <label>Horario</label>
                <div className="schedule-editor-panel-value">
                  {selectedBlock.startTime} - {selectedBlock.endTime}
                </div>
              </div>

              {selectedBlock.hasConflict && (
                <div className="schedule-editor-panel-warning">
                  ⚠️ {entityType === 'course' 
                    ? `El profesor ${selectedBlock.teacher} no está disponible en este horario`
                    : 'No tienes disponibilidad marcada en este horario'}
                </div>
              )}
            </div>

            <div className="schedule-editor-panel-footer">
              <button 
                onClick={() => handleDeleteBlock(selectedBlock.id)} 
                className="schedule-editor-btn-danger"
              >
                Eliminar Bloque
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
