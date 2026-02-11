"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCourses } from "@/modules/courses/actions";
import { getTeachers } from "@/modules/teachers/actions";
import { ScheduleEditor } from "@/modules/schedules/components/ScheduleEditor";

/* styles */
import "../../../schools.css";
import "../../../schedules.css";
import "../../../schedule-grid.css";
import "../../../schedule-editor.css";

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const type = searchParams.get("type") as "course" | "teacher";

  const [entity, setEntity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEntity = async () => {
      if (!id || !type) {
        setLoading(false);
        return;
      }

      try {
        if (type === "course") {
          const courses = await getCourses();
          const course = courses.find((c: any) => c.id === id);
          setEntity(course);
        } else if (type === "teacher") {
          const teachers = await getTeachers();
          const teacher = teachers.find((t: any) => t.id === id);
          setEntity(teacher);
        }
      } catch (error) {
        console.error("Error loading entity:", error);
      } finally {
        setLoading(false);
      }
    };

    loadEntity();
  }, [id, type]);

  const handleBack = () => {
    router.push("/schedules");
  };

  if (loading) {
    return (
      <div className="schools-page">
        <div className="schools-bg">
          <div className="schools-gradient" />
        </div>
        <div className="schools-container">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "50vh",
              gap: "1rem",
              color: "rgba(255, 255, 255, 0.7)",
            }}
          >
            <div className="schedule-editor-loading-spinner"></div>
            <p>Cargando editor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="schools-page">
        <div className="schools-bg">
          <div className="schools-gradient" />
        </div>
        <div className="schools-container">
          <div className="schools-empty">
            <div className="schools-empty-icon">❌</div>
            <p className="schools-empty-title">
              {type === "course"
                ? "Curso no encontrado"
                : "Profesor no encontrado"}
            </p>
            <button
              onClick={handleBack}
              className="schools-add-btn"
              style={{ marginTop: "1rem" }}
            >
              ← Volver a Horarios
            </button>
          </div>
        </div>
      </div>
    );
  }

  const entityName =
    type === "course" ? entity.name : `${entity.firstName} ${entity.lastName}`;

  return (
    <div className="schools-page">
      <div className="schools-bg">
        <div className="schools-gradient" />
      </div>

      <div className="schools-container">
        <div className="schedule-editor-header">
          <button onClick={handleBack} className="schedule-editor-back-btn">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Volver
          </button>
          <div className="schedule-editor-title">
            <h1>{type === "course" ? "🎓" : "👨‍🏫"} Editar Horario</h1>
            <p className="schedule-editor-subtitle">
              {entityName}
              {type === "course" && entity.studentCount && (
                <span> • {entity.studentCount} estudiantes</span>
              )}
              {type === "teacher" && entity.specialization && (
                <span> • {entity.specialization}</span>
              )}
            </p>
          </div>
        </div>

        <ScheduleEditor
          entityId={id!}
          entityType={type}
          entityName={entityName}
          schoolId={entity.schoolId}
        />
      </div>
    </div>
  );
}

export default function ScheduleEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="schools-page">
          <div className="schools-bg">
            <div className="schools-gradient" />
          </div>
          <div className="schools-container">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "50vh",
                color: "rgba(255, 255, 255, 0.7)",
              }}
            >
              Cargando...
            </div>
          </div>
        </div>
      }
    >
      <EditorContent />
    </Suspense>
  );
}
