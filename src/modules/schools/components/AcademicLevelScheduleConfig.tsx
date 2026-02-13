/**
 * 🎓 Configuración de jornadas por nivel académico (Básica y Media)
 */

"use client";

import { useState, useEffect } from "react";
import {
  getScheduleConfigForLevel,
  saveScheduleConfigForLevel,
} from "@/modules/schools/actions/schedule-config";
import {
  getSchoolActiveAcademicLevels,
} from "@/modules/schools/actions";
import type {
  AcademicLevel,
  BreakConfig,
  ScheduleLevelConfig,
} from "@/types/schedule-config";
import { parseActiveAcademicLevels } from "@/lib/utils/academic-levels";
import { ActiveAcademicLevelsConfig } from "./ActiveAcademicLevelsConfig";
import "@/app/schedule-editor.css";

interface AcademicLevelScheduleConfigProps {
  schoolId: string;
  schoolName: string;
  onClose: () => void;
}

const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const totalMinutes = 6 * 60 + i * 15; // Empieza a las 6:00 AM
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
});

const ACADEMIC_LEVELS: { key: AcademicLevel; label: string; emoji: string }[] =
  [
    { key: "BASIC", label: "Educación Básica (1° - 8°)", emoji: "🎒" },
    { key: "MIDDLE", label: "Educación Media (1° - 4°)", emoji: "🎓" },
  ];

type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY";


// Helper para calcular bloques disponibles
function calculateAvailableBlocks(
  startTime: string,
  endTime: string,
  blockDuration: number
): number {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  const totalMinutes = endHour * 60 + endMin - (startHour * 60 + startMin);
  return Math.floor(totalMinutes / blockDuration);
}

