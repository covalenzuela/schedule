"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getTeachers,
  deleteTeacher,
  createTeacher,
  getTeacherAvailability,
} from "@/modules/teachers/actions";
import { getSchools } from "@/modules/schools/actions";
import { AddTeacherButton } from "@/modules/teachers/components/AddTeacherButton";
import { ImportTeachersModal } from "@/modules/teachers/components/ImportTeachersModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Card, Badge, Button } from "@/components/ui";
import { useModal } from "@/contexts/ModalContext";
import type { School } from "@/types";
import "../../teachers.css";

type Teacher = Awaited<ReturnType<typeof getTeachers>>[0];

export default function TeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>("all");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importSchoolId, setImportSchoolId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const { openModal, closeModal } = useModal();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [teachersData, schoolsData] = await Promise.all([
      getTeachers(),
      getSchools(),
    ]);
    setTeachers(teachersData);
    setSchools(schoolsData);
    setIsLoading(false);
  };

  const handleDownloadAvailability = async (teacher: any) => {
    const availability = await getTeacherAvailability(teacher.id);

    let content = `Disponibilidad de ${teacher.firstName} ${teacher.lastName}\n`;
    content += `Año académico: ${new Date().getFullYear()}\n\n`;

    if (availability.length === 0) {
      content += "No hay disponibilidad registrada.";
    } else {
      availability.forEach((slot: any) => {
        content += `- ${slot.dayOfWeek}: ${slot.startTime} - ${slot.endTime}\n`;
      });
    }

    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Disponibilidad_${teacher.firstName}_${teacher.lastName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteTeacher = (teacher: Teacher) => {
    openModal(
      <ConfirmDialog
        title="¿Eliminar profesor?"
        message={`¿Estás seguro de que quieres eliminar a ${teacher.firstName} ${teacher.lastName}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={async () => {
          try {
            await deleteTeacher(teacher.id);
            setTeachers(teachers.filter((t) => t.id !== teacher.id));
            closeModal();
          } catch (error) {
            console.error("Error al eliminar profesor:", error);
            alert("Error al eliminar el profesor");
          }
        }}
        onCancel={closeModal}
      />,
      "⚠️ Confirmar eliminación"
    );
  };

  const handleOpenImportModal = () => {
    // Si hay un solo colegio, auto-seleccionarlo
    if (schools.length === 1) {
      setImportSchoolId(schools[0].id);
      setShowImportModal(true);
    } else if (schools.length === 0) {
      alert("Necesitas crear al menos un colegio antes de importar profesores");
    } else {
      // Mostrar selector de colegio
      openModal(
        <div style={{ padding: "2rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>Selecciona un colegio</h3>
          <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "1.5rem" }}>
            ¿A qué colegio deseas importar los profesores?
          </p>
          <select
            style={{
              width: "100%",
              padding: "0.75rem",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "0.5rem",
              color: "#fff",
              fontSize: "1rem",
              marginBottom: "1.5rem",
            }}
            value={importSchoolId}
            onChange={(e) => setImportSchoolId(e.target.value)}
          >
            <option value="">Selecciona un colegio...</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
          <div
            style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}
          >
            <button
              onClick={closeModal}
              style={{
                padding: "0.75rem 1.5rem",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "0.5rem",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (importSchoolId) {
                  closeModal();
                  setShowImportModal(true);
                } else {
                  alert("Por favor selecciona un colegio");
                }
              }}
              disabled={!importSchoolId}
              style={{
                padding: "0.75rem 1.5rem",
                background: importSchoolId
                  ? "linear-gradient(135deg, var(--primary-500), var(--accent-500))"
                  : "rgba(255,255,255,0.1)",
                border: "none",
                borderRadius: "0.5rem",
                color: "#fff",
                cursor: importSchoolId ? "pointer" : "not-allowed",
                opacity: importSchoolId ? 1 : 0.5,
              }}
            >
              Continuar
            </button>
          </div>
        </div>,
        "🏫 Seleccionar Colegio"
      );
    }
  };

  const handleImportTeachers = async (
    importedTeachers: Array<{
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      specialization?: string;
    }>
  ) => {
    if (!importSchoolId) {
      alert("Por favor selecciona un colegio primero");
      return;
    }

    setIsLoading(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const teacher of importedTeachers) {
        try {
          await createTeacher({
            schoolId: importSchoolId,
            firstName: teacher.firstName,
            lastName: teacher.lastName,
            email: teacher.email,
            phone: teacher.phone,
            specialization: teacher.specialization,
          });
          successCount++;
        } catch (error) {
          console.error(
            `Error al importar ${teacher.firstName} ${teacher.lastName}:`,
            error
          );
          errorCount++;
        }
      }

      // Reload teachers
      await loadData();
      setShowImportModal(false);

      // Mostrar resultado
      openModal(
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
            {errorCount === 0 ? "✅" : "⚠️"}
          </div>
          <h3>Importación completada</h3>
          <p style={{ marginTop: "1rem", color: "rgba(255,255,255,0.7)" }}>
            {successCount} profesores importados correctamente
            {errorCount > 0 && ` · ${errorCount} errores`}
          </p>
          <button
            onClick={closeModal}
            style={{
              marginTop: "1.5rem",
              padding: "0.75rem 1.5rem",
              background: "var(--primary-500)",
              border: "none",
              borderRadius: "0.5rem",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Entendido
          </button>
        </div>,
        "📥 Resultado de importación"
      );
    } catch (error) {
      console.error("Error en la importación:", error);
      alert("Error durante la importación");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTeachers =
    selectedSchool === "all"
      ? teachers
      : teachers.filter((t) => t.schoolId === selectedSchool);

  if (isLoading) {
    return (
      <div className="schools-page">
        <div className="schools-bg">
          <div className="schools-gradient" />
        </div>
        <div className="schools-container">
          <div className="schools-empty">
            <div className="schools-empty-icon">⏳</div>
            <p className="schools-empty-title">Cargando profesores...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="schools-page">
      <div className="schools-bg">
        <div className="schools-gradient" />
      </div>

      <div className="schools-container">
        <header className="schools-header">
          <div className="schools-header-top">
            <h1 className="schools-title">👨‍🏫 Profesores</h1>
            <div className="schools-header-actions">
              <button
                className="schools-filter-btn"
                onClick={() => setShowFilters(!showFilters)}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="4" y1="21" x2="4" y2="14"></line>
                  <line x1="4" y1="10" x2="4" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12" y2="3"></line>
                  <line x1="20" y1="21" x2="20" y2="16"></line>
                  <line x1="20" y1="12" x2="20" y2="3"></line>
                  <line x1="1" y1="14" x2="7" y2="14"></line>
                  <line x1="9" y1="8" x2="15" y2="8"></line>
                  <line x1="17" y1="16" x2="23" y2="16"></line>
                </svg>
                Filtros
              </button>
              <button
                className="schools-add-btn"
                style={{
                  background: "linear-gradient(135deg, #10B981, #059669)",
                }}
                onClick={handleOpenImportModal}
                title="Importar desde Excel"
              >
                📥 Importar
              </button>
              <AddTeacherButton onTeacherCreated={loadData} />
            </div>
          </div>
          <p className="schools-description">
            Administra los profesores, su disponibilidad horaria y las
            asignaturas que pueden dictar.
          </p>
        </header>

        {/* Modal de Importación */}
        {showImportModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "1rem",
            }}
          >
            <div
              style={{
                background: "rgba(17, 24, 39, 0.98)",
                borderRadius: "1rem",
                maxWidth: "900px",
                width: "100%",
                maxHeight: "90vh",
                overflow: "auto",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <ImportTeachersModal
                schoolId={importSchoolId}
                onImport={handleImportTeachers}
                onCancel={() => setShowImportModal(false)}
              />
            </div>
          </div>
        )}

        {/* Panel de filtros */}
        {showFilters && (
          <div className="schools-filters">
            <div className="schools-filter-group">
              <label className="schools-filter-label">
                Filtrar por Colegio
              </label>
              <select
                className="schools-filter-select"
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
              >
                <option value="all">
                  Todos los colegios ({teachers.length})
                </option>
                {schools.map((school) => {
                  const count = teachers.filter(
                    (t) => t.schoolId === school.id
                  ).length;
                  return (
                    <option key={school.id} value={school.id}>
                      {school.name} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
            {selectedSchool !== "all" && (
              <button
                className="schools-filter-clear"
                onClick={() => setSelectedSchool("all")}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {filteredTeachers.length === 0 ? (
          <div className="schools-empty">
            <div className="schools-empty-icon">👨‍🏫</div>
            <p className="schools-empty-title">
              {selectedSchool === "all"
                ? "No hay profesores registrados"
                : "No hay profesores en este colegio"}
            </p>
            <p className="schools-empty-subtitle">
              {selectedSchool === "all"
                ? "Comienza agregando tu primer profesor"
                : "Intenta con otro colegio o limpia los filtros"}
            </p>
          </div>
        ) : (
          <div className="schools-grid">
            {filteredTeachers.map((teacher) => (
              <div key={teacher.id} className="schools-card">
                <div className="schools-card-header">
                  <div>
                    <h3 className="schools-card-title">
                      {teacher.firstName} {teacher.lastName}
                    </h3>
                    <span className="schools-card-school-badge">
                      🏫 {teacher.school.name}
                    </span>
                  </div>
                  <span className="schools-card-badge">
                    {teacher.specialization || "Profesor"}
                  </span>
                </div>

                <div className="schools-card-info">
                  <div className="schools-card-info-item">
                    <span className="schools-card-info-icon">✉️</span>
                    <span>{teacher.email}</span>
                  </div>
                  {teacher.phone && (
                    <div className="schools-card-info-item">
                      <span className="schools-card-info-icon">📞</span>
                      <span>{teacher.phone}</span>
                    </div>
                  )}
                  {teacher.teacherSubjects.length > 0 && (
                    <div className="schools-card-info-item">
                      <span className="schools-card-info-icon">📚</span>
                      <span>
                        {teacher.teacherSubjects.length} asignatura
                        {teacher.teacherSubjects.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>

                <div className="schools-card-footer">
                  <button
                    className="schools-card-btn schools-card-btn-primary"
                    onClick={() =>
                      router.push(`/teachers/${teacher.id}/availability`)
                    }
                    title="Gestionar disponibilidad horaria"
                  >
                    📅 Disponibilidad
                  </button>
                  <button
                    className="schools-card-btn schools-card-btn-ghost"
                    onClick={() => handleDownloadAvailability(teacher)}
                  >
                    Descargar 👇 disponibilidad
                  </button>
                  <button
                    className="schools-card-btn schools-card-btn-danger"
                    onClick={() => handleDeleteTeacher(teacher)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface DemoTeacherCardProps {
  name: string;
  email: string;
  subjects: string[];
  availability: string;
}

function DemoTeacherCard({
  name,
  email,
  subjects,
  availability,
}: DemoTeacherCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-neutral-900 mb-1">{name}</h3>
          <p className="text-sm text-neutral-600 mb-3">{email}</p>

          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-neutral-700">
                Asignaturas:
              </span>
              <div className="flex gap-2 mt-1">
                {subjects.map((subject) => (
                  <Badge key={subject} variant="accent">
                    {subject}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <span className="text-sm font-medium text-neutral-700">
                Disponibilidad:
              </span>
              <p className="text-sm text-neutral-600 mt-1">{availability}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
            Editar
          </Button>
          <Button variant="primary" size="sm">
            Ver Horario
          </Button>
        </div>
      </div>
    </Card>
  );
}
