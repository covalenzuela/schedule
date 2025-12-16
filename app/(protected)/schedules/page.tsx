"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCourses } from "@/modules/courses/actions";
import { getTeachers } from "@/modules/teachers/actions";
import {
  getSchedulesForCourse,
  getSchedulesForTeacher,
} from "@/modules/schedules/actions";
import { getScheduleConfigForCourse } from "@/modules/schools/actions/schedule-config";
import { ScheduleGrid } from "@/modules/schedules/components/ScheduleGridSimple";
import { DownloadScheduleModal } from "@/components/ui";
import "../../schools.css";
import "../../schedules.css";
import "../../schedule-grid.css";
import "../../schedule-accordion.css";

type ScheduleView = "course" | "teacher";

interface DownloadData {
  name: string;
  id: string;
  type: "course" | "teacher";
}

// Helper para formatear niveles académicos
const formatAcademicLevel = (level: string): string => {
  const levels: Record<string, string> = {
    PRIMARY: "Básica",
    SECONDARY: "Media",
    HIGH_SCHOOL: "Superior",
  };
  return levels[level] || level;
};

export default function SchedulesPage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<ScheduleView>("course");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState<
    Record<string, boolean>
  >({});
  const [scheduleData, setScheduleData] = useState<Record<string, any>>({});
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [downloadData, setDownloadData] = useState<DownloadData | null>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);

  // Extraer lista única de colegios
  const schools = React.useMemo(() => {
    const allItems = [...courses, ...teachers];
    const schoolMap = new Map();

    allItems.forEach((item: any) => {
      if (item.school && item.school.id) {
        schoolMap.set(item.school.id, item.school);
      }
    });

    const uniqueSchools = Array.from(schoolMap.values());
    console.log("[Schedules] Total items:", allItems.length);
    console.log(
      "[Schedules] Unique schools:",
      uniqueSchools.length,
      uniqueSchools
    );
    return uniqueSchools;
  }, [courses, teachers]);

  // Filtrar cursos y profesores por colegio seleccionado
  const filteredCourses = selectedSchoolId
    ? courses.filter((course: any) => course.school?.id === selectedSchoolId)
    : courses;

  const filteredTeachers = selectedSchoolId
    ? teachers.filter((teacher: any) => teacher.school?.id === selectedSchoolId)
    : teachers;

  // Obtener el colegio seleccionado
  const selectedSchool = schools.find(
    (school: any) => school.id === selectedSchoolId
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const [coursesData, teachersData] = await Promise.all([
          getCourses(),
          getTeachers(),
        ]);
        setCourses(coursesData);
        setTeachers(teachersData);

        // Auto-seleccionar el primer colegio si hay datos
        if (coursesData.length > 0) {
          setSelectedSchoolId((coursesData[0].school as any).id);
        } else if (teachersData.length > 0) {
          setSelectedSchoolId((teachersData[0].school as any).id);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const toggleExpand = async (id: string, type: "course" | "teacher") => {
    const newExpandedId = expandedId === id ? null : id;
    setExpandedId(newExpandedId);

    // Si se está abriendo el acordeón, SIEMPRE recargar los datos (sin caché)
    if (newExpandedId) {
      setLoadingSchedules((prev) => ({ ...prev, [id]: true }));
      try {
        if (type === "course") {
          console.log("[Acordeón] Cargando schedules para curso:", id);
          const schedules = await getSchedulesForCourse(id);
          console.log("[Acordeón] Schedules recibidos:", schedules.length);
          if (schedules && schedules.length > 0) {
            console.log(
              "[Acordeón] Schedule ID:",
              schedules[0].id,
              "Bloques:",
              schedules[0].blocks.length
            );
            // Transformar bloques para el ScheduleGrid
            const blocks = schedules[0].blocks.map((block: any) => ({
              id: block.id,
              day: block.dayOfWeek,
              startTime: block.startTime,
              endTime: block.endTime,
              subject: block.subject.name,
              teacher: block.teacher ? `${block.teacher.firstName} ${block.teacher.lastName}` : '',
              teacherId: block.teacher?.id,
              color: block.subject.color,
            }));
            console.log("[Acordeón] Bloques transformados:", blocks.length);
            
            // Obtener configuración del nivel académico del curso
            try {
              const config = await getScheduleConfigForCourse(id);
              console.log("[Acordeón] Config cargada:", config);
              
              // Guardar bloques, configuración y metadatos del schedule
              setScheduleData((prev) => ({
                ...prev,
                [id]: {
                  blocks,
                  config,
                  isDeprecated: schedules[0].isDeprecated,
                  scheduleId: schedules[0].id,
                  configSnapshot: schedules[0].configSnapshot,
                },
              }));
            } catch (configError) {
              console.error("[Acordeón] Error obteniendo config, usando fallback:", configError);
              // Guardar sin config si falla
              setScheduleData((prev) => ({
                ...prev,
                [id]: {
                  blocks,
                  config: null,
                  isDeprecated: schedules[0].isDeprecated,
                  scheduleId: schedules[0].id,
                  configSnapshot: schedules[0].configSnapshot,
                },
              }));
            }
          } else {
            // No hay schedules, pero igual obtener config para posible uso futuro
            try {
              const config = await getScheduleConfigForCourse(id);
              setScheduleData((prev) => ({ 
                ...prev, 
                [id]: { 
                  blocks: [], 
                  config,
                  isDeprecated: false,
                  scheduleId: null,
                  configSnapshot: null,
                } 
              }));
            } catch (error) {
              console.error("[Acordeón] Error obteniendo config:", error);
              setScheduleData((prev) => ({ 
                ...prev, 
                [id]: { 
                  blocks: [], 
                  config: null,
                  isDeprecated: false,
                  scheduleId: null,
                  configSnapshot: null,
                } 
              }));
            }
          }
        } else {
          // Cargar horarios de profesor
          console.log("[Acordeón] Cargando schedules para profesor:", id);
          const blocks = await getSchedulesForTeacher(id);
          console.log("[Acordeón] Bloques recibidos:", blocks.length);
          if (blocks && blocks.length > 0) {
            // Transformar bloques para el ScheduleGrid
            const transformedBlocks = blocks.map((block: any) => ({
              id: block.id,
              day: block.dayOfWeek,
              startTime: block.startTime,
              endTime: block.endTime,
              subject: block.subject.name,
              course: block.course?.name || '',
              courseId: block.course?.id,
              color: block.subject.color,
            }));
            console.log(
              "[Acordeón] Bloques transformados:",
              transformedBlocks.length
            );
            setScheduleData((prev) => ({ 
              ...prev, 
              [id]: { 
                blocks: transformedBlocks,
                config: null, // Profesores no tienen config específica
                isDeprecated: false,
                scheduleId: null,
                configSnapshot: null,
              } 
            }));
          } else {
            setScheduleData((prev) => ({ 
              ...prev, 
              [id]: { 
                blocks: [], 
                config: null,
                isDeprecated: false,
                scheduleId: null,
                configSnapshot: null,
              } 
            }));
          }
        }
      } catch (error) {
        console.error("Error cargando horario:", error);
        // Establecer estructura vacía con la forma correcta
        setScheduleData((prev) => ({ 
          ...prev, 
          [id]: { 
            blocks: [], 
            config: null,
            isDeprecated: false,
            scheduleId: null,
            configSnapshot: null,
          } 
        }));
      } finally {
        setLoadingSchedules((prev) => ({ ...prev, [id]: false }));
      }
    }
  };

  const handleDownload = async (
    name: string,
    id: string,
    type: "course" | "teacher"
  ) => {
    // Primero expandir el acordeón si no está expandido
    if (expandedId !== id) {
      setExpandedId(id);
    }

    // Cargar datos del horario si no están en el estado
    if (!scheduleData[id]) {
      setLoadingSchedules((prev) => ({ ...prev, [id]: true }));
      try {
        if (type === "course") {
          const schedules = await getSchedulesForCourse(id);
          if (schedules && schedules.length > 0) {
            const blocks = schedules[0].blocks.map((block: any) => ({
              id: block.id,
              day: block.dayOfWeek,
              startTime: block.startTime,
              endTime: block.endTime,
              subject: block.subject.name,
              teacher: block.teacher ? `${block.teacher.firstName} ${block.teacher.lastName}` : '',
              teacherId: block.teacher?.id,
              color: block.subject.color,
            }));
            setScheduleData((prev) => ({ ...prev, [id]: blocks }));
          }
        } else {
          const blocks = await getSchedulesForTeacher(id);
          if (blocks && blocks.length > 0) {
            const transformedBlocks = blocks.map((block: any) => ({
              id: block.id,
              day: block.dayOfWeek,
              startTime: block.startTime,
              endTime: block.endTime,
              subject: block.subject.name,
              course: block.course?.name || '',
              courseId: block.course?.id,
              color: block.subject.color,
            }));
            setScheduleData((prev) => ({ ...prev, [id]: transformedBlocks }));
          }
        }
      } catch (error) {
        console.error("Error cargando horario para descarga:", error);
      } finally {
        setLoadingSchedules((prev) => ({ ...prev, [id]: false }));
      }
    }

    // Pequeño delay para asegurar que el DOM se ha actualizado
    setTimeout(() => {
      setDownloadData({ name, id, type });
      setDownloadModalOpen(true);
    }, 300);
  };

  const handleEdit = (id: string, type: "course" | "teacher") => {
    router.push(`/schedules/editor?id=${id}&type=${type}`);
  };

  return (
    <div className="schools-page">
      <div className="schools-bg">
        <div className="schools-gradient" />
      </div>

      <div className="schools-container">
        <header className="schools-header">
          <div className="schools-header-top">
            <h1 className="schools-title">🗓️ Horarios</h1>
          </div>
          <p className="schools-description">
            Visualiza y gestiona los horarios semanales de cursos y profesores.
          </p>
        </header>

        {/* Pestañas de visualización */}
        <div className="schedule-tabs">
          <button
            className={`schedule-tab ${
              activeView === "course" ? "active" : ""
            }`}
            onClick={() => setActiveView("course")}
          >
            <span className="schedule-tab-icon">🎓</span>
            <span className="schedule-tab-text">Por Curso</span>
          </button>
          <button
            className={`schedule-tab ${
              activeView === "teacher" ? "active" : ""
            }`}
            onClick={() => setActiveView("teacher")}
          >
            <span className="schedule-tab-icon">👨‍🏫</span>
            <span className="schedule-tab-text">Por Profesor</span>
          </button>
        </div>

        {/* Selector de colegio */}
        {!loading && schools.length > 0 && (
          <div className="school-selector-container">
            <label className="school-selector-label">
              <span className="school-selector-icon">🏫</span>
              <span>Colegio:</span>
            </label>
            <select
              className="school-selector"
              value={selectedSchoolId || ""}
              onChange={(e) => {
                setSelectedSchoolId(e.target.value);
                setExpandedId(null); // Cerrar acordeones al cambiar colegio
              }}
            >
              {schools.map((school: any) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Info del colegio seleccionado */}
        {!loading && selectedSchool && (
          <div className="selected-school-info">
            <div className="selected-school-icon">🏫</div>
            <div className="selected-school-details">
              <h2 className="selected-school-name">
                {(selectedSchool as any).name}
              </h2>
              <p className="selected-school-meta">
                {activeView === "course"
                  ? `${filteredCourses.length} ${
                      filteredCourses.length === 1 ? "curso" : "cursos"
                    }`
                  : `${filteredTeachers.length} ${
                      filteredTeachers.length === 1 ? "profesor" : "profesores"
                    }`}
              </p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="schools-empty">
            <div className="schools-empty-icon">⏳</div>
            <p className="schools-empty-title">Cargando horarios...</p>
          </div>
        ) : (
          <>
            {/* Empty state */}
            {((activeView === "course" && filteredCourses.length === 0) ||
              (activeView === "teacher" && filteredTeachers.length === 0)) && (
              <div className="schools-empty">
                <div className="schools-empty-icon">
                  {activeView === "course" ? "🎓" : "👨‍🏫"}
                </div>
                <p className="schools-empty-title">
                  {activeView === "course"
                    ? "No hay cursos registrados en este colegio"
                    : "No hay profesores registrados en este colegio"}
                </p>
                <p className="schools-empty-subtitle">
                  {activeView === "course"
                    ? "Selecciona otro colegio o crea cursos para este"
                    : "Selecciona otro colegio o crea profesores para este"}
                </p>
              </div>
            )}

            {/* Accordion list */}
            {((activeView === "course" && filteredCourses.length > 0) ||
              (activeView === "teacher" && filteredTeachers.length > 0)) && (
              <div className="schedule-accordion-container">
                {activeView === "course"
                  ? filteredCourses.map((course) => (
                      <div key={course.id} className="schedule-accordion-item">
                        <div
                          className="schedule-accordion-header"
                          onClick={() => toggleExpand(course.id, "course")}
                        >
                          <div className="schedule-accordion-info">
                            <div className="schedule-accordion-icon">🎓</div>
                            <div>
                              <h3 className="schedule-accordion-title">
                                {course.name}
                                {scheduleData[course.id]?.isDeprecated && (
                                  <span style={{
                                    marginLeft: "0.75rem",
                                    padding: "0.25rem 0.5rem",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    color: "rgb(251, 191, 36)",
                                    background: "rgba(251, 191, 36, 0.1)",
                                    border: "1px solid rgba(251, 191, 36, 0.3)",
                                    borderRadius: "0.375rem",
                                  }}>
                                    ⚠️ Obsoleto
                                  </span>
                                )}
                              </h3>
                              <p className="schedule-accordion-subtitle">
                                {course.grade}° {course.section} •{" "}
                                {formatAcademicLevel(course.academicLevel)} •{" "}
                                {course.studentCount || 0} estudiantes
                              </p>
                            </div>
                          </div>
                          <div className="schedule-accordion-actions">
                            <button
                              className="schedule-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(
                                  course.name,
                                  course.id,
                                  "course"
                                );
                              }}
                              title="Descargar horario"
                            >
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                              </svg>
                            </button>
                            <button
                              className="schedule-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(course.id, "course");
                              }}
                              title="Editar horario"
                            >
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
                            <button className="schedule-accordion-toggle">
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                style={{
                                  transform:
                                    expandedId === course.id
                                      ? "rotate(180deg)"
                                      : "rotate(0deg)",
                                  transition: "transform 0.3s ease",
                                }}
                              >
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            </button>
                          </div>
                        </div>
                        {expandedId === course.id && (
                          <div className="schedule-accordion-content">
                            {(() => {
                              console.log(`[Render] Curso ${course.id}:`, scheduleData[course.id]);
                              console.log(`[Render] Has blocks?:`, scheduleData[course.id]?.blocks);
                              console.log(`[Render] Blocks length:`, scheduleData[course.id]?.blocks?.length);
                            })()}
                            {loadingSchedules[course.id] ? (
                              <div
                                style={{
                                  padding: "2rem",
                                  textAlign: "center",
                                  color: "rgba(255, 255, 255, 0.6)",
                                }}
                              >
                                ⏳ Cargando horario...
                              </div>
                            ) : scheduleData[course.id]?.blocks &&
                              scheduleData[course.id].blocks.length > 0 ? (
                              <>
                                {console.log(`[Render] 🎨 Renderizando ScheduleGrid con ${scheduleData[course.id].blocks.length} bloques`)}
                                {scheduleData[course.id].isDeprecated && (
                                  <div style={{
                                    margin: "1rem",
                                    padding: "1rem",
                                    background: "rgba(251, 191, 36, 0.1)",
                                    border: "1px solid rgb(251, 191, 36)",
                                    borderRadius: "0.75rem",
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "1rem",
                                  }}>
                                    <span style={{ fontSize: "1.5rem" }}>⚠️</span>
                                    <div style={{ flex: 1 }}>
                                      <strong style={{ color: "rgb(251, 191, 36)", display: "block", marginBottom: "0.5rem" }}>
                                        Este horario quedó obsoleto
                                      </strong>
                                      <p style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.8)", margin: 0 }}>
                                        La configuración de jornada del nivel académico fue modificada.
                                        Este horario podría tener bloques fuera de rango o en horas incorrectas.
                                        Se recomienda recrearlo en el editor.
                                      </p>
                                    </div>
                                  </div>
                                )}
                                <div id={`schedule-grid-${course.id}`}>
                                  <ScheduleGrid
                                    blocks={scheduleData[course.id].blocks}
                                    type="course"
                                    config={scheduleData[course.id].config}
                                  />
                                </div>
                              </>
                            ) : (
                              <div
                                style={{
                                  padding: "2rem",
                                  textAlign: "center",
                                  color: "rgba(255, 255, 255, 0.6)",
                                }}
                              >
                                Este curso aún no tiene horario asignado
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  : filteredTeachers.map((teacher) => (
                      <div key={teacher.id} className="schedule-accordion-item">
                        <div
                          className="schedule-accordion-header"
                          onClick={() => toggleExpand(teacher.id, "teacher")}
                        >
                          <div className="schedule-accordion-info">
                            <div className="schedule-accordion-icon">👨‍🏫</div>
                            <div>
                              <h3 className="schedule-accordion-title">
                                {teacher.firstName} {teacher.lastName}
                              </h3>
                              <p className="schedule-accordion-subtitle">
                                {teacher.specialization ||
                                  "Sin especialización"}{" "}
                                • {teacher.email}
                              </p>
                            </div>
                          </div>
                          <div className="schedule-accordion-actions">
                            <button
                              className="schedule-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(
                                  `${teacher.firstName} ${teacher.lastName}`,
                                  teacher.id,
                                  "teacher"
                                );
                              }}
                              title="Descargar horario"
                            >
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                              </svg>
                            </button>
                            <button
                              className="schedule-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(teacher.id, "teacher");
                              }}
                              title="Editar horario"
                            >
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
                            <button className="schedule-accordion-toggle">
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                style={{
                                  transform:
                                    expandedId === teacher.id
                                      ? "rotate(180deg)"
                                      : "rotate(0deg)",
                                  transition: "transform 0.3s ease",
                                }}
                              >
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            </button>
                          </div>
                        </div>
                        {expandedId === teacher.id && (
                          <div className="schedule-accordion-content">
                            {loadingSchedules[teacher.id] ? (
                              <div
                                style={{
                                  padding: "2rem",
                                  textAlign: "center",
                                  color: "rgba(255, 255, 255, 0.6)",
                                }}
                              >
                                ⏳ Cargando horario...
                              </div>
                            ) : scheduleData[teacher.id] &&
                              scheduleData[teacher.id].length > 0 ? (
                              <div id={`schedule-grid-${teacher.id}`}>
                                <ScheduleGrid
                                  blocks={scheduleData[teacher.id]}
                                  type="teacher"
                                />
                              </div>
                            ) : (
                              <div
                                style={{
                                  padding: "2rem",
                                  textAlign: "center",
                                  color: "rgba(255, 255, 255, 0.6)",
                                }}
                              >
                                Este profesor aún no tiene horario asignado
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de descarga */}
      {downloadModalOpen && downloadData && scheduleData[downloadData.id] && (
        <DownloadScheduleModal
          isOpen={downloadModalOpen}
          onClose={() => {
            setDownloadModalOpen(false);
            setDownloadData(null);
          }}
          scheduleName={downloadData.name}
          scheduleId={downloadData.id}
        />
      )}
    </div>
  );
}
