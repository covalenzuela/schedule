/**
 * 🎨 SubjectPalette - Paleta lateral de asignaturas con drag and drop
 */

"use client";

interface Subject {
  id: string;
  name: string;
  code: string;
  color: string | null;
  teacherSubjects: any[];
}

interface SubjectPaletteProps {
  subjects: Subject[];
  onDragStart: (subject: Subject) => void;
}

export function SubjectPalette({ subjects, onDragStart }: SubjectPaletteProps) {
  return (
    <div className="subject-palette">
      <div className="subject-palette-header">
        <h3 className="subject-palette-title">📚 Asignaturas Disponibles</h3>
        <p className="subject-palette-subtitle">
          Arrastra una asignatura al horario
        </p>
      </div>

      <div className="subject-palette-list">
        {subjects.length === 0 ? (
          <div className="subject-palette-empty">
            <p>No hay asignaturas disponibles</p>
            <span style={{ fontSize: "0.875rem", opacity: 0.7 }}>
              Crea asignaturas primero
            </span>
          </div>
        ) : (
          subjects.map((subject) => {
            const hasTeachers = subject.teacherSubjects?.length > 0;

            return (
              <div
                key={subject.id}
                className={`subject-palette-item ${
                  !hasTeachers ? "no-teacher" : ""
                }`}
                draggable
                onDragStart={() => onDragStart(subject)}
                style={
                  {
                    "--subject-color": subject.color || "#3B82F6",
                  } as React.CSSProperties
                }
              >
                <div className="subject-palette-item-header">
                  <span className="subject-palette-code">{subject.code}</span>
                  {!hasTeachers && (
                    <span
                      className="subject-palette-warning"
                      title="Sin profesor asignado"
                    >
                      ⚠️
                    </span>
                  )}
                </div>
                <div className="subject-palette-item-name">{subject.name}</div>
                {!hasTeachers && (
                  <div className="subject-palette-item-status">
                    Sin profesor asignado
                  </div>
                )}
                {hasTeachers && (
                  <div className="subject-palette-item-teachers">
                    {subject.teacherSubjects.length} profesor
                    {subject.teacherSubjects.length !== 1 ? "es" : ""}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="subject-palette-hint">
        💡 <strong>Tip:</strong> Arrastra y suelta asignaturas en el horario. Si
        no tiene profesor asignado, podrás seleccionarlo después.
      </div>
    </div>
  );
}
