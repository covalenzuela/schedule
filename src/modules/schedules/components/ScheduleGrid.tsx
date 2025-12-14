/**
 * 🗓️ Componente ScheduleGrid - Sistema de Horarios
 *
 * Grilla visual de horario semanal con diseño pastel
 * Muestra horarios de Lunes a Viernes con bloques de tiempo
 */

"use client";

import { useMemo } from "react";
import {
  Schedule,
  ScheduleBlock,
  TimeBlock,
  DayOfWeek,
  DAYS_OF_WEEK,
  DAY_LABELS,
} from "@/types";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { formatTime, getSubjectColor } from "@/lib/utils/schedule";

export interface ScheduleGridProps {
  schedule: Schedule;
  timeBlocks: TimeBlock[];
  onBlockClick?: (
    block: ScheduleBlock | null,
    day: DayOfWeek,
    timeBlock: TimeBlock
  ) => void;
  showConflicts?: boolean;
}

export function ScheduleGrid({
  schedule,
  timeBlocks,
  onBlockClick,
  showConflicts = true,
}: ScheduleGridProps) {
  // Organizar bloques por día y hora
  const gridData = useMemo(() => {
    const data: Record<DayOfWeek, Record<string, ScheduleBlock | null>> = {
      [DayOfWeek.MONDAY]: {},
      [DayOfWeek.TUESDAY]: {},
      [DayOfWeek.WEDNESDAY]: {},
      [DayOfWeek.THURSDAY]: {},
      [DayOfWeek.FRIDAY]: {},
      [DayOfWeek.SATURDAY]: {},
      [DayOfWeek.SUNDAY]: {},
    };

    // Inicializar todas las celdas como null
    DAYS_OF_WEEK.forEach((day) => {
      timeBlocks.forEach((timeBlock) => {
        data[day][timeBlock.id] = null;
      });
    });

    // Llenar con los bloques del horario
    schedule.blocks.forEach((block) => {
      data[block.dayOfWeek][block.timeBlock.id] = block;
    });

    return data;
  }, [schedule, timeBlocks]);

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-200">
        {/* Encabezado de días */}
        <div className="grid grid-cols-[100px_repeat(5,1fr)] gap-2 mb-4">
          <div className="text-center font-semibold text-neutral-700">
            Horario
          </div>
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="text-center font-semibold text-neutral-800 py-3 bg-white rounded-lg shadow-sm border border-neutral-200"
            >
              {DAY_LABELS[day]}
            </div>
          ))}
        </div>

        {/* Grilla de horarios */}
        <div className="space-y-2">
          {timeBlocks.map((timeBlock) => (
            <div
              key={timeBlock.id}
              className="grid grid-cols-[100px_repeat(5,1fr)] gap-2"
            >
              {/* Columna de tiempo */}
              <div className="flex flex-col items-center justify-center bg-neutral-100 rounded-lg p-2 text-sm font-medium text-neutral-700">
                <div>{formatTime(timeBlock.startTime)}</div>
                <div className="text-xs text-neutral-500">
                  {formatTime(timeBlock.endTime)}
                </div>
              </div>

              {/* Celdas de bloques */}
              {DAYS_OF_WEEK.map((day) => {
                const block = gridData[day][timeBlock.id];
                return (
                  <ScheduleCell
                    key={`${day}-${timeBlock.id}`}
                    block={block}
                    day={day}
                    timeBlock={timeBlock}
                    onClick={onBlockClick}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ScheduleCellProps {
  block: ScheduleBlock | null;
  day: DayOfWeek;
  timeBlock: TimeBlock;
  onClick?: (
    block: ScheduleBlock | null,
    day: DayOfWeek,
    timeBlock: TimeBlock
  ) => void;
}

function ScheduleCell({ block, day, timeBlock, onClick }: ScheduleCellProps) {
  if (!block) {
    // Celda vacía
    return (
      <button
        onClick={() => onClick?.(null, day, timeBlock)}
        className="min-h-20 bg-white rounded-lg border-2 border-dashed border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 flex items-center justify-center text-neutral-400 text-sm cursor-pointer"
      >
        +
      </button>
    );
  }

  // Celda con asignación
  const colorClass = getSubjectColor(block.subjectId);

  return (
    <button
      onClick={() => onClick?.(block, day, timeBlock)}
      className={cn(
        "min-h-20 rounded-lg border-2 p-3 text-left transition-all duration-200 cursor-pointer hover:shadow-md",
        colorClass
      )}
    >
      <div className="space-y-1">
        <div className="font-semibold text-sm line-clamp-1">
          {block.subjectId}
        </div>
        <div className="text-xs opacity-80 line-clamp-1">
          👨‍🏫 {block.teacherId}
        </div>
        {block.classroom && (
          <div className="text-xs opacity-70">🚪 {block.classroom}</div>
        )}
      </div>
    </button>
  );
}
