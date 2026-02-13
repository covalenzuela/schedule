/**
 * 🏫 Componente SchoolList - Sistema de Horarios
 *
 * Lista de escuelas con búsqueda y filtros
 */

"use client";

import { useState } from "react";
import { School } from "@/types";
import { SchoolCard } from "./SchoolCard";

export interface SchoolListProps {
  schools: School[];
  onEdit?: (school: School) => void;
  onDelete?: (school: School) => void;
  onView?: (school: School) => void;
  onConfigSchedule?: (school: School) => void;
}

export function SchoolList({
  schools,
  onEdit,
  onDelete,
  onView,
  onConfigSchedule,
}: SchoolListProps) {
  const [search, setSearch] = useState("");

  const filteredSchools = schools.filter(
    (school) =>
      school.name.toLowerCase().includes(search.toLowerCase()) ||
      school.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Búsqueda */}
      <div className="schools-search" style={{ position: "relative" }}>
        <label htmlFor="school-search" className="sr-only">
          Buscar colegios
        </label>
        <span className="schools-search-icon" aria-hidden="true">🔍</span>
        <input
          id="school-search"
          type="search"
          className="schools-search-input"
          placeholder="Buscar colegios..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar colegios por nombre o dirección"
        />
      </div>

      {/* Lista de escuelas */}
      {filteredSchools.length === 0 ? (
        <div className="schools-empty">
          <div className="schools-empty-icon">🏫</div>
          <p className="schools-empty-title">
            {search
              ? "No se encontraron colegios"
              : "No hay colegios registrados"}
          </p>
          {!search && (
            <p className="schools-empty-subtitle">
              Comienza agregando tu primer colegio
            </p>
          )}
        </div>
      ) : (
        <div className="schools-grid">
          {filteredSchools.map((school) => (
            <SchoolCard
              key={school.id}
              school={school}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
              onConfigSchedule={onConfigSchedule}
            />
          ))}
        </div>
      )}
    </div>
  );
}