export function AcademicLevelScheduleConfig({
  schoolId,
  schoolName,
  onClose,
}: AcademicLevelScheduleConfigProps) {
  const [activeTab, setActiveTab] = useState<"config" | AcademicLevel>("config");
  const [activeLevel, setActiveLevel] = useState<AcademicLevel>("BASIC");
  const [availableLevels, setAvailableLevels] = useState<AcademicLevel[]>([
    "BASIC",
    "MIDDLE",
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [config, setConfig] = useState<
    Omit<ScheduleLevelConfig, "id" | "schoolId" | "academicLevel">
  >({
    startTime: "08:00",
    endTime: "17:00",
    blockDuration: 45,
    breaks: [],
  });

  // Tracking de configuración original para detectar cambios críticos
  const [originalConfig, setOriginalConfig] = useState<typeof config | null>(
    null
  );

  // (Legacy state variables removed - no longer needed)

  useEffect(() => {
    loadAvailableLevels();
  }, [schoolId]);

  useEffect(() => {
    if (availableLevels.length > 0) {
      loadConfig();
    }
  }, [schoolId, activeLevel, availableLevels]);

  const loadAvailableLevels = async () => {
    try {
      const levelsString = await getSchoolActiveAcademicLevels(schoolId);
      const levels = parseActiveAcademicLevels(levelsString);
      setAvailableLevels(levels);
      
      // Si el nivel activo no está en los disponibles, cambiar al primero disponible
      if (!levels.includes(activeLevel) && levels.length > 0) {
        setActiveLevel(levels[0]);
      }
    } catch (error) {
      console.error("Error cargando niveles activos:", error);
    }
  };

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await getScheduleConfigForLevel(schoolId, activeLevel);
      setConfig(data);
      setOriginalConfig(data); // Guardar configuración original
    } catch (error) {
      console.error("Error cargando configuración:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Validaciones básicas
      if (config.blockDuration % 15 !== 0) {
        alert("La duración del bloque debe ser múltiplo de 15 minutos");
        return;
      }

      // Validar que los recreos estén dentro de los bloques disponibles
      const availableBlocks = calculateAvailableBlocks(
        config.startTime,
        config.endTime,
        config.blockDuration
      );
      const invalidBreaks = config.breaks.filter(
        (b) => b.afterBlock >= availableBlocks
      );
      if (invalidBreaks.length > 0) {
        alert(
          `❌ Hay recreos después del bloque ${
            availableBlocks - 1
          }, pero solo hay ${availableBlocks} bloques disponibles. Por favor corrige esto antes de guardar.`
        );
        return;
      }

      // Detectar cambios críticos que afectan horarios existentes
      if (originalConfig) {
        const criticalChanges = [];
        if (originalConfig.startTime !== config.startTime) {
          criticalChanges.push("hora de inicio");
        }
        if (originalConfig.endTime !== config.endTime) {
          criticalChanges.push("hora de término");
        }
        if (originalConfig.blockDuration !== config.blockDuration) {
          criticalChanges.push("duración de bloques");
        }

        if (criticalChanges.length > 0) {
          const confirmed = window.confirm(
            `⚠️ ADVERTENCIA: Estás cambiando ${criticalChanges.join(
              ", "
            )}.\n\n` +
              `Esto puede romper los horarios ya creados para este nivel académico.\n\n` +
              `Los horarios existentes podrían quedar con bloques fuera de rango o en horas incorrectas.\n\n` +
              `¿Estás seguro de continuar?`
          );
          if (!confirmed) {
            return;
          }
        }
      }

      setSaving(true);

      // Guardar ScheduleLevelConfig
      await saveScheduleConfigForLevel({
        schoolId,
        academicLevel: activeLevel,
        ...config,
      });

      alert(
        `✅ Configuración guardada para ${
          activeLevel === "BASIC" ? "Básica" : "Media"
        }`
      );
    } catch (error: any) {
      console.error("Error guardando configuración:", error);
      alert(error.message || "Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  const addBreak = () => {
    const availableBlocks = calculateAvailableBlocks(
      config.startTime,
      config.endTime,
      config.blockDuration
    );

    if (availableBlocks < 2) {
      alert(
        "⚠️ No hay suficientes bloques para agregar un recreo. Ajusta el horario de jornada primero."
      );
      return;
    }

    const lastBreak = config.breaks[config.breaks.length - 1];
    const nextAfterBlock = lastBreak
      ? Math.min(lastBreak.afterBlock + 1, availableBlocks - 1)
      : 2;

    if (nextAfterBlock >= availableBlocks) {
      alert(
        `⚠️ No puedes agregar más recreos. Solo hay ${availableBlocks} bloques disponibles.`
      );
      return;
    }

    // Si no hay breaks, sugerir crear un almuerzo
    const suggestedName = config.breaks.length === 0 ? "Almuerzo" : "Recreo";
    const suggestedDuration = config.breaks.length === 0 ? 45 : 15;

    setConfig({
      ...config,
      breaks: [
        ...config.breaks,
        {
          afterBlock: nextAfterBlock,
          duration: suggestedDuration,
          name: suggestedName,
        },
      ],
    });
  };

  const updateBreak = (index: number, updates: Partial<BreakConfig>) => {
    const newBreaks = [...config.breaks];
    newBreaks[index] = { ...newBreaks[index], ...updates };
    setConfig({ ...config, breaks: newBreaks });
  };

  const removeBreak = (index: number) => {
    setConfig({
      ...config,
      breaks: config.breaks.filter((_: BreakConfig, i: number) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="quick-assign-modal-overlay">
        <div className="schedule-config-modal quick-assign-modal">
          <div className="quick-assign-modal-header">
            <h3>⏳ Cargando configuración...</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quick-assign-modal-overlay" onClick={onClose}>
      <div
        className="schedule-config-modal quick-assign-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "800px", width: "90vw" }}
      >
        {/* Header */}
        <div className="quick-assign-modal-header">
          <div>
            <h3>⚙️ Configuración de Jornadas Escolares</h3>
            <p
              style={{
                margin: "0.25rem 0 0 0",
                fontSize: "0.875rem",
                color: "rgba(255, 255, 255, 0.75)",
              }}
            >
              {schoolName}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="quick-assign-modal-close"
            aria-label="Cerrar modal de configuración"
            title="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Tabs for Academic Levels */}
        <div className="academic-level-tabs">
          <button
            key="config"
            className={`academic-level-tab ${
              activeTab === "config" ? "active" : ""
            }`}
            onClick={() => setActiveTab("config")}
          >
            <span className="academic-level-tab-emoji">⚙️</span>
            <span className="academic-level-tab-label">Configuración General</span>
          </button>
          {ACADEMIC_LEVELS.filter((level) =>
            availableLevels.includes(level.key)
          ).map((level) => (
            <button
              key={level.key}
              className={`academic-level-tab ${
                activeTab === level.key ? "active" : ""
              }`}
              onClick={() => {
                setActiveLevel(level.key);
                setActiveTab(level.key);
              }}
            >
              <span className="academic-level-tab-emoji">{level.emoji}</span>
              <span className="academic-level-tab-label">{level.label}</span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div
          className="schedule-config-body quick-assign-modal-body"
          style={{ maxHeight: "60vh", overflowY: "auto" }}
        >
          {activeTab === "config" ? (
            <ActiveAcademicLevelsConfig
              schoolId={schoolId}
              onUpdate={loadAvailableLevels}
            />
          ) : (
            <>
              <p
                style={{
                  marginBottom: "1.5rem",
                  fontSize: "0.9375rem",
                  color: "rgba(255, 255, 255, 0.7)",
                }}
              >
                Configura los horarios específicos para{" "}
                <strong>
                  {activeLevel === "BASIC" ? "Educación Básica" : "Educación Media"}
                </strong>
                . Cada nivel puede tener horarios diferentes.
              </p>

          {/* Horario General */}
          <div className="schedule-config-section">
            <h4 className="schedule-config-section-title">
              ⏰ Horario de Jornada
            </h4>

            <div
              style={{
                marginBottom: "1rem",
                padding: "0.75rem",
                background: "rgba(59, 130, 246, 0.1)",
                borderLeft: "3px solid rgb(59, 130, 246)",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                color: "rgba(255, 255, 255, 0.9)",
              }}
            >
              📊 Bloques disponibles:{" "}
              <strong>
                {calculateAvailableBlocks(
                  config.startTime,
                  config.endTime,
                  config.blockDuration
                )}
              </strong>
              {originalConfig &&
                (originalConfig.startTime !== config.startTime ||
                  originalConfig.endTime !== config.endTime ||
                  originalConfig.blockDuration !== config.blockDuration) && (
                  <div
                    style={{ marginTop: "0.5rem", color: "rgb(251, 191, 36)" }}
                  >
                    ⚠️ Has modificado parámetros críticos que pueden afectar
                    horarios existentes
                  </div>
                )}
            </div>

            <div className="schedule-config-row">
              <div className="quick-assign-form-group">
                <label>Hora de Inicio</label>
                <select
                  value={config.startTime}
                  onChange={(e) =>
                    setConfig({ ...config, startTime: e.target.value })
                  }
                >
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div className="quick-assign-form-group">
                <label>Hora de Término</label>
                <select
                  value={config.endTime}
                  onChange={(e) =>
                    setConfig({ ...config, endTime: e.target.value })
                  }
                >
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div className="quick-assign-form-group">
                <label>Duración Bloque (min)</label>
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={config.blockDuration}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      blockDuration: parseInt(e.target.value) || 45,
                    })
                  }
                />
                <small
                  style={{
                    color: "rgba(255, 255, 255, 0.5)",
                    fontSize: "0.75rem",
                  }}
                >
                  Debe ser múltiplo de 15
                </small>
              </div>
            </div>
          </div>

          {/* Recreos y Almuerzos */}
          <div className="schedule-config-section">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1rem",
              }}
            >
              <h4
                className="schedule-config-section-title"
                style={{ margin: 0 }}
              >
                🌤️ Recreos y Almuerzos
              </h4>
              <button
                type="button"
                onClick={addBreak}
                className="schedule-editor-add-btn"
                style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
              >
                + Agregar Recreo/Almuerzo
              </button>
            </div>

            <div
              style={{
                marginBottom: "1rem",
                padding: "0.75rem",
                background: "rgba(59, 130, 246, 0.1)",
                borderLeft: "3px solid rgb(59, 130, 246)",
                borderRadius: "0.375rem",
                fontSize: "0.875rem",
                color: "rgba(255, 255, 255, 0.9)",
              }}
            >
              <div style={{ marginBottom: "0.5rem" }}>
                💡 <strong>Configura todos los descansos aquí</strong>
              </div>
              <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
                <li>Recreos cortos: 15-20 minutos</li>
                <li>Almuerzo: 30-60 minutos</li>
                <li>Se insertan después del bloque que indiques</li>
              </ul>
            </div>

            <p
              style={{
                fontSize: "0.875rem",
                color: "rgba(255, 255, 255, 0.75)",
                marginBottom: "1rem",
              }}
            >
              📊 Rango válido: Bloque 1 a{" "}
              {calculateAvailableBlocks(
                config.startTime,
                config.endTime,
                config.blockDuration
              ) - 1}
            </p>

            {config.breaks.length === 0 ? (
              <p
                style={{
                  color: "rgba(255, 255, 255, 0.5)",
                  fontSize: "0.875rem",
                  textAlign: "center",
                  padding: "2rem",
                  background: "rgba(255, 255, 255, 0.03)",
                  borderRadius: "0.5rem",
                }}
              >
                No hay recreos o almuerzos configurados.
                <br />
                Haz clic en "+ Agregar Recreo/Almuerzo" para crear uno.
              </p>
            ) : (
              <div className="breaks-list">
                {config.breaks.map((breakItem: BreakConfig, index: number) => {
                  const availableBlocks = calculateAvailableBlocks(
                    config.startTime,
                    config.endTime,
                    config.blockDuration
                  );
                  const isOutOfRange = breakItem.afterBlock >= availableBlocks;

                  return (
                    <div
                      key={index}
                      className="break-item"
                      style={
                        isOutOfRange
                          ? { border: "2px solid rgb(239, 68, 68)" }
                          : {}
                      }
                    >
                      <div className="break-item-header">
                        <span className="break-item-number">#{index + 1}</span>
                        {isOutOfRange && (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "rgb(239, 68, 68)",
                              marginLeft: "0.5rem",
                            }}
                          >
                            ⚠️ Fuera de rango
                          </span>
                        )}
                      </div>
                      <div className="schedule-config-row">
                        <div className="quick-assign-form-group">
                          <label>Después del Bloque</label>
                          <input
                            type="number"
                            min="1"
                            max={availableBlocks - 1}
                            value={breakItem.afterBlock}
                            onChange={(e) =>
                              updateBreak(index, {
                                afterBlock: parseInt(e.target.value) || 1,
                              })
                            }
                            style={
                              isOutOfRange
                                ? { borderColor: "rgb(239, 68, 68)" }
                                : {}
                            }
                          />
                          <small
                            style={{
                              color: isOutOfRange
                                ? "rgb(239, 68, 68)"
                                : "rgba(255, 255, 255, 0.5)",
                              fontSize: "0.7rem",
                            }}
                          >
                            Max: {availableBlocks - 1}
                          </small>
                        </div>

                        <div className="quick-assign-form-group">
                          <label>Duración (min)</label>
                          <input
                            type="number"
                            min="5"
                            step="5"
                            value={breakItem.duration}
                            onChange={(e) =>
                              updateBreak(index, {
                                duration: parseInt(e.target.value) || 15,
                              })
                            }
                          />
                        </div>

                        <div
                          className="quick-assign-form-group"
                          style={{ flex: 2 }}
                        >
                          <label>Nombre</label>
                          <input
                            type="text"
                            value={breakItem.name}
                            onChange={(e) =>
                              updateBreak(index, { name: e.target.value })
                            }
                            placeholder="Ej: Recreo, Almuerzo"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => removeBreak(index)}
                          className="break-item-remove"
                          title="Eliminar recreo"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info sobre compatibilidad */}
          <div
            style={{
              padding: "1rem",
              background: "rgba(251, 191, 36, 0.1)",
              border: "1px solid rgba(251, 191, 36, 0.3)",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              color: "rgba(251, 191, 36, 0.9)",
            }}
          >
            ℹ️ <strong>Importante:</strong> Los recreos y almuerzos se aplican a
            toda la semana. Si necesitas horarios diferentes por día, configura
            múltiples recreos con diferentes duraciones.
          </div>
            </>
          )}
        </div>

        {/* Footer - Solo mostrar en pestañas de jornada, no en config */}
        {activeTab !== "config" && (
          <div className="quick-assign-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="quick-assign-btn secondary"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="quick-assign-btn primary"
              disabled={saving}
            >
              {saving ? "Guardando..." : "💾 Guardar Configuración"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
