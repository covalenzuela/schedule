"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getTeacher,
  getTeacherAvailability,
  setTeacherAvailability,
} from "@/modules/teachers/actions";
import { getSchoolScheduleConfig } from "@/modules/schools/actions";
import { getSchoolScheduleRange } from "@/modules/schools/actions/schedule-range";
import { ImportAvailabilityModal } from "@/modules/teachers/components/ImportAvailabilityModal";
import "./TeacherAvailability.css";

type Teacher = Awaited<ReturnType<typeof getTeacher>>;
type Availability = Awaited<ReturnType<typeof getTeacherAvailability>>;

interface AvailabilitySlot {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

const DAYS = [
  { key: "MONDAY", label: "Lunes", short: "L" },
  { key: "TUESDAY", label: "Martes", short: "M" },
  { key: "WEDNESDAY", label: "Miércoles", short: "X" },
  { key: "THURSDAY", label: "Jueves", short: "J" },
  { key: "FRIDAY", label: "Viernes", short: "V" },
];

// Función para generar slots dinámicamente basados en la configuración del colegio
// SOLO para disponibilidad - bloques sin breaks
function generateTimeSlots(
  startTime: string,
  endTime: string,
  blockDuration: number,
  breakDuration: number
): string[] {
  const slots: string[] = [];
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  let currentTime = startHour * 60 + startMin; // Convertir a minutos
  const endTimeMinutes = endHour * 60 + endMin;

  // Para disponibilidad, generamos bloques cada blockDuration (SIN breaks)
  // Esto permite que el profesor marque su disponibilidad por hora completa
  while (currentTime < endTimeMinutes) {
    const hours = Math.floor(currentTime / 60);
    const minutes = currentTime % 60;
    slots.push(
      `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`
    );
    currentTime += blockDuration; // Solo sumar blockDuration, no breaks
  }

  // Agregar el tiempo final Y un bloque más como límite superior
  // Esto permite que incluso el último slot tenga un endTime válido
  slots.push(endTime);
  const finalBlockTime = endTimeMinutes + blockDuration;
  const finalHours = Math.floor(finalBlockTime / 60);
  const finalMins = finalBlockTime % 60;
  slots.push(
    `${finalHours.toString().padStart(2, "0")}:${finalMins
      .toString()
      .padStart(2, "0")}`
  );

  return slots;
}

export default function TeacherAvailabilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Unwrap params usando React.use()
  const { id: teacherId } = use(params);

  const router = useRouter();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [availability, setAvailabilityState] = useState<Availability>([]);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [scheduleEndTime, setScheduleEndTime] = useState<string>("18:00");
  const [lunchBreakByDay, setLunchBreakByDay] = useState<
    Record<string, { enabled: boolean; start: string; end: string }>
  >({});

  useEffect(() => {
    loadData();
  }, [teacherId]);

