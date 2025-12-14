/**
 * ⚡ QuickAssignModal - Modal rápido para asignar profesor/curso al soltar asignatura
 */

"use client";

import React from "react";

interface QuickAssignModalProps {
  subjectName: string;
  subjectColor: string;
  day: string;
  startTime: string;
  endTime: string;
  entityType: "course" | "teacher";
  teachers?: any[];
  courses?: any[];
  onConfirm: (detailId: string, detailName: string) => void;
  onCancel: () => void;
}

const DAYS_MAP: Record<string, string> = {
  MONDAY: "Lunes",
  TUESDAY: "Martes",
  WEDNESDAY: "Miércoles",
  THURSDAY: "Jueves",
  FRIDAY: "Viernes",
};

export function QuickAssignModal({
  subjectName,
  subjectColor,
  day,
  startTime,
  endTime,
  entityType,
  teachers = [],
  courses = [],
  onConfirm,
  onCancel,
}: QuickAssignModalProps) {
  const [selectedId, setSelectedId] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;

    let detailName = "";
    if (entityType === "course") {
      const teacher = teachers.find((t) => t.id === selectedId);
      detailName = teacher ? `${teacher.firstName} ${teacher.lastName}` : "";
    } else {
      const course = courses.find((c) => c.id === selectedId);
      detailName = course?.name || "";
    }

    onConfirm(selectedId, detailName);
  };

  return (
    <div className="quick-assign-modal-overlay" onClick={onCancel}>
      <div className="quick-assign-modal" onClick={(e) => e.stopPropagation()}>
        <div className="quick-assign-modal-header">
          <h3>⚡ Asignar {entityType === "course" ? "Profesor" : "Curso"}</h3>
          <button onClick={onCancel} className="quick-assign-modal-close">
            ×
          </button>
        </div>

        <div className="quick-assign-modal-body">
          <div className="quick-assign-preview">
            <div
              className="quick-assign-preview-badge"
              style={{ backgroundColor: subjectColor }}
            >
              {subjectName}
            </div>
            <div className="quick-assign-preview-info">
              <div>📅 {DAYS_MAP[day]}</div>
              <div>
                🕐 {startTime} - {endTime}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="quick-assign-form-group">
              <label>
                {entityType === "course"
                  ? "👨‍🏫 Selecciona un profesor"
                  : "🎓 Selecciona un curso"}
              </label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                required
                autoFocus
              >
                <option value="">-- Seleccionar --</option>
                {entityType === "course"
                  ? teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.firstName} {teacher.lastName}
                        {teacher.specialization &&
                          ` - ${teacher.specialization}`}
                      </option>
                    ))
                  : courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                        {course.studentCount &&
                          ` (${course.studentCount} estudiantes)`}
                      </option>
                    ))}
              </select>
            </div>

            <div className="quick-assign-modal-footer">
              <button
                type="button"
                onClick={onCancel}
                className="quick-assign-btn secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="quick-assign-btn primary"
                disabled={!selectedId}
              >
                Confirmar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
