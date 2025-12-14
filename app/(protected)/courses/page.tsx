"use client";

import { useState, useEffect } from "react";
import { getCourses, deleteCourse } from "@/modules/courses/actions";
import { getSchools } from "@/modules/schools/actions";
import { AddCourseButton } from "@/modules/courses/components/AddCourseButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useModal } from "@/contexts/ModalContext";
import type { School } from "@/types";
import "../../courses.css";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui";

type CourseWithRelations = {
  id: string;
  name: string;
  academicLevel: string;
  academicYear: number;
  studentCount: number | null;
  schoolId: string;
  school: {
    name: string;
  };
  schedules: any[];
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseWithRelations[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const { openModal, closeModal } = useModal();

  useEffect(() => {
    const loadData = async () => {
      const [coursesData, schoolsData] = await Promise.all([
        getCourses(),
        getSchools(),
      ]);
      setCourses(coursesData as any);
      setSchools(schoolsData);
    };
    loadData();
  }, []);

  const reloadCourses = async () => {
    const coursesData = await getCourses();
    setCourses(coursesData as any);
  };

  const handleDeleteCourse = (course: CourseWithRelations) => {
    openModal(
      <ConfirmDialog
        title="¿Eliminar curso?"
        message={`¿Estás seguro de que quieres eliminar ${course.name}? Los horarios asociados también se eliminarán. Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={async () => {
          try {
            await deleteCourse(course.id);
            setCourses(courses.filter((c) => c.id !== course.id));
            closeModal();
          } catch (error) {
            console.error("Error al eliminar curso:", error);
            alert("Error al eliminar el curso");
          }
        }}
        onCancel={closeModal}
      />,
      "⚠️ Confirmar eliminación"
    );
  };

  const filteredCourses =
    selectedSchool === "all"
      ? courses
      : courses.filter((course) => course.schoolId === selectedSchool);

  const getSchoolName = (schoolId: string) => {
    return schools.find((s) => s.id === schoolId)?.name || "";
  };

  return (
    <div className="schools-page">
      <div className="schools-bg">
        <div className="schools-gradient" />
      </div>

      <div className="schools-container">
        <header className="schools-header">
          <div className="schools-header-top">
            <h1 className="schools-title">
              🎓 Cursos
              {selectedSchool !== "all" && (
                <span
                  style={{
                    fontSize: "0.6em",
                    fontWeight: 400,
                    color: "rgba(255, 255, 255, 0.7)",
                    marginLeft: "0.5rem",
                  }}
                >
                  - {getSchoolName(selectedSchool)}
                </span>
              )}
            </h1>
            <div
              style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}
            >
              <button
                className="schools-filter-btn"
                onClick={() => setShowFilters(!showFilters)}
              >
                🔍 {showFilters ? "Ocultar" : "Filtros"}
              </button>
              <AddCourseButton onCourseCreated={reloadCourses} />
            </div>
          </div>
          <p className="schools-description">
            Administra los cursos, secciones y niveles académicos de la
            institución.
            {selectedSchool !== "all" &&
              ` Mostrando ${filteredCourses.length} curso${
                filteredCourses.length !== 1 ? "s" : ""
              }.`}
          </p>

          {/* Filtros */}
          {showFilters && (
            <div className="schools-filters">
              <div className="schools-filter-group">
                <label className="schools-filter-label">Colegio</label>
                <select
                  className="schools-filter-select"
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                >
                  <option value="all">Todos los colegios</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </header>

        {filteredCourses.length === 0 ? (
          <div className="schools-empty">
            <div className="schools-empty-icon">🎓</div>
            <p className="schools-empty-title">
              {selectedSchool === "all"
                ? "No hay cursos registrados"
                : "No hay cursos en este colegio"}
            </p>
            <p className="schools-empty-subtitle">
              {selectedSchool === "all"
                ? "Comienza agregando tu primer curso"
                : "Selecciona otro colegio o agrega un curso nuevo"}
            </p>
          </div>
        ) : (
          <div className="schools-grid">
            {filteredCourses.map((course) => (
              <div key={course.id} className="schools-card">
                <div className="schools-card-header">
                  <div>
                    <h3 className="schools-card-title">{course.name}</h3>
                    {selectedSchool === "all" && (
                      <span className="schools-card-school-badge">
                        {course.school.name}
                      </span>
                    )}
                  </div>
                  <span className="schools-card-badge">
                    {course.academicLevel}
                  </span>
                </div>

                <div className="schools-card-info">
                  <div className="schools-card-info-item">
                    <span className="schools-card-info-icon">🏫</span>
                    <span>{course.school.name}</span>
                  </div>
                  <button
                    className="schools-card-btn schools-card-btn-danger"
                    onClick={() => handleDeleteCourse(course)}
                  >
                    Eliminar
                  </button>
                  {course.studentCount && (
                    <div className="schools-card-info-item">
                      <span className="schools-card-info-icon">👥</span>
                      <span>{course.studentCount} estudiantes</span>
                    </div>
                  )}
                  <div className="schools-card-info-item">
                    <span className="schools-card-info-icon">📅</span>
                    <span>Año {course.academicYear}</span>
                  </div>
                  {course.schedules.length > 0 && (
                    <div className="schools-card-info-item">
                      <span className="schools-card-info-icon">🗓️</span>
                      <span>
                        {course.schedules.length} horario
                        {course.schedules.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>

                <div className="schools-card-footer">
                  <button className="schools-card-btn schools-card-btn-primary">
                    {course.schedules.length > 0
                      ? "Ver Horario"
                      : "Crear Horario"}
                  </button>
                  <button className="schools-card-btn schools-card-btn-ghost">
                    Editar
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

interface CourseCardProps {
  name: string;
  level: string;
  students: number;
  hasSchedule: boolean;
}

function CourseCard({ name, level, students, hasSchedule }: CourseCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent>
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-neutral-900">{name}</h3>
          <Badge variant={hasSchedule ? "success" : "warning"}>
            {hasSchedule ? "Con horario" : "Sin horario"}
          </Badge>
        </div>

        <div className="space-y-2 text-sm text-neutral-600 mb-4">
          <p className="flex items-center gap-2">
            <span>📚</span>
            <span>Nivel: {level}</span>
          </p>
          <p className="flex items-center gap-2">
            <span>👥</span>
            <span>{students} estudiantes</span>
          </p>
          <p className="flex items-center gap-2">
            <span>📅</span>
            <span>Año académico: 2025</span>
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
            Editar
          </Button>
          <Button variant="primary" size="sm" className="flex-1">
            {hasSchedule ? "Ver Horario" : "Crear Horario"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
