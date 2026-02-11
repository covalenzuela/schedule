/**
 * ➕ AddSchoolButton - Botón para abrir el modal de crear colegio
 */

"use client";

import { useModal } from "@/contexts/ModalContext";
import { CreateSchoolForm } from "./CreateSchoolForm";

interface AddSchoolButtonProps {
  onSchoolCreated?: () => void;
}

export function AddSchoolButton({ onSchoolCreated }: AddSchoolButtonProps) {
  const { openModal } = useModal();

  const handleClick = () => {
    openModal(
      <CreateSchoolForm onSchoolCreated={onSchoolCreated} />,
      "🏫 Crear Nuevo Colegio"
    );
  };

  return (
    <button onClick={handleClick} className="schools-add-btn">
      + Agregar Colegio
    </button>
  );
}
