/**
 * ➕ AddStudentButton - Botón para abrir el modal de crear alumno
 */

'use client';

import { useModal } from '@/contexts/ModalContext';
import { CreateStudentForm } from './CreateStudentForm';

interface AddStudentButtonProps {
  courseId?: string;
  onStudentCreated?: () => void;
}

export function AddStudentButton({ courseId, onStudentCreated }: AddStudentButtonProps) {
  const { openModal } = useModal();

  const handleClick = () => {
    openModal(<CreateStudentForm courseId={courseId} onStudentCreated={onStudentCreated} />, '👨‍🎓 Agregar Alumno');
  };

  return (
    <button onClick={handleClick} className="schools-add-btn">
      + Agregar Alumno
    </button>
  );
}
