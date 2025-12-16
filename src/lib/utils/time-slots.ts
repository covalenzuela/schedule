/**
 * 🕐 Time Slot Generation Utilities
 * Generación de slots de tiempo con recreos explícitos
 */

import type { ScheduleLevelConfig, TimeSlot } from '@/types/schedule-config';

/**
 * Genera slots de tiempo incluyendo bloques y recreos explícitos
 * 
 * @param config - Configuración del nivel académico
 * @returns Array de TimeSlots con bloques y recreos
 * 
 * Ejemplo de salida:
 * [
 *   { time: '08:00', endTime: '08:45', type: 'block', blockNumber: 1 },
 *   { time: '08:45', endTime: '09:30', type: 'block', blockNumber: 2 },
 *   { time: '09:30', endTime: '09:45', type: 'break', breakName: 'Recreo' },
 *   { time: '09:45', endTime: '10:30', type: 'block', blockNumber: 3 },
 *   ...
 * ]
 */
export function generateTimeSlotsWithBreaks(config: ScheduleLevelConfig): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  // Convertir tiempos a minutos
  const [startHour, startMin] = config.startTime.split(':').map(Number);
  const [endHour, endMin] = config.endTime.split(':').map(Number);
  
  let currentMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  let blockNumber = 1;

  // Crear mapa de recreos por número de bloque
  const breakMap = new Map<number, { duration: number; name: string }>();
  config.breaks.forEach(breakConfig => {
    breakMap.set(breakConfig.afterBlock, {
      duration: breakConfig.duration,
      name: breakConfig.name,
    });
  });

  while (currentMinutes < endMinutes) {
    // Agregar bloque
    const blockStart = minutesToTime(currentMinutes);
    const blockEnd = minutesToTime(currentMinutes + config.blockDuration);
    
    slots.push({
      time: blockStart,
      endTime: blockEnd,
      type: 'block',
      blockNumber,
    });
    
    currentMinutes += config.blockDuration;
    
    // Verificar si hay recreo después de este bloque
    const breakAfter = breakMap.get(blockNumber);
    if (breakAfter && currentMinutes < endMinutes) {
      const breakStart = minutesToTime(currentMinutes);
      const breakEnd = minutesToTime(currentMinutes + breakAfter.duration);
      
      slots.push({
        time: breakStart,
        endTime: breakEnd,
        type: 'break',
        breakName: breakAfter.name,
      });
      
      currentMinutes += breakAfter.duration;
    }
    
    blockNumber++;
    
    // Prevenir loops infinitos
    if (blockNumber > 20) {
      console.warn('[generateTimeSlotsWithBreaks] Demasiados bloques generados, deteniendo');
      break;
    }
  }

  return slots;
}

/**
 * Convierte minutos desde medianoche a formato HH:mm
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Convierte formato HH:mm a minutos desde medianoche
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Verifica si dos rangos de tiempo se solapan
 */
export function timesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const start1Min = timeToMinutes(start1);
  const end1Min = timeToMinutes(end1);
  const start2Min = timeToMinutes(start2);
  const end2Min = timeToMinutes(end2);
  
  return start1Min < end2Min && end1Min > start2Min;
}

/**
 * Calcula la duración en minutos entre dos tiempos
 */
export function calculateDuration(startTime: string, endTime: string): number {
  return timeToMinutes(endTime) - timeToMinutes(startTime);
}
