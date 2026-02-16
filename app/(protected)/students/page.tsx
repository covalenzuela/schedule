"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSchools } from "@/modules/schools/actions";
import { CreateStudentForm } from "@/modules/students/components/CreateStudentForm";
import { ImportStudentsModal } from "@/modules/students/components/ImportStudentsModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Card, Badge, Button } from "@/components/ui";
import { useModal } from "@/contexts/ModalContext";
import type { School } from "@/types";
import "../../teachers.css";

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  rut: string | null;
  email: string | null;
  phone: string | null;
  enrollmentDate: Date;
  isActive: boolean;
  course: {
    id: string;
    name: string;
    schoolId: string;
    school: {
      id: string;
      name: string;
    };
  };
};

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>("all");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCourseId, setImportCourseId] = useState<string>("");
  const [importSchoolId, setImportSchoolId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const { openModal, closeModal } = useModal();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [studentsData, schoolsData] = await Promise.all([
      fetch("/api/students").then(res => res.json()),
      getSchools(),
    ]);
    setStudents(studentsData);
    setSchools(schoolsData);
    setIsLoading(false);
  };

  const handleDeleteStudent = (student: Student) => {
    openModal(
      <ConfirmDialog
        title="¿Eliminar alumno?"
        message={`¿Estás seguro de que quieres eliminar a ${student.firstName} ${student.lastName}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={async () => {
          try {
            await fetch(`/api/students/${student.id}`, { method: 'DELETE' });
            setStudents(students.filter((s) => s.id !== student.id));
            closeModal();
          } catch (error) {
            console.error("Error al eliminar alumno:", error);
            alert("Error al eliminar el alumno");
          }
        }}
        onCancel={closeModal}
      />,
      "⚠️ Confirmar eliminación"
    );
  };

  const handleOpenImportModal = () => {
    if (schools.length === 1) {
      setImportSchoolId(schools[0].id);
    }
    setShowImportModal(true);
  };

  const handleOpenAddStudent = () => {
    openModal(
      <CreateStudentForm 
        onStudentCreated={() => {
          closeModal();
          loadData();
        }}
      />, 
      '👨‍🎓 Agregar Alumno'
    );
  };

  const filteredStudents = students.filter((student) => {
    if (selectedSchool !== "all" && student.course.schoolId !== selectedSchool) {
      return false;
    }
    if (selectedCourse !== "all" && student.course.id !== selectedCourse) {
      return false;
    }
    return true;
  });

  const availableCourses: any[] = selectedSchool === "all" 
    ? schools.flatMap((s: any) => s.courses || [])
    : (schools.find(s => s.id === selectedSchool) as any)?.courses || [];

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando alumnos...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">👨‍🎓 Alumnos</h1>
          <Badge variant="secondary">{filteredStudents.length} alumnos</Badge>
        </div>
        <div className="page-actions">
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? "🔽 Ocultar Filtros" : "🔼 Mostrar Filtros"}
          </Button>
          <Button variant="secondary" onClick={handleOpenImportModal}>
            📥 Importar Excel
          </Button>
          <Button variant="primary" onClick={handleOpenAddStudent}>
            ➕ Agregar Alumno
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="schools-filters">
          <div className="schools-filter-group">
            <label htmlFor="school-filter" className="schools-filter-label">
              🏫 Colegio:
            </label>
            <select
              id="school-filter"
              className="schools-filter-select"
              value={selectedSchool}
              onChange={(e) => {
                setSelectedSchool(e.target.value);
                setSelectedCourse("all");
              }}
            >
              <option value="all">
                Todos los colegios ({schools.length})
              </option>
              {schools.map((school: any) => (
                <option key={school.id} value={school.id}>
                  {school.name} ({school.courses?.length || 0} cursos)
                </option>
              ))}
            </select>
          </div>

          <div className="schools-filter-group">
            <label htmlFor="course-filter" className="schools-filter-label">
              📚 Curso:
            </label>
            <select
              id="course-filter"
              className="schools-filter-select"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              disabled={!selectedSchool || selectedSchool === "all"}
            >
              <option value="all">
                Todos los cursos
              </option>
              {availableCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="cards-grid">
        {filteredStudents.map((student) => (
          <Card key={student.id} className="teacher-card">
            <div className="teacher-card-header">
              <div className="teacher-info">
                <h3 className="teacher-name">
                  {student.firstName} {student.lastName}
                </h3>
                <div className="teacher-meta">
                  <span className="teacher-school">
                    🏫 {student.course.school.name}
                  </span>
                  <span className="teacher-email">
                    📚 {student.course.name}
                  </span>
                </div>
                {student.rut && (
                  <div className="teacher-meta">
                    <span className="teacher-email">
                      🆔 {student.rut}
                    </span>
                  </div>
                )}
                {student.email && (
                  <div className="teacher-meta">
                    <span className="teacher-email">
                      ✉️ {student.email}
                    </span>
                  </div>
                )}
                {student.phone && (
                  <div className="teacher-meta">
                    <span className="teacher-email">
                      📞 {student.phone}
                    </span>
                  </div>
                )}
              </div>
              <div className="teacher-actions">
                <Badge variant={student.isActive ? "success" : "danger"}>
                  {student.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>

            <div className="teacher-card-footer">
              <span className="teacher-date">
                📅 Inscrito: {new Date(student.enrollmentDate).toLocaleDateString('es-CL')}
              </span>
              <div className="card-actions">
                <button
                  className="btn-icon"
                  onClick={() => router.push(`/students/${student.id}`)}
                  title="Ver detalles"
                >
                  👁️
                </button>
                <button
                  className="btn-icon btn-danger"
                  onClick={() => handleDeleteStudent(student)}
                  title="Eliminar alumno"
                >
                  🗑️
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="empty-state">
          <p>No hay alumnos para mostrar.</p>
          <Button variant="primary" onClick={handleOpenAddStudent}>
            ➕ Agregar primer alumno
          </Button>
        </div>
      )}

      {showImportModal && (
        <ImportStudentsModal
          courseId={importCourseId || ""}
          onImport={async (data) => {
            setShowImportModal(false);
            await loadData();
          }}
          onCancel={() => setShowImportModal(false)}
        />
      )}
    </div>
  );
}
