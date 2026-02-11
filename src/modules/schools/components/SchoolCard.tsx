/**
 * 🏫 Componente SchoolCard - Sistema de Horarios
 *
 * Tarjeta para mostrar información de una escuela
 */

"use client";

import { School } from "@/types";

export interface SchoolCardProps {
  school: School;
  onEdit?: (school: School) => void;
  onDelete?: (school: School) => void;
  onView?: (school: School) => void;
  onConfigSchedule?: (school: School) => void;
}

export function SchoolCard({
  school,
  onEdit,
  onDelete,
  onView,
  onConfigSchedule,
}: SchoolCardProps) {
  return (
    <div className="schools-card">
      <div className="schools-card-header">
        <div>
          <h3 className="schools-card-title">{school.name}</h3>
        </div>
        <span className="schools-card-badge">Activo</span>
      </div>

      <div className="schools-card-info">
        <div className="schools-card-info-item">
          <span className="schools-card-info-icon">📍</span>
          <span>{school.address}</span>
        </div>
        {school.phone && (
          <div className="schools-card-info-item">
            <span className="schools-card-info-icon">📞</span>
            <span>{school.phone}</span>
          </div>
        )}
        {school.email && (
          <div className="schools-card-info-item">
            <span className="schools-card-info-icon">✉️</span>
            <span>{school.email}</span>
          </div>
        )}
      </div>

      <div className="schools-card-footer">
        {onConfigSchedule && (
          <button
            className="schools-card-btn schools-card-btn-primary"
            onClick={() => onConfigSchedule(school)}
            title="Configurar horario de jornada"
          >
            ⚙️ Jornada
          </button>
        )}
        {onView && (
          <button
            className="schools-card-btn schools-card-btn-ghost"
            onClick={() => onView(school)}
          >
            Ver Detalles
          </button>
        )}
        {onEdit && (
          <button
            className="schools-card-btn schools-card-btn-ghost"
            onClick={() => onEdit(school)}
          >
            Editar
          </button>
        )}
        {onDelete && (
          <button
            className="schools-card-btn schools-card-btn-danger"
            onClick={() => onDelete(school)}
          >
            Eliminar
          </button>
        )}
      </div>
    </div>
  );
}
