/**
 * 🎓 CreateCourseForm - Formulario para crear un nuevo curso
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/contexts/ModalContext";
import { createCourse } from "@/modules/courses/actions";
import { getSchools } from "@/modules/schools/actions";
import { Input, Select } from "@/components/ui";
import type { School } from "@/types";
import "./CourseForms.css";

const ACADEMIC_LEVELS = [
  { value: "PRIMARIA", label: "Primaria" },
  { value: "SECUNDARIA", label: "Secundaria" },
  { value: "MEDIA", label: "Media" },
];

interface CreateCourseFormProps {
  onSuccess?: () => void;
}

export function CreateCourseForm({ onSuccess }: CreateCourseFormProps) {
  const router = useRouter();
  const { closeModal } = useModal();
  const [isLoading, setIsLoading] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    schoolId: "",
  });

  useEffect(() => {
    const loadSchools = async () => {
      const data = await getSchools();
      setSchools(data);

      // Si solo hay un colegio, auto-seleccionarlo
      if (data.length === 1) {
        setFormData({ schoolId: data[0].id });
      }
    };
    loadSchools();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const studentCount = formData.get("studentCount");

    const data = {
      schoolId: formData.get("schoolId") as string,
      name: formData.get("name") as string,
      grade: formData.get("grade") as string,
      section: formData.get("section") as string,
      academicLevel: formData.get("academicLevel") as string,
      academicYear: parseInt(formData.get("academicYear") as string),
      studentCount: studentCount ? parseInt(studentCount as string) : undefined,
    };

    try {
      await createCourse(data);
      closeModal();
      onSuccess?.(); // Llamar al callback para recargar los datos
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el curso");
    } finally {
      setIsLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <form onSubmit={handleSubmit} className="course-form">
      {error && <div className="form-error">{error}</div>}

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
          onChange={(e) => setFormData({ schoolId: e.target.value })}
          placeholder="Selecciona un colegio"
          options={schools.map((school) => ({
            value: school.id,
            label: school.name,
          }))}
        />
      </div>

      <div className="form-group">
        <label htmlFor="name" className="form-label">
          Nombre del Curso <span className="required">*</span>
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Ej: 5° Básico A"
          required
          disabled={isLoading}
        />
      </div>

      <div className="form-row-3">
        <div className="form-group">
          <label htmlFor="grade" className="form-label">
            Grado <span className="required">*</span>
          </label>
          <Input
            id="grade"
            name="grade"
            type="text"
            placeholder="Ej: 5°"
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="section" className="form-label">
            Sección <span className="required">*</span>
          </label>
          <Input
            id="section"
            name="section"
            type="text"
            placeholder="Ej: A"
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="academicLevel" className="form-label">
            Nivel <span className="required">*</span>
          </label>
          <Select
            id="academicLevel"
            name="academicLevel"
            required
            disabled={isLoading}
            options={ACADEMIC_LEVELS}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="academicYear" className="form-label">
            Año Académico <span className="required">*</span>
          </label>
          <Input
            id="academicYear"
            name="academicYear"
            type="number"
            defaultValue={currentYear}
            min={currentYear - 1}
            max={currentYear + 1}
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="studentCount" className="form-label">
            Cantidad de Estudiantes
          </label>
          <Input
            id="studentCount"
            name="studentCount"
            type="number"
            placeholder="Ej: 30"
            min={1}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="auth-button auth-button-outline"
          onClick={closeModal}
          disabled={isLoading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="auth-button auth-button-primary"
          disabled={isLoading}
        >
          {isLoading ? "Creando..." : "Crear Curso"}
        </button>
      </div>
    </form>
  );
}
