/**
 * 📅 ScheduleGridSimple - Componente experimental para visualizar horarios
 * Versión simplificada para la página experimental con datos mock
 */

"use client";

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
}

const DAYS = [
  { key: "MONDAY", label: "Lunes" },
  { key: "TUESDAY", label: "Martes" },
  { key: "WEDNESDAY", label: "Miércoles" },
  { key: "THURSDAY", label: "Jueves" },
  { key: "FRIDAY", label: "Viernes" },
];

export function ScheduleGrid({ blocks, type }: ScheduleGridProps) {
  // Generar slots dinámicamente basándose en los bloques reales
  const generateTimeSlots = () => {
    if (blocks.length === 0) {
      // Slots por defecto si no hay bloques
      return [
        { start: "09:00", end: "10:00" },
        { start: "10:00", end: "11:00" },
        { start: "11:00", end: "12:00" },
        { start: "12:00", end: "13:00" },
        {
          start: "13:00",
          end: "14:00",
          isBreak: true,
          label: "Descanso para el Almuerzo",
        },
        { start: "14:00", end: "15:00" },
        { start: "15:00", end: "16:00" },
        { start: "16:00", end: "17:00" },
        { start: "17:00", end: "18:00" },
      ];
    }

    // Obtener todos los tiempos únicos de los bloques
    const allTimes = new Set<string>();
    blocks.forEach((block) => {
      allTimes.add(block.startTime);
      allTimes.add(block.endTime);
    });

    // Convertir a array y ordenar
    const sortedTimes = Array.from(allTimes).sort();

    // Crear slots desde el primer tiempo hasta el último
    const slots: {
      start: string;
      end: string;
      isBreak?: boolean;
      label?: string;
    }[] = [];

    for (let i = 0; i < sortedTimes.length - 1; i++) {
      const start = sortedTimes[i];
      const end = sortedTimes[i + 1];

      // Verificar si es almuerzo (entre 13:00 y 14:00 típicamente)
      if (start >= "13:00" && end <= "14:00") {
        slots.push({ start, end, isBreak: true, label: "Almuerzo" });
      } else {
        slots.push({ start, end });
      }
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

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
        {timeSlots.map((slot) => (
          <div key={slot.start} className="schedule-row">
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
