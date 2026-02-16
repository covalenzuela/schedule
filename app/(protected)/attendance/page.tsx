"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCourses } from "@/modules/courses/actions";
import { getSchools } from "@/modules/schools/actions";
import { createStudent } from "@/modules/students/actions";
import { AttendanceGrid } from "@/modules/attendance/components/AttendanceGrid";
import { ImportStudentsModal } from "@/modules/students/components/ImportStudentsModal";
import { ImportAttendanceModal } from "@/modules/attendance/components/ImportAttendanceModal";
import { CreateStudentForm } from "@/modules/students/components/CreateStudentForm";
import { SpecialDaysManager } from "@/modules/special-days/components/SpecialDaysManager";
import { useModal } from "@/contexts/ModalContext";
import "../../teachers.css";

interface Course {
  id: string;
  name: string;
  academicYear: number;
  schoolId: string;
}

interface School {
  id: string;
  name: string;
}

export default function AttendancePage() {
  const { openModal } = useModal();
  const [courses, setCourses] = useState<Course[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>("all");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showImportAttendanceModal, setShowImportAttendanceModal] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const [coursesData, schoolsData] = await Promise.all([
        getCourses(),
        getSchools(),
      ]);
      setCourses(coursesData);
      setSchools(schoolsData);
      if (coursesData.length > 0) {
        setSelectedCourse(coursesData[0]);
      }
    } catch (error) {
      console.error("Error loading courses:", error);
      alert("Error al cargar los cursos");
    } finally {
      setLoading(false);
    }
  };

  const handleImportStudents = async (students: Array<{
    firstName: string;
    lastName: string;
    email?: string;
    enrollmentDate: string;
  }>) => {
    if (!selectedCourse) return;

    try {
      for (const student of students) {
        await createStudent({
          schoolId: selectedCourse.schoolId,
          courseId: selectedCourse.id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          enrollmentDate: new Date(student.enrollmentDate),
        });
      }
      setShowImportModal(false);
      alert(`✓ ${students.length} alumnos importados exitosamente`);
      // Recargar la grilla de asistencia
      window.location.reload();
    } catch (error) {
      console.error("Error importing students:", error);
      alert("Error al importar algunos alumnos");
    }
  };

  const handleStudentCreated = () => {
    // Recargar la grilla de asistencia
    window.location.reload();
  };

  const handleOpenAddStudent = () => {
    if (!selectedCourse) return;
    openModal(
      <CreateStudentForm 
        courseId={selectedCourse.id}
        schoolId={selectedCourse.schoolId}
        onStudentCreated={handleStudentCreated}
      />, 
      '👨‍🎓 Agregar Alumno'
    );
  };

  const goToPreviousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setMonth(today.getMonth() + 1);
    setYear(today.getFullYear());
  };

  // Filtrar cursos por colegio seleccionado
  const filteredCourses = selectedSchool === "all" 
    ? courses 
    : courses.filter(c => c.schoolId === selectedSchool);

  const months = [
    { value: 1, label: "Enero" },
    { value: 2, label: "Febrero" },
    { value: 3, label: "Marzo" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Mayo" },
    { value: 6, label: "Junio" },
    { value: 7, label: "Julio" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Septiembre" },
    { value: 10, label: "Octubre" },
    { value: 11, label: "Noviembre" },
    { value: 12, label: "Diciembre" },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  if (loading) {
    return (
      <div className="schools-page">
        <div className="schools-bg">
          <div className="schools-gradient" />
        </div>
        <div className="schools-container">
          <div className="schools-empty">
            <div className="schools-empty-icon">⏳</div>
            <p className="schools-empty-title">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="schools-page">
        <div className="schools-bg">
          <div className="schools-gradient" />
        </div>
        <div className="schools-container">
          <div className="schools-empty">
            <div className="schools-empty-icon">📋</div>
            <p className="schools-empty-title">No hay cursos disponibles</p>
            <p className="schools-empty-subtitle">
              Primero debes crear cursos para poder registrar asistencia.
            </p>
            <Link href="/courses" className="schools-add-btn" style={{ marginTop: "2rem" }}>
              ➕ Ir a Cursos
            </Link>
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
        <div className="schools-header">
          <div className="schools-header-top">
            <h1 className="schools-title">📋 Asistencia</h1>
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
                onClick={() => setShowImportModal(true)}
                title="Importar alumnos desde Excel"
              >
                📥 Importar Alumnos
              </button>
              <button
                className="schools-add-btn"
                style={{
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                }}
                onClick={() => setShowImportAttendanceModal(true)}
                title="Importar asistencia desde Excel"
              >
                📊 Importar Asistencia
              </button>
              <button
                className="schools-add-btn"
                onClick={handleOpenAddStudent}
              >
                ➕ Agregar Alumno
              </button>
            </div>
          </div>
        </div>

        {showImportModal && selectedCourse && (
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
              <ImportStudentsModal
                courseId={selectedCourse.id}
                onImport={handleImportStudents}
                onCancel={() => setShowImportModal(false)}
              />
            </div>
          </div>
        )}

        {showImportAttendanceModal && selectedCourse && (
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
              <ImportAttendanceModal
                courseId={selectedCourse.id}
                month={month}
                year={year}
                onImport={() => {
                  setShowImportAttendanceModal(false);
                  window.location.reload();
                }}
                onCancel={() => setShowImportAttendanceModal(false)}
              />
            </div>
          </div>
        )}

        {/* Controles de período - Siempre visibles */}
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center",
          gap: "1rem",
          marginTop: "1.5rem",
          marginBottom: "1rem",
          padding: "1rem",
          background: "rgba(255, 255, 255, 0.03)",
          borderRadius: "0.75rem",
          border: "1px solid rgba(255, 255, 255, 0.1)"
        }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="calendar-nav-btn"
              title="Mes anterior"
              style={{
                padding: "0.5rem 1rem",
                background: "rgba(99, 102, 241, 0.1)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                borderRadius: "0.5rem",
                color: "#a5b4fc",
                cursor: "pointer",
                fontSize: "1.2rem",
                fontWeight: "bold",
                transition: "all 0.2s"
              }}
            >
              ←
            </button>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              style={{
                padding: "0.5rem 1rem",
                background: "rgba(17, 24, 39, 0.95)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                borderRadius: "0.5rem",
                color: "#e0e7ff",
                fontSize: "0.95rem",
                fontWeight: "600",
                cursor: "pointer",
                minWidth: "130px"
              }}
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              style={{
                padding: "0.5rem 1rem",
                background: "rgba(17, 24, 39, 0.95)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                borderRadius: "0.5rem",
                color: "#e0e7ff",
                fontSize: "0.95rem",
                fontWeight: "600",
                cursor: "pointer",
                minWidth: "90px"
              }}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={goToNextMonth}
              className="calendar-nav-btn"
              title="Mes siguiente"
              style={{
                padding: "0.5rem 1rem",
                background: "rgba(99, 102, 241, 0.1)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                borderRadius: "0.5rem",
                color: "#a5b4fc",
                cursor: "pointer",
                fontSize: "1.2rem",
                fontWeight: "bold",
                transition: "all 0.2s"
              }}
            >
              →
            </button>
            <button
              type="button"
              onClick={goToToday}
              style={{
                padding: "0.5rem 1.5rem",
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                border: "none",
                borderRadius: "0.5rem",
                color: "white",
                cursor: "pointer",
                fontSize: "0.95rem",
                fontWeight: "600",
                marginLeft: "0.5rem",
                transition: "all 0.2s"
              }}
              title="Ir a hoy"
            >
              📅 Hoy
            </button>
            <button
              type="button"
              onClick={() => {
                if (!selectedCourse) {
                  alert("Seleccione un curso para gestionar feriados");
                  return;
                }
                openModal(
                  <SpecialDaysManager schoolId={selectedCourse.schoolId} />,
                  '🗓️ Gestionar Feriados',
                  { maxWidth: '1200px' }
                );
              }}
              style={{
                padding: "0.5rem 1rem",
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                border: "none",
                borderRadius: "0.5rem",
                color: "white",
                cursor: "pointer",
                fontSize: "0.95rem",
                fontWeight: "600",
                marginLeft: "0.5rem",
                transition: "all 0.2s",
                whiteSpace: "nowrap"
              }}
              title="Gestionar feriados y días especiales"
            >
              🗓️ Feriados
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="schools-filters">
            <div className="schools-filter-group">
              <label className="schools-filter-label">
                Colegio
              </label>
              <select
                className="schools-filter-select"
                value={selectedSchool}
                onChange={(e) => {
                  setSelectedSchool(e.target.value);
                  // Resetear curso al cambiar colegio
                  const filtered = e.target.value === "all" 
                    ? courses 
                    : courses.filter(c => c.schoolId === e.target.value);
                  if (filtered.length > 0) {
                    setSelectedCourse(filtered[0]);
                  }
                }}
              >
                <option value="all">
                  Todos los colegios ({courses.length} cursos)
                </option>
                {schools.map((school) => {
                  const count = courses.filter(c => c.schoolId === school.id).length;
                  return (
                    <option key={school.id} value={school.id}>
                      {school.name} ({count} cursos)
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="schools-filter-group">
              <label className="schools-filter-label">
                Curso
              </label>
              <select
                className="schools-filter-select"
                id="course-select"
                value={selectedCourse?.id || ""}
                onChange={(e) => {
                  const course = filteredCourses.find((c) => c.id === e.target.value);
                  setSelectedCourse(course || null);
                }}
              >
                {filteredCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {selectedCourse && (
          <div style={{ marginTop: "2rem" }}>
            <AttendanceGrid
              key={`${selectedCourse.id}-${month}-${year}`}
              courseId={selectedCourse.id}
              courseName={selectedCourse.name}
              schoolId={selectedCourse.schoolId}
              month={month}
              year={year}
            />
          </div>
        )}
      </div>
    </div>
  );
}
