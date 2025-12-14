/**
 * 🎭 Modal Component - Componente base reutilizable para modales
 *
 * Características:
 * - Overlay con click para cerrar
 * - Animaciones suaves de entrada/salida
 * - Botón de cierre (X)
 * - Título opcional
 * - Contenido dinámico
 * - Responsive
 */

"use client";

import { useEffect } from "react";
import { useModal } from "@/contexts/ModalContext";
import "./Modal.css";

export function Modal() {
  const { isOpen, content, title, closeModal } = useModal();

  // Cerrar modal con tecla ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeModal();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeModal]);

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          {title && <h2 className="modal-title">{title}</h2>}
          <button
            onClick={closeModal}
            className="modal-close-btn"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-content">{content}</div>
      </div>
    </div>
  );
}
