/**
 * 📅 ScheduleGridSimple - Componente experimental para visualizar horarios
 * Versión simplificada para la página experimental con datos mock
 */

"use client";

import { generateTimeSlotsWithBreaks } from "@/lib/utils/time-slots";
import type { ScheduleLevelConfig } from "@/types/schedule-config";

interface ScheduleBlock {
  day: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY";
  startTime: string;
  endTime: string;
  subject: string;
  teacher?: string; // Para horarios de curso
  course?: string; // Para horarios de profesor
  color: string;
}

interface ScheduleGridProps {
  blocks: ScheduleBlock[];
  type: "course" | "teacher";
  config?: ScheduleLevelConfig | null; // Configuración de nivel académico
}

const DAYS = [
  { key: "MONDAY", label: "Lunes" },
  { key: "TUESDAY", label: "Martes" },
  { key: "WEDNESDAY", label: "Miércoles" },
  { key: "THURSDAY", label: "Jueves" },
  { key: "FRIDAY", label: "Viernes" },
];

export function ScheduleGrid({ blocks, type, config }: ScheduleGridProps) {
  // Usar configuración si está disponible, sino fallback a slots dinámicos
  const timeSlots = config 
    ? generateTimeSlotsWithBreaks(config)
    : generateFallbackTimeSlots(blocks);

  function generateFallbackTimeSlots(blocks: ScheduleBlock[]) {
    if (blocks.length === 0) {
      // Slots por defecto si no hay bloques
      return [
        { start: "08:00", end: "09:00", label: "Bloque 1", number: 1 },
        { start: "09:00", end: "10:00", label: "Bloque 2", number: 2 },
        { start: "10:00", end: "11:00", label: "Bloque 3", number: 3 },
        { start: "11:00", end: "12:00", label: "Bloque 4", number: 4 },
        { start: "13:00", end: "14:00", isBreak: true, label: "Almuerzo" },
        { start: "14:00", end: "15:00", label: "Bloque 5", number: 5 },
        { start: "15:00", end: "16:00", label: "Bloque 6", number: 6 },
      ];
    }

    // Obtener todos los tiempos únicos de los bloques
    const allTimes = new Set<string>();
    blocks.forEach((block) => {
      allTimes.add(block.startTime);
      allTimes.add(block.endTime);
    });

    const sortedTimes = Array.from(allTimes).sort();
    const slots: any[] = [];
    let blockNumber = 1;

    for (let i = 0; i < sortedTimes.length - 1; i++) {
      const start = sortedTimes[i];
      const end = sortedTimes[i + 1];

      if (start >= "13:00" && end <= "14:00") {
        slots.push({ start, end, isBreak: true, label: "Almuerzo" });
      } else {
        slots.push({ start, end, label: `Bloque ${blockNumber}`, number: blockNumber });
        blockNumber++;
      }
    }

    return slots;
  }

  const getBlockForSlot = (day: string, startTime: string) => {
    return blocks.find(
      (block) => block.day === day && block.startTime === startTime
    );
  };

  return (
    <div className="schedule-grid-wrapper">
      <div className="schedule-grid-table">
        {/* Header con días de la semana */}
        <div className="schedule-header-row">
          <div className="schedule-time-header"></div>
          {DAYS.map((day) => (
            <div key={day.key} className="schedule-day-header">
              {day.label}
            </div>
          ))}
        </div>

        {/* Filas de horarios */}
        {timeSlots.map((slot, index) => (
          <div key={`${slot.start}-${slot.end}-${index}`} className="schedule-row">
            {/* Columna de hora */}
            <div className="schedule-time-cell">
              {slot.start} - {slot.end}
            </div>

            {/* Break (almuerzo) */}
            {slot.isBreak ? (
              <div className="schedule-break-cell">{slot.label}</div>
            ) : (
              /* Celdas de cada día */
              DAYS.map((day) => {
                const block = getBlockForSlot(day.key, slot.start);

                return (
                  <div
                    key={`${day.key}-${slot.start}`}
                    className={`schedule-cell ${block ? "has-block" : ""}`}
                    style={{
                      backgroundColor: block?.color || "transparent",
                    }}
                  >
                    {block && (
                      <div className="schedule-block-content">
                        <div className="schedule-block-subject">
                          {block.subject}
                        </div>
                        <div className="schedule-block-detail">
                          {type === "course" ? block.teacher : block.course}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
