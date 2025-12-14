/**
 * ➕ AddCourseButton - Botón para abrir el modal de crear curso
 */

"use client";

import { useModal } from "@/contexts/ModalContext";
import { CreateCourseForm } from "./CreateCourseForm";

interface AddCourseButtonProps {
  onCourseCreated?: () => void;
}

export function AddCourseButton({ onCourseCreated }: AddCourseButtonProps) {
  const { openModal } = useModal();

  const handleClick = () => {
    openModal(
      <CreateCourseForm onSuccess={onCourseCreated} />,
      "🎓 Crear Nuevo Curso"
    );
  };

  return (
    <button onClick={handleClick} className="schools-add-btn">
      + Agregar Curso
    </button>
  );
}
