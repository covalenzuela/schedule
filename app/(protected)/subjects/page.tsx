"use client";

import { useState, useEffect } from "react";
import {
  getSubjects,
  createSubject,
  deleteSubject,
} from "@/modules/subjects/actions";
import { getSchools } from "@/modules/schools/actions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useModal } from "@/contexts/ModalContext";
import { Input, Select } from "@/components/ui";
import { ImportSubjectsModal } from "@/modules/subjects/components/ImportSubjectsModal";
import type { School } from "@/types";
import "../../subjects.css"; 

// Tipo para subject con relaciones incluidas
type SubjectWithRelations = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  color: string | null;
  schoolId: string;
  createdAt: Date;
  updatedAt: Date;
  school: {
    name: string;
  };
  teacherSubjects: Array<{
    id: string;
    teacherId: string;
    subjectId: string;
    teacher: {
      firstName: string;
      lastName: string;
    };
  }>;
};

// 📚 Plantillas de asignaturas predefinidas
const SUBJECT_TEMPLATES = [
  {
    category: "Ciencias Exactas",
    subjects: [
      {
        name: "Matemáticas",
        code: "MAT",
        description: "Álgebra, geometría y cálculo",
        color: "#3B82F6",
      },
      {
        name: "Física",
        code: "FIS",
        description: "Mecánica, termodinámica y electromagnetismo",
        color: "#8B5CF6",
      },
      {
        name: "Química",
        code: "QUI",
        description: "Química orgánica e inorgánica",
        color: "#06B6D4",
      },
    ],
  },
  {
    category: "Lenguaje y Comunicación",
    subjects: [
      {
        name: "Lenguaje y Literatura",
        code: "LEN",
        description: "Comprensión lectora y expresión escrita",
        color: "#EC4899",
      },
      {
        name: "Inglés",
        code: "ING",
        description: "Inglés como segunda lengua",
        color: "#F59E0B",
      },
      {
        name: "Francés",
        code: "FRA",
        description: "Francés como lengua extranjera",
        color: "#EF4444",
      },
    ],
  },
  {
    category: "Ciencias Sociales",
    subjects: [
      {
        name: "Historia y Geografía",
        code: "HIS",
        description: "Historia universal y de Chile",
        color: "#10B981",
      },
      {
        name: "Educación Cívica",
        code: "CIV",
        description: "Formación ciudadana",
        color: "#14B8A6",
      },
      {
        name: "Filosofía",
        code: "FIL",
        description: "Pensamiento crítico y ética",
        color: "#6366F1",
      },
    ],
  },
  {
    category: "Ciencias Naturales",
    subjects: [
      {
        name: "Biología",
        code: "BIO",
        description: "Ciencias de la vida",
        color: "#22C55E",
      },
      {
        name: "Ciencias Naturales",
        code: "NAT",
        description: "Ciencias integradas",
        color: "#84CC16",
      },
    ],
  },
  {
    category: "Artes y Educación Física",
    subjects: [
      {
        name: "Artes Visuales",
        code: "ART",
        description: "Pintura, dibujo y escultura",
        color: "#F472B6",
      },
      {
        name: "Música",
        code: "MUS",
        description: "Teoría musical y práctica instrumental",
        color: "#A855F7",
      },
      {
        name: "Educación Física",
        code: "EDF",
        description: "Deportes y actividad física",
        color: "#F97316",
      },
    ],
  },
  {
    category: "Tecnología",
    subjects: [
      {
        name: "Tecnología",
        code: "TEC",
        description: "Diseño y tecnología digital",
        color: "#06B6D4",
      },
      {
        name: "Computación",
        code: "COM",
        description: "Programación y ofimática",
        color: "#3B82F6",
      },
    ],
  },
];

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectWithRelations[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [creationMode, setCreationMode] = useState<"template" | "custom">(
    "template"
  );
  const [selectedTemplate, setSelectedTemplate] = useState<
    (typeof SUBJECT_TEMPLATES)[0]["subjects"][0] | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { openModal, closeModal } = useModal();

  // Accordion state - todas las categorías abiertas por defecto
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    SUBJECT_TEMPLATES.reduce((acc, cat) => {
      acc[cat.category] = true;
      return acc;
    }, {} as Record<string, boolean>)
  );

  // Form state
  const [formData, setFormData] = useState({
    schoolId: "",
    name: "",
    code: "",
    description: "",
    color: "#3B82F6",
  });

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  useEffect(() => {
    const loadData = async () => {
      const [subjectsData, schoolsData] = await Promise.all([
        getSubjects(),
        getSchools(),
      ]);
      setSubjects(subjectsData);
      setSchools(schoolsData);

      // Si solo hay un colegio, auto-seleccionarlo
      if (schoolsData.length === 1 && formData.schoolId === "") {
        setFormData((prev) => ({
          ...prev,
          schoolId: schoolsData[0].id,
        }));
      }
    };
    loadData();
  }, []);

  const handleDeleteSubject = (subject: SubjectWithRelations) => {
    openModal(
      <ConfirmDialog
        title="¿Eliminar asignatura?"
        message={`¿Estás seguro de que quieres eliminar ${subject.name}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={async () => {
          try {
            await deleteSubject(subject.id);
            setSubjects(subjects.filter((s) => s.id !== subject.id));
            closeModal();
          } catch (error) {
            console.error("Error al eliminar asignatura:", error);
            alert("Error al eliminar la asignatura");
          }
        }}
        onCancel={closeModal}
      />,
      "⚠️ Confirmar eliminación"
    );
  };

  const handleTemplateSelect = (
    template: (typeof SUBJECT_TEMPLATES)[0]["subjects"][0]
  ) => {
    setSelectedTemplate(template);
    setFormData((prev) => ({
      ...prev,
      name: template.name,
      code: template.code,
      description: template.description,
      color: template.color,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    console.log("Submitting subject with data:", {
      schoolId: formData.schoolId,
      name: formData.name,
      code: formData.code,
    });
    console.log(
      "Available schools:",
      schools.map((s) => ({ id: s.id, name: s.name }))
    );

    try {
      await createSubject({
        schoolId: formData.schoolId,
        name: formData.name,
        code: formData.code,
        description: formData.description || undefined,
        color: formData.color || undefined,
      });

      // Reload subjects
      const subjectsData = await getSubjects();
      setSubjects(subjectsData);

      // Reset form
      setShowCreateForm(false);
      setSelectedTemplate(null);
      setFormData({
        schoolId: "",
        name: "",
        code: "",
        description: "",
        color: "#3B82F6",
      });
    } catch (error) {
      console.error("Error al crear asignatura:", error);
      setError("Error al crear la asignatura. Por favor intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Función para crear grupo completo de asignaturas
  const handleCreateGroup = async (category: (typeof SUBJECT_TEMPLATES)[0]) => {
    if (!formData.schoolId) {
      setError("Por favor selecciona un colegio primero");
      return;
    }

    openModal(
      <ConfirmDialog
        title="¿Crear grupo de asignaturas?"
        message={`¿Deseas crear todas las asignaturas de "${category.category}"? Se crearán ${category.subjects.length} asignaturas.`}
        confirmText="Crear Grupo"
        cancelText="Cancelar"
        variant="info"
        onConfirm={async () => {
          setIsLoading(true);
          try {
            // Crear todas las asignaturas del grupo
            for (const template of category.subjects) {
              await createSubject({
                schoolId: formData.schoolId,
                name: template.name,
                code: template.code,
                description: template.description || undefined,
                color: template.color || undefined,
              });
            }

            // Reload subjects
            const subjectsData = await getSubjects();
            setSubjects(subjectsData);
            closeModal();

            // Mostrar éxito
            openModal(
              <div style={{ padding: "2rem", textAlign: "center" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
                <h3>¡Grupo creado exitosamente!</h3>
                <p
                  style={{ marginTop: "1rem", color: "rgba(255,255,255,0.7)" }}
                >
                  Se han creado {category.subjects.length} asignaturas de{" "}
                  {category.category}
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
              "✨ Éxito"
            );
          } catch (error) {
            console.error("Error al crear grupo de asignaturas:", error);
            alert("Error al crear el grupo de asignaturas");
          } finally {
            setIsLoading(false);
          }
        }}
        onCancel={closeModal}
      />,
      "📚 Confirmar creación"
    );
  };

  // Función para importar asignaturas desde Excel
  const handleImportSubjects = async (
    importedSubjects: Array<{
      name: string;
      code: string;
      description?: string;
      color?: string;
    }>
  ) => {
    if (!formData.schoolId) {
      alert("Por favor selecciona un colegio primero");
      return;
    }

    setIsLoading(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const subject of importedSubjects) {
        try {
          await createSubject({
            schoolId: formData.schoolId,
            name: subject.name,
            code: subject.code,
            description: subject.description,
            color: subject.color,
          });
          successCount++;
        } catch (error) {
          console.error(`Error al importar ${subject.name}:`, error);
          errorCount++;
        }
      }

      // Reload subjects
      const subjectsData = await getSubjects();
      setSubjects(subjectsData);
      setShowImportModal(false);

      // Mostrar resultado
      openModal(
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
            {errorCount === 0 ? "✅" : "⚠️"}
          </div>
          <h3>Importación completada</h3>
          <p style={{ marginTop: "1rem", color: "rgba(255,255,255,0.7)" }}>
            {successCount} asignaturas importadas correctamente
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

  return (
    <div className="schools-page">
      <div className="schools-bg">
        <div className="schools-gradient" />
      </div>

      <div className="schools-container">
        <header className="schools-header">
          <div className="schools-header-top">
            <h1 className="schools-title">📚 Asignaturas</h1>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                className="schools-add-btn"
                style={{
                  background: "linear-gradient(135deg, #10B981, #059669)",
                }}
                onClick={() => {
                  if (!formData.schoolId && schools.length > 1) {
                    alert(
                      "Por favor, selecciona un colegio primero en el formulario de abajo"
                    );
                    setShowCreateForm(true);
                    return;
                  }
                  setShowImportModal(true);
                }}
                title="Importar desde Excel"
              >
                📥 Importar
              </button>
              <button
                className="schools-add-btn"
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                {showCreateForm ? "✕ Cancelar" : "+ Agregar Asignatura"}
              </button>
            </div>
          </div>
          <p className="schools-description">
            {showCreateForm
              ? "Selecciona una plantilla o crea una asignatura personalizada"
              : "Gestiona las asignaturas disponibles y asígnalas a profesores calificados."}
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
              <ImportSubjectsModal
                schoolId={formData.schoolId}
                onImport={handleImportSubjects}
                onCancel={() => setShowImportModal(false)}
              />
            </div>
          </div>
        )}

        {/* Formulario de creación */}
        {showCreateForm && (
          <div className="subject-create-section">
            <form onSubmit={handleSubmit} className="subject-form">
              {/* Mode Toggle */}
              <div className="subject-mode-toggle">
                <button
                  type="button"
                  className={`subject-mode-btn ${
                    creationMode === "template" ? "active" : ""
                  }`}
                  onClick={() => {
                    setCreationMode("template");
                    if (selectedTemplate) {
                      setFormData((prev) => ({
                        ...prev,
                        name: selectedTemplate.name,
                        code: selectedTemplate.code,
                        description: selectedTemplate.description,
                        color: selectedTemplate.color,
                      }));
                    }
                  }}
                >
                  <span>✨</span>
                  Desde Plantilla
                </button>
                <button
                  type="button"
                  className={`subject-mode-btn ${
                    creationMode === "custom" ? "active" : ""
                  }`}
                  onClick={() => {
                    setCreationMode("custom");
                    setSelectedTemplate(null);
                  }}
                >
                  <span>✏️</span>
                  Personalizado
                </button>
              </div>

              {/* Plantillas */}
              {creationMode === "template" && (
                <div className="subject-templates">
                  {SUBJECT_TEMPLATES.map((category) => (
                    <div key={category.category} className="template-category">
                      <div className="template-category-header">
                        <h4 className="template-category-title">
                          {category.category}
                        </h4>
                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            alignItems: "center",
                          }}
                        >
                          <button
                            type="button"
                            className="btn-create-group"
                            onClick={() => handleCreateGroup(category)}
                            title={`Crear todas las asignaturas de ${category.category}`}
                            style={{
                              padding: "0.5rem 1rem",
                              background:
                                "linear-gradient(135deg, var(--primary-500), var(--accent-500))",
                              border: "none",
                              borderRadius: "0.5rem",
                              color: "#fff",
                              fontSize: "0.875rem",
                              fontWeight: "600",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "scale(1.05)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "scale(1)";
                            }}
                          >
                            ✨ Crear Grupo ({category.subjects.length})
                          </button>
                          <button
                            type="button"
                            className="template-category-toggle"
                            onClick={() => toggleCategory(category.category)}
                            aria-label={
                              openCategories[category.category]
                                ? "Cerrar"
                                : "Abrir"
                            }
                          >
                            <span
                              className={`toggle-icon ${
                                openCategories[category.category] ? "open" : ""
                              }`}
                            >
                              ▼
                            </span>
                          </button>
                        </div>
                      </div>
                      {openCategories[category.category] && (
                        <div className="template-grid">
                          {category.subjects.map((template) => (
                            <button
                              key={template.code}
                              type="button"
                              className={`template-card ${
                                selectedTemplate?.code === template.code
                                  ? "selected"
                                  : ""
                              }`}
                              onClick={() => handleTemplateSelect(template)}
                              style={
                                {
                                  "--template-color": template.color,
                                } as React.CSSProperties
                              }
                            >
                              <div className="template-selected-badge">
                                ✓ Seleccionada
                              </div>
                              <div className="template-header">
                                <div className="template-info">
                                  <h5 className="template-name">
                                    {template.name}
                                  </h5>
                                  <span className="template-code">
                                    {template.code}
                                  </span>
                                </div>
                                <div
                                  className="template-color"
                                  style={{ backgroundColor: template.color }}
                                />
                              </div>
                              <p className="template-description">
                                {template.description}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* School selector */}
              <div className="form-group">
                <label htmlFor="schoolId" className="form-label">
                  Colegio <span className="required">*</span>
                </label>
                <Select
                  id="schoolId"
                  name="schoolId"
                  required
                  disabled={isLoading}
                  value={formData.schoolId}
                  onChange={(e) => {
                    console.log("Select changed to:", e.target.value);
                    setFormData((prev) => ({
                      ...prev,
                      schoolId: e.target.value,
                    }));
                  }}
                  placeholder="Selecciona un colegio"
                  options={schools.map((school) => ({
                    value: school.id,
                    label: school.name,
                  }))}
                />
              </div>

              {/* Campos del formulario */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Nombre <span className="required">*</span>
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Ej: Matemáticas"
                    required
                    disabled={isLoading}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="code" className="form-label">
                    Código <span className="required">*</span>
                  </label>
                  <Input
                    id="code"
                    name="code"
                    type="text"
                    placeholder="Ej: MAT"
                    required
                    disabled={isLoading}
                    value={formData.code}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, code: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  Descripción
                </label>
                <Input
                  id="description"
                  name="description"
                  type="text"
                  placeholder="Descripción breve de la asignatura"
                  disabled={isLoading}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="color" className="form-label">
                  Color
                </label>
                <div className="color-input-wrapper">
                  <input
                    id="color"
                    name="color"
                    type="color"
                    disabled={isLoading}
                    value={formData.color}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        color: e.target.value,
                      }))
                    }
                  />
                  <span className="color-hint">
                    Color para identificar la asignatura
                  </span>
                </div>
              </div>

              {error && (
                <div
                  className="form-error"
                  style={{
                    padding: "1rem",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "0.75rem",
                    color: "#fca5a5",
                  }}
                >
                  {error}
                </div>
              )}

              <div
                className="form-actions"
                style={{
                  display: "flex",
                  gap: "1rem",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  disabled={isLoading}
                  className="auth-button auth-button-outline"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="auth-button auth-button-primary"
                >
                  {isLoading ? "Creando..." : "Crear Asignatura"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de asignaturas */}
        {!showCreateForm && (
          <>
            {subjects.length === 0 ? (
              <div className="schools-empty">
                <div className="schools-empty-icon">📚</div>
                <p className="schools-empty-title">
                  No hay asignaturas registradas
                </p>
                <p className="schools-empty-subtitle">
                  Comienza agregando tu primera asignatura
                </p>
              </div>
            ) : (
              <div className="schools-grid">
                {subjects.map((subject) => (
                  <div key={subject.id} className="schools-card">
                    <div className="schools-card-header">
                      <div>
                        <h3 className="schools-card-title">{subject.name}</h3>
                      </div>
                      <span
                        className="schools-card-badge"
                        style={{
                          background: subject.color
                            ? `${subject.color}33`
                            : undefined,
                          borderColor: subject.color
                            ? `${subject.color}66`
                            : undefined,
                        }}
                      >
                        {subject.code}
                      </span>
                    </div>

                    <div className="schools-card-info">
                      <div className="schools-card-info-item">
                        <span className="schools-card-info-icon">🏫</span>
                        <span>{subject.school.name}</span>
                      </div>
                      {subject.teacherSubjects.length > 0 && (
                        <div className="schools-card-info-item">
                          <span className="schools-card-info-icon">👨‍🏫</span>
                          <span>
                            {subject.teacherSubjects.length} profesor
                            {subject.teacherSubjects.length !== 1 ? "es" : ""}
                          </span>
                        </div>
                      )}
                      {subject.description && (
                        <div className="schools-card-info-item">
                          <span className="schools-card-info-icon">📝</span>
                          <span>{subject.description}</span>
                        </div>
                      )}
                    </div>

                    <div className="schools-card-footer">
                      <button className="schools-card-btn schools-card-btn-primary">
                        Ver Detalles
                      </button>
                      <button className="schools-card-btn schools-card-btn-ghost">
                        Editar
                      </button>
                      <button
                        className="schools-card-btn schools-card-btn-danger"
                        onClick={() => handleDeleteSubject(subject)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