  const loadData = async () => {
    try {
      const teacherData = await getTeacher(teacherId);
      setTeacher(teacherData);

      if (!teacherData) {
        setIsLoading(false);
        return;
      }

      // Obtener configuración del colegio (legacy, mantener para lunchBreak)
      const schoolConfig = await getSchoolScheduleConfig(teacherData.schoolId);

      // Obtener rango completo considerando TODAS las jornadas (Básica + Media)
      const scheduleRange = await getSchoolScheduleRange(teacherData.schoolId);

      console.log("[Availability] Rango de horarios:", scheduleRange);

      // Generar slots basados en el RANGO COMPLETO
      const slots = generateTimeSlots(
        scheduleRange.startTime,
        scheduleRange.endTime,
        scheduleRange.blockDuration,
        schoolConfig.breakDuration
      );
      setTimeSlots(slots);
      setScheduleEndTime(scheduleRange.endTime);
      setLunchBreakByDay(schoolConfig.lunchBreakByDay || {});

      // Cargar disponibilidad del profesor
      const availabilityData = await getTeacherAvailability(teacherId);
      console.log("[Availability] Datos cargados de la BD:", availabilityData);
      console.log(
        "[Availability] Cantidad de registros:",
        availabilityData.length
      );
      setAvailabilityState(availabilityData);

      // Convertir disponibilidad a slots seleccionados
      const selectedSet = new Set<string>();
      availabilityData.forEach((slot: AvailabilitySlot) => {
        console.log("[Availability] Procesando slot:", slot);
        const startIdx = slots.indexOf(slot.startTime);
        const endIdx = slots.indexOf(slot.endTime);

        // endTime marca hasta dónde NO llega (exclusivo), así que pintamos hasta endIdx-1
        // PERO si endIdx = -1 (ej: endTime es 18:00 que no está en slots), pintamos hasta el final
        const lastSlotIdx = endIdx >= 0 ? endIdx : slots.length;

        console.log("[Availability] Índices:", {
          startIdx,
          endIdx,
          lastSlotIdx,
          start: slot.startTime,
          end: slot.endTime,
          slots: slots.slice(startIdx, lastSlotIdx),
        });

        // Pintar desde startIdx hasta lastSlotIdx (exclusivo, como slice)
        for (let i = startIdx; i < lastSlotIdx && i >= 0; i++) {
          const slotKey = `${slot.dayOfWeek}-${slots[i]}`;
          selectedSet.add(slotKey);
          console.log("[Availability] Agregado slot:", slotKey);
        }
      });

      console.log(
        "[Availability] Total slots seleccionados:",
        selectedSet.size
      );
      setSelectedSlots(selectedSet);
      setIsLoading(false);
    } catch (error) {
      console.error("Error cargando datos:", error);
      setIsLoading(false);
    }
  };

  const handleSlotClick = (day: string, time: string) => {
    const slotKey = `${day}-${time}`;
    const newSelected = new Set(selectedSlots);

    if (newSelected.has(slotKey)) {
      newSelected.delete(slotKey);
    } else {
      newSelected.add(slotKey);
    }

    setSelectedSlots(newSelected);
  };

  const handleMouseDown = (day: string, time: string) => {
    setIsSelecting(true);
    handleSlotClick(day, time);
  };

  const handleMouseEnter = (day: string, time: string) => {
    if (isSelecting) {
      handleSlotClick(day, time);
    }
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
  };

  const convertSlotsToAvailability = (): AvailabilitySlot[] => {
    console.log("[convertSlots] Iniciando conversión");
    console.log("[convertSlots] selectedSlots size:", selectedSlots.size);
    console.log("[convertSlots] scheduleEndTime:", scheduleEndTime);

    const result: AvailabilitySlot[] = [];

    // Procesar cada día
    DAYS.forEach((day) => {
      const daySlots: string[] = [];

      // Recopilar todos los slots seleccionados para este día
      timeSlots.forEach((time) => {
        if (selectedSlots.has(`${day.key}-${time}`)) {
          daySlots.push(time);
        }
      });

      if (daySlots.length === 0) return;

      console.log(
        `[convertSlots] ${day.key}: ${daySlots.length} slots`,
        daySlots
      );

      // Ordenar por tiempo (por si acaso)
      daySlots.sort();

      // Consolidar en rangos consecutivos
      let rangeStart = daySlots[0];

      for (let i = 0; i < daySlots.length; i++) {
        const currentSlot = daySlots[i];
        const nextSlot = daySlots[i + 1];

        const currentIdx = timeSlots.indexOf(currentSlot);
        const nextIdx = nextSlot ? timeSlots.indexOf(nextSlot) : -1;

        console.log(`[convertSlots] Procesando slot ${i}:`, {
          currentSlot,
          currentIdx,
          nextSlot,
          nextIdx,
          isConsecutive: nextIdx === currentIdx + 1,
          willCloseRange: !nextSlot || nextIdx !== currentIdx + 1,
        });

        // Si no hay siguiente o no es consecutivo, cerrar el rango
        if (!nextSlot || nextIdx !== currentIdx + 1) {
          // El endTime es el siguiente slot después del actual, o scheduleEndTime si es el último
          const nextTimeIdx = currentIdx + 1;
          const useScheduleEnd = nextTimeIdx >= timeSlots.length;
          const endTime = useScheduleEnd
            ? scheduleEndTime
            : timeSlots[nextTimeIdx];

          console.log(`[convertSlots] Cerrando rango:`, {
            rangeStart,
            currentSlot,
            currentIdx,
            nextTimeIdx,
            "timeSlots.length": timeSlots.length,
            useScheduleEnd,
            endTime,
          });

          result.push({
            dayOfWeek: day.key,
            startTime: rangeStart,
            endTime: endTime,
          });

          console.log(`[convertSlots] Rango: ${rangeStart} - ${endTime}`);

          // Si hay siguiente, será el inicio del próximo rango
          if (nextSlot) {
            rangeStart = nextSlot;
          }
        }
      }
    });

    console.log("[convertSlots] Resultado final:", result);
    return result;
  };

