/**
 * ➕ AddSubjectButton - Botón para abrir el modal de crear asignatura
 */

"use client";

import { useModal } from "@/contexts/ModalContext";
import { CreateSubjectForm } from "./CreateSubjectForm";

export function AddSubjectButton() {
  const { openModal } = useModal();

  const handleClick = () => {
    openModal(<CreateSubjectForm />, "📚 Crear Nueva Asignatura");
  };

  return (
    <button onClick={handleClick} className="schools-add-btn">
      + Agregar Asignatura
    </button>
  );
}
