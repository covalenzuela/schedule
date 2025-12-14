/**
 * ⚙️ ScheduleConfigModal - Modal para configurar horarios dinámicos
 */

"use client";

import React from "react";

export interface ScheduleConfig {
  startTime: string; // Hora de inicio (ej: "08:00")
  endTime: string; // Hora de fin (ej: "18:00")
  blockDuration: number; // Duración en minutos (ej: 45, 60)
  breakDuration: number; // Descanso entre bloques en minutos (ej: 10, 15)
  lunchBreak: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

interface ScheduleConfigModalProps {
  config: ScheduleConfig;
  onConfirm: (config: ScheduleConfig) => void;
  onCancel: () => void;
}

const TIME_OPTIONS = [
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
];

export function ScheduleConfigModal({
  config,
  onConfirm,
  onCancel,
}: ScheduleConfigModalProps) {
  const [localConfig, setLocalConfig] = React.useState<ScheduleConfig>(config);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(localConfig);
  };

  return (
    <div className="quick-assign-modal-overlay" onClick={onCancel}>
      <div
        className="schedule-config-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="quick-assign-modal-header">
          <h3>⚙️ Configurar Horario</h3>
          <button onClick={onCancel} className="quick-assign-modal-close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="schedule-config-body">
            {/* Horarios de inicio y fin */}
            <div className="schedule-config-section">
              <h4 className="schedule-config-section-title">
                ⏰ Jornada Escolar
              </h4>

              <div className="schedule-config-row">
                <div className="quick-assign-form-group">
                  <label>Hora de inicio</label>
                  <select
                    value={localConfig.startTime}
                    onChange={(e) =>
                      setLocalConfig({
                        ...localConfig,
                        startTime: e.target.value,
                      })
                    }
                    required
                  >
                    {TIME_OPTIONS.slice(0, -5).map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="quick-assign-form-group">
                  <label>Hora de fin</label>
                  <select
                    value={localConfig.endTime}
                    onChange={(e) =>
                      setLocalConfig({
                        ...localConfig,
                        endTime: e.target.value,
                      })
                    }
                    required
                  >
                    {TIME_OPTIONS.filter((t) => t > localConfig.startTime).map(
                      (time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Duración de bloques y descansos */}
            <div className="schedule-config-section">
              <h4 className="schedule-config-section-title">
                📚 Bloques de Clase
              </h4>

              <div className="schedule-config-row">
                <div className="quick-assign-form-group">
                  <label>Duración de cada bloque</label>
                  <select
                    value={localConfig.blockDuration}
                    onChange={(e) =>
                      setLocalConfig({
                        ...localConfig,
                        blockDuration: parseInt(e.target.value),
                      })
                    }
                    required
                  >
                    <option value="30">30 minutos</option>
                    <option value="45">45 minutos</option>
                    <option value="60">60 minutos (1 hora)</option>
                    <option value="90">90 minutos (1.5 horas)</option>
                  </select>
                </div>

                <div className="quick-assign-form-group">
                  <label>Descanso entre bloques</label>
                  <select
                    value={localConfig.breakDuration}
                    onChange={(e) =>
                      setLocalConfig({
                        ...localConfig,
                        breakDuration: parseInt(e.target.value),
                      })
                    }
                    required
                  >
                    <option value="0">Sin descanso</option>
                    <option value="5">5 minutos</option>
                    <option value="10">10 minutos</option>
                    <option value="15">15 minutos</option>
                    <option value="20">20 minutos</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Horario de almuerzo */}
            <div className="schedule-config-section">
              <h4 className="schedule-config-section-title">
                🍽️ Horario de Almuerzo
              </h4>

              <div className="schedule-config-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={localConfig.lunchBreak.enabled}
                    onChange={(e) =>
                      setLocalConfig({
                        ...localConfig,
                        lunchBreak: {
                          ...localConfig.lunchBreak,
                          enabled: e.target.checked,
                        },
                      })
                    }
                  />
                  <span>Incluir horario de almuerzo</span>
                </label>
                <p className="schedule-config-hint">
                  Durante este periodo no se podrán asignar clases
                </p>
              </div>

              {localConfig.lunchBreak.enabled && (
                <div className="schedule-config-row">
                  <div className="quick-assign-form-group">
                    <label>Inicio del almuerzo</label>
                    <select
                      value={localConfig.lunchBreak.startTime}
                      onChange={(e) =>
                        setLocalConfig({
                          ...localConfig,
                          lunchBreak: {
                            ...localConfig.lunchBreak,
                            startTime: e.target.value,
                          },
                        })
                      }
                      required
                    >
                      {TIME_OPTIONS.filter(
                        (t) =>
                          t >= localConfig.startTime && t < localConfig.endTime
                      ).map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="quick-assign-form-group">
                    <label>Fin del almuerzo</label>
                    <select
                      value={localConfig.lunchBreak.endTime}
                      onChange={(e) =>
                        setLocalConfig({
                          ...localConfig,
                          lunchBreak: {
                            ...localConfig.lunchBreak,
                            endTime: e.target.value,
                          },
                        })
                      }
                      required
                    >
                      {TIME_OPTIONS.filter(
                        (t) =>
                          t > localConfig.lunchBreak.startTime &&
                          t <= localConfig.endTime
                      ).map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="schedule-config-preview">
              <strong>Vista previa:</strong>
              <p>
                • Jornada de {localConfig.startTime} a {localConfig.endTime}
                <br />• Bloques de {localConfig.blockDuration} min con{" "}
                {localConfig.breakDuration} min de descanso
                <br />
                {localConfig.lunchBreak.enabled && (
                  <>
                    • Almuerzo: {localConfig.lunchBreak.startTime} -{" "}
                    {localConfig.lunchBreak.endTime}
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="quick-assign-modal-footer">
            <button
              type="button"
              onClick={onCancel}
              className="quick-assign-btn secondary"
            >
              Cancelar
            </button>
            <button type="submit" className="quick-assign-btn primary">
              Aplicar Configuración
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
