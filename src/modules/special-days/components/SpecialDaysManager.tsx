"use client";

import { useState, useEffect } from "react";
import {
  getSpecialDays,
  createSpecialDay,
  updateSpecialDay,
  deleteSpecialDay,
  importNationalHolidays,
  toggleWeekendBlocking,
} from "@/modules/special-days/actions";
import "./SpecialDaysManager.css";

interface SpecialDay {
  id: string;
  date: Date;
  name: string;
  type: "holiday" | "school_event" | "no_attendance" | "other";
  description?: string;
  recurring: boolean;
  isActive: boolean;
}

interface SpecialDaysManagerProps {
  schoolId: string;
}

export function SpecialDaysManager({ schoolId }: SpecialDaysManagerProps) {
  const [specialDays, setSpecialDays] = useState<SpecialDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [editingDay, setEditingDay] = useState<SpecialDay | null>(null);
  const [hasWeekendBlocked, setHasWeekendBlocked] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    date: "",
    type: "holiday" as "holiday" | "school_event" | "no_attendance" | "other",
    description: "",
    recurring: false,
  });

  useEffect(() => {
    loadSpecialDays();
  }, [selectedYear, schoolId]);

  const loadSpecialDays = async () => {
    try {
      setLoading(true);
      const data = await getSpecialDays(schoolId, selectedYear);
      setSpecialDays(data as any);
      // Determinar si existen entradas de 'Fin de semana' para el año
      const weekends = (data as any[]).some((d) => {
        const name = d.name?.toLowerCase?.() || "";
        const yearOf = new Date(d.date).getFullYear();
        return name.includes("fin de semana") && yearOf === selectedYear;
      });
      setHasWeekendBlocked(!!weekends);
    } catch (error) {
      console.error("Error loading special days:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportNational = async () => {
    try {
      if (!confirm("Importar feriados nacionales para el año " + selectedYear + "?")) return;
      await importNationalHolidays(schoolId, selectedYear);
      await loadSpecialDays();
      alert("Feriados importados correctamente");
    } catch (error) {
      console.error(error);
      alert("Error importando feriados nacionales");
    }
  };

  const handleToggleWeekends = async (checked: boolean) => {
    try {
      if (checked && !confirm("¿Agregar bloqueo de fines de semana para " + selectedYear + "?")) return;
      if (!checked && !confirm("¿Eliminar bloqueo de fines de semana para " + selectedYear + "?")) return;
      await toggleWeekendBlocking(schoolId, selectedYear, checked);
      await loadSpecialDays();
      setHasWeekendBlocked(checked);
    } catch (error) {
      console.error(error);
      alert("Error actualizando bloqueo de fines de semana");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingDay) {
        await updateSpecialDay(editingDay.id, {
          name: formData.name,
          type: formData.type,
          description: formData.description,
          recurring: formData.recurring,
        });
      } else {
        await createSpecialDay({
          schoolId,
          date: new Date(formData.date),
          name: formData.name,
          type: formData.type,
          description: formData.description,
          recurring: formData.recurring,
        });
      }

      resetForm();
      loadSpecialDays();
    } catch (error) {
      console.error("Error saving special day:", error);
      alert("Error al guardar el día especial");
    }
  };

  const handleEdit = (day: SpecialDay) => {
    setEditingDay(day);
    setFormData({
      name: day.name,
      date: new Date(day.date).toISOString().split("T")[0],
      type: day.type,
      description: day.description || "",
      recurring: day.recurring,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este día especial?")) return;

    try {
      await deleteSpecialDay(id);
      loadSpecialDays();
    } catch (error) {
      console.error("Error deleting special day:", error);
      alert("Error al eliminar el día especial");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      date: "",
      type: "holiday",
      description: "",
      recurring: false,
    });
    setEditingDay(null);
    setShowForm(false);
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      holiday: "🎉 Feriado Nacional",
      school_event: "🏫 Evento Escolar",
      no_attendance: "🚫 Sin Asistencia",
      other: "📌 Otro",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      holiday: "#ef4444",
      school_event: "#3b82f6",
      no_attendance: "#f59e0b",
      other: "#6b7280",
    };
    return colors[type as keyof typeof colors] || "#6b7280";
  };

  if (loading) {
    return (
      <div className="special-days-loading">
        <div className="spinner"></div>
        <p>Cargando días especiales...</p>
      </div>
    );
  }

  return (
    <div className="special-days-manager">
      <div className="special-days-header">
        <h2>📅 Días Especiales y Feriados</h2>
        <div className="header-actions">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="year-selector"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - 1 + i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
          <button
            onClick={handleImportNational}
            className="btn-secondary"
            title="Cargar feriados nacionales"
            style={{ marginLeft: "0.5rem" }}
          >
            📥 Cargar Feriados
          </button>

          <label style={{ display: "inline-flex", alignItems: "center", marginLeft: "0.5rem" }}>
            <input
              type="checkbox"
              checked={hasWeekendBlocked}
              onChange={(e) => handleToggleWeekends(e.target.checked)}
              style={{ marginRight: "0.5rem" }}
            />
            <span>Bloquear fines de semana</span>
          </label>

          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
            style={{ marginLeft: "0.5rem" }}
          >
            {showForm ? "❌ Cancelar" : "➕ Agregar Día Especial"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="special-day-form-container">
          <h3>{editingDay ? "Editar" : "Nuevo"} Día Especial</h3>
          <form onSubmit={handleSubmit} className="special-day-form">
            <div className="form-row">
              <div className="form-group">
                <label>Nombre del Día *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ej: Año Nuevo, Día del Profesor"
                  required
                />
              </div>

              <div className="form-group">
                <label>Fecha *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                  disabled={!!editingDay}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Tipo *</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as any,
                    })
                  }
                  required
                >
                  <option value="holiday">🎉 Feriado Nacional</option>
                  <option value="school_event">🏫 Evento Escolar</option>
                  <option value="no_attendance">🚫 Sin Asistencia</option>
                  <option value="other">📌 Otro</option>
                </select>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.recurring}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recurring: e.target.checked,
                      })
                    }
                  />
                  <span>🔁 Repetir cada año</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Descripción (opcional)</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Información adicional sobre este día"
                rows={3}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-success">
                💾 {editingDay ? "Actualizar" : "Guardar"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="special-days-list">
        {specialDays.length === 0 ? (
          <div className="empty-state">
            <p>No hay días especiales configurados para {selectedYear}</p>
            <p className="hint">
              Haz clic en "Agregar Día Especial" para comenzar
            </p>
          </div>
        ) : (
          <div className="days-grid">
            {specialDays.map((day) => (
              <div
                key={day.id}
                className="special-day-card"
                style={{ borderLeftColor: getTypeColor(day.type) }}
              >
                <div className="day-header">
                  <div className="day-info">
                    <span className="day-type">{getTypeLabel(day.type)}</span>
                    <h4>{day.name}</h4>
                    <p className="day-date">
                      📅{" "}
                      {new Date(day.date).toLocaleDateString("es", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    {day.recurring && (
                      <span className="badge-recurring">🔁 Anual</span>
                    )}
                  </div>
                  <div className="day-actions">
                    <button
                      onClick={() => handleEdit(day)}
                      className="btn-icon"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(day.id)}
                      className="btn-icon btn-danger"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                {day.description && (
                  <p className="day-description">{day.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
