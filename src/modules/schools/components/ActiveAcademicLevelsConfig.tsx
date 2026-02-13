/**
 * 🎓 Configuración de niveles académicos activos del colegio
 */

"use client";

import { useState, useEffect } from "react";
import {
  getSchoolActiveAcademicLevels,
  updateSchoolActiveAcademicLevels,
} from "@/modules/schools/actions";
import { parseActiveAcademicLevels } from "@/lib/utils/academic-levels";
import type { AcademicLevel } from "@/types/schedule-config";
import "@/app/schedule-editor.css";

interface ActiveAcademicLevelsConfigProps {
  schoolId: string;
  onUpdate?: () => void;
}

const LEVELS = [
  {
    value: "BASIC" as const,
    label: "Educación Básica",
    description: "1° a 8° Básico",
    emoji: "🎒",
  },
  {
    value: "MIDDLE" as const,
    label: "Educación Media",
    description: "1° a 4° Medio",
    emoji: "🎓",
  },
];

export function ActiveAcademicLevelsConfig({
  schoolId,
  onUpdate,
}: ActiveAcademicLevelsConfigProps) {
  const [activeLevels, setActiveLevels] = useState<AcademicLevel[]>([
    "BASIC",
    "MIDDLE",
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadActiveLevels();
  }, [schoolId]);

  const loadActiveLevels = async () => {
    try {
      setLoading(true);
      const levelsString = await getSchoolActiveAcademicLevels(schoolId);
      const levels = parseActiveAcademicLevels(levelsString);
      setActiveLevels(levels);
      setHasChanges(false);
    } catch (error: any) {
      console.error("Error cargando niveles activos:", error);
      alert(error.message || "Error al cargar niveles activos");
    } finally {
      setLoading(false);
    }
  };

  const toggleLevel = (level: AcademicLevel) => {
    setActiveLevels((prev) => {
      const newLevels = prev.includes(level)
        ? prev.filter((l) => l !== level)
        : [...prev, level];

      // Validar que al menos haya uno seleccionado
      if (newLevels.length === 0) {
        alert("Debe haber al menos un nivel académico activo");
        return prev;
      }

      setHasChanges(true);
      return newLevels;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSchoolActiveAcademicLevels(schoolId, activeLevels);
      setHasChanges(false);
      alert("✅ Niveles académicos actualizados correctamente");
      onUpdate?.();
    } catch (error: any) {
      console.error("Error guardando niveles:", error);
      alert(error.message || "Error al guardar niveles activos");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    loadActiveLevels();
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div className="spinner"></div>
        <p style={{ marginTop: "1rem", color: "rgba(255,255,255,0.8)" }}>
          Cargando configuración...
        </p>
      </div>
    );
  }

  return (
    <div className="schedule-config-section">
      <h4 className="schedule-config-section-title">
        🎓 Niveles Académicos del Colegio
      </h4>

      <p
        style={{
          fontSize: "0.9375rem",
          color: "rgba(255, 255, 255, 0.85)",
          marginBottom: "1.5rem",
        }}
      >
        Selecciona los niveles académicos que ofrece tu colegio. Esto
        determinará qué opciones estarán disponibles al crear cursos y
        configurar horarios.
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {LEVELS.map((level) => {
          const isActive = activeLevels.includes(level.value);

          return (
            <label
              key={level.value}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1rem",
                background: isActive
                  ? "rgba(59, 130, 246, 0.15)"
                  : "rgba(255, 255, 255, 0.05)",
                border: isActive
                  ? "2px solid rgb(59, 130, 246)"
                  : "2px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "0.5rem",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background =
                    "rgba(255, 255, 255, 0.08)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background =
                    "rgba(255, 255, 255, 0.05)";
                }
              }}
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={() => toggleLevel(level.value)}
                style={{
                  width: "1.25rem",
                  height: "1.25rem",
                  cursor: "pointer",
                }}
              />

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "white",
                    marginBottom: "0.25rem",
                  }}
                >
                  <span>{level.emoji}</span>
                  <span>{level.label}</span>
                </div>
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: "rgba(255, 255, 255, 0.75)",
                  }}
                >
                  {level.description}
                </div>
              </div>

              {isActive && (
                <div
                  style={{
                    padding: "0.25rem 0.75rem",
                    background: "rgb(59, 130, 246)",
                    borderRadius: "9999px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "white",
                  }}
                >
                  Activo
                </div>
              )}
            </label>
          );
        })}
      </div>

      {hasChanges && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            background: "rgba(251, 191, 36, 0.1)",
            border: "1px solid rgb(251, 191, 36)",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            color: "rgb(251, 191, 36)",
          }}
        >
          ⚠️ Tienes cambios sin guardar
        </div>
      )}

      {hasChanges && (
        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginTop: "1.5rem",
          }}
        >
          <button
            onClick={handleCancel}
            disabled={saving}
            style={{
              flex: 1,
              padding: "0.75rem",
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "0.5rem",
              color: "white",
              fontSize: "0.9375rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              padding: "0.75rem",
              background: "rgb(59, 130, 246)",
              border: "none",
              borderRadius: "0.5rem",
              color: "white",
              fontSize: "0.9375rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      )}
    </div>
  );
}