  const handleSave = async () => {
    if (!teacher) return;

    setIsSaving(true);
    try {
      const availabilityData = convertSlotsToAvailability();
      console.log("[Availability] Datos a guardar:", availabilityData);
      console.log("[Availability] Cantidad de slots:", availabilityData.length);

      if (availabilityData.length === 0) {
        alert("⚠️ No has seleccionado ningún horario de disponibilidad");
        setIsSaving(false);
        return;
      }

      const result = await setTeacherAvailability(teacherId, availabilityData);
      console.log("[Availability] Resultado del guardado:", result);

      alert("✅ Disponibilidad guardada exitosamente");

      // Recargar datos antes de redirigir para confirmar que se guardó
      await loadData();

      router.push("/teachers");
    } catch (error) {
      console.error("Error guardando disponibilidad:", error);
      alert(
        `❌ Error al guardar la disponibilidad: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectAll = () => {
    const allSlots = new Set<string>();
    DAYS.forEach((day) => {
      timeSlots.forEach((time) => {
        allSlots.add(`${day.key}-${time}`);
      });
    });
    setSelectedSlots(allSlots);
  };

  const handleClearAll = () => {
    setSelectedSlots(new Set());
  };

  const handleImportAvailability = async (
    importedAvailability: Array<{
      dayOfWeek: string;
      startTime: string;
      endTime: string;
    }>
  ) => {
    // Convertir la disponibilidad importada a slots seleccionados
    const newSlots = new Set<string>();

    importedAvailability.forEach((slot) => {
      const startIdx = timeSlots.indexOf(slot.startTime);
      const endIdx = timeSlots.indexOf(slot.endTime);

      if (startIdx !== -1 && endIdx !== -1) {
        for (let i = startIdx; i < endIdx; i++) {
          newSlots.add(`${slot.dayOfWeek}-${timeSlots[i]}`);
        }
      }
    });

    setSelectedSlots(newSlots);
    setShowImportModal(false);
    alert("✅ Disponibilidad importada. Revisa y guarda los cambios.");
  };

  if (isLoading) {
    return (
      <div className="availability-page">
        <div className="availability-loading">
          <div className="spinner">⏳</div>
          <p>Cargando disponibilidad...</p>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="availability-page">
        <div className="availability-error">
          <p>❌ Profesor no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="availability-page" onMouseUp={handleMouseUp}>
      <div className="availability-bg">
        <div className="availability-gradient" />
      </div>

      <div className="availability-container">
        {/* Header */}
        <header className="availability-header">
          <div className="availability-header-top">
            <button
              className="availability-back-btn"
              onClick={() => router.push("/teachers")}
            >
              ← Volver
            </button>
            <div className="availability-actions">
              <button
                className="availability-btn availability-btn-ghost"
                onClick={handleClearAll}
              >
                🗑️ Limpiar Todo
              </button>
              <button
                className="availability-btn"
                style={{
                  background: "linear-gradient(135deg, #10B981, #059669)",
                  color: "#fff",
                }}
                onClick={() => setShowImportModal(true)}
              >
                📥 Importar Excel
              </button>
              <button
                className="availability-btn availability-btn-secondary"
                onClick={handleSelectAll}
              >
                ✓ Seleccionar Todo
              </button>
              <button
                className="availability-btn availability-btn-primary"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "💾 Guardando..." : "💾 Guardar Disponibilidad"}
              </button>
            </div>
          </div>

          <div className="availability-teacher-info">
            <div className="teacher-avatar">
              {teacher.firstName[0]}
              {teacher.lastName[0]}
            </div>
            <div>
              <h1 className="availability-title">📅 Disponibilidad Horaria</h1>
              <p className="availability-subtitle">
                {teacher.firstName} {teacher.lastName}
                {teacher.specialization && ` · ${teacher.specialization}`}
              </p>
            </div>
          </div>

          <div className="availability-instructions">
            <p>
              💡 <strong>Instrucciones:</strong> Haz clic o arrastra sobre los
              bloques para marcar los horarios en que el profesor está
              disponible. Los bloques en{" "}
              <span style={{ color: "var(--primary-400)" }}>azul</span> indican
              disponibilidad.
            </p>
            <p
              style={{
                marginTop: "0.75rem",
                padding: "0.75rem",
                background: "rgba(59, 130, 246, 0.1)",
                borderLeft: "3px solid rgb(59, 130, 246)",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
              }}
            >
              📊 <strong>Jornadas combinadas:</strong> Esta grilla cubre todas
              las jornadas del colegio (Básica y Media). Marca tu disponibilidad
              para el rango completo de horarios.
            </p>
          </div>
        </header>

        {/* Grilla de disponibilidad */}
        <div className="availability-grid-wrapper">
          <div className="availability-grid">
            {/* Header con días */}
            <div className="availability-grid-header">
              <div className="availability-grid-cell availability-grid-corner">
                Hora
              </div>
              {DAYS.map((day) => (
                <div
                  key={day.key}
                  className="availability-grid-cell availability-grid-day"
                >
                  <span className="day-full">{day.label}</span>
                  <span className="day-short">{day.short}</span>
                </div>
              ))}
            </div>

            {/* Filas de tiempo */}
            {timeSlots.slice(0, -1).map((time, timeIdx) => (
              <div key={time} className="availability-grid-row">
                <div className="availability-grid-cell availability-grid-time">
                  {time}
                </div>
                {DAYS.map((day) => {
                  const slotKey = `${day.key}-${time}`;
                  const isSelected = selectedSlots.has(slotKey);

                  return (
                    <div
                      key={slotKey}
                      className={`availability-grid-cell availability-grid-slot ${
                        isSelected ? "selected" : ""
                      }`}
                      onMouseDown={() => handleMouseDown(day.key, time)}
                      onMouseEnter={() => handleMouseEnter(day.key, time)}
                    >
                      {isSelected && "✓"}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Resumen */}
        <div className="availability-summary">
          <h3>📊 Resumen de Disponibilidad</h3>
          <div className="availability-summary-grid">
            {DAYS.map((day) => {
              const daySlots = Array.from(selectedSlots).filter((slot) =>
                slot.startsWith(`${day.key}-`)
              );

              if (daySlots.length === 0) {
                return (
                  <div key={day.key} className="availability-summary-day">
                    <strong>{day.label}:</strong>
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>
                      Sin disponibilidad
                    </span>
                  </div>
                );
              }

              return (
                <div key={day.key} className="availability-summary-day">
                  <strong>{day.label}:</strong>
                  <span>
                    {daySlots.length} bloques de 30min (
                    {(daySlots.length * 0.5).toFixed(1)}h)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal de Importación */}
      {showImportModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "rgba(17, 24, 39, 0.98)",
              borderRadius: "1rem",
              maxWidth: "800px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <ImportAvailabilityModal
              teacherName={`${teacher.firstName} ${teacher.lastName}`}
              onImport={handleImportAvailability}
              onCancel={() => setShowImportModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
