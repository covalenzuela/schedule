"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

/**
 * Obtener días especiales de un colegio
 */
export async function getSpecialDays(schoolId: string, year?: number) {
  try {
    const session = await getSession();
    if (!session?.id) {
      throw new Error("No autorizado");
    }

    const currentYear = year || new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);

    const specialDays = await prisma.specialDay.findMany({
      where: {
        schoolId,
        isActive: true,
        OR: [
          {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            recurring: true,
          },
        ],
      },
      orderBy: {
        date: "asc",
      },
    });

    return specialDays;
  } catch (error) {
    console.error("[getSpecialDays] Error:", error);
    throw error;
  }
}

/**
 * Importar feriados nacionales desde un archivo JSON (por año)
 */
export async function importNationalHolidays(schoolId: string, year: number) {
  try {
    const session = await getSession();
    if (!session?.id) throw new Error("No autorizado");

    // Cargar datos locales
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const holidays = require("./data/chile-holidays-2026.json") as Array<{
      date: string;
      name: string;
      type: string;
      description?: string;
    }>;

    const toCreate = holidays.filter((h) => new Date(h.date).getFullYear() === year);

    for (const h of toCreate) {
      const date = new Date(h.date);
      // Evitar duplicados
      const exists = await prisma.specialDay.findFirst({
        where: {
          schoolId,
          date,
          name: h.name,
        },
      });

      if (!exists) {
        await prisma.specialDay.create({
          data: {
            schoolId,
            date,
            name: h.name,
            type: h.type as any,
            description: h.description || undefined,
            recurring: false,
            isActive: true,
          },
        });
      }
    }

    revalidatePath("/attendance");
    revalidatePath("/settings");
  } catch (error) {
    console.error("[importNationalHolidays] Error:", error);
    throw error;
  }
}

/**
 * Generar o eliminar entradas de fines de semana para un año específico
 */
export async function toggleWeekendBlocking(schoolId: string, year: number, enable: boolean) {
  try {
    const session = await getSession();
    if (!session?.id) throw new Error("No autorizado");

    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);

    if (enable) {
      // Crear un entry por cada sábado y domingo
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dow = d.getDay();
        if (dow === 0 || dow === 6) {
          const date = new Date(d);
          // evitar duplicados
          const exists = await prisma.specialDay.findFirst({
            where: { schoolId, date, name: "Fin de semana" },
          });
          if (!exists) {
            await prisma.specialDay.create({
              data: {
                schoolId,
                date,
                name: "Fin de semana",
                type: "no_attendance",
                description: "Cierre automático de fin de semana",
                recurring: false,
                isActive: true,
              },
            });
          }
        }
      }
    } else {
      // Eliminar entradas del año creadas como 'Fin de semana'
      await prisma.specialDay.deleteMany({
        where: {
          schoolId,
          name: "Fin de semana",
          date: {
            gte: start,
            lte: end,
          },
        },
      });
    }

    revalidatePath("/attendance");
    revalidatePath("/settings");
  } catch (error) {
    console.error("[toggleWeekendBlocking] Error:", error);
    throw error;
  }
}

/**
 * Crear un día especial
 */
export async function createSpecialDay(data: {
  schoolId: string;
  date: Date;
  name: string;
  type: "holiday" | "school_event" | "no_attendance" | "other";
  description?: string;
  recurring?: boolean;
}) {
  try {
    const session = await getSession();
    if (!session?.id) {
      throw new Error("No autorizado");
    }

    const specialDay = await prisma.specialDay.create({
      data: {
        ...data,
        recurring: data.recurring || false,
      },
    });

    revalidatePath("/attendance");
    revalidatePath("/settings");
    return specialDay;
  } catch (error) {
    console.error("[createSpecialDay] Error:", error);
    throw error;
  }
}

/**
 * Actualizar un día especial
 */
export async function updateSpecialDay(
  id: string,
  data: {
    name?: string;
    type?: "holiday" | "school_event" | "no_attendance" | "other";
    description?: string;
    recurring?: boolean;
    isActive?: boolean;
  }
) {
  try {
    const session = await getSession();
    if (!session?.id) {
      throw new Error("No autorizado");
    }

    const specialDay = await prisma.specialDay.update({
      where: { id },
      data,
    });

    revalidatePath("/attendance");
    revalidatePath("/settings");
    return specialDay;
  } catch (error) {
    console.error("[updateSpecialDay] Error:", error);
    throw error;
  }
}

/**
 * Eliminar un día especial
 */
export async function deleteSpecialDay(id: string) {
  try {
    const session = await getSession();
    if (!session?.id) {
      throw new Error("No autorizado");
    }

    await prisma.specialDay.delete({
      where: { id },
    });

    revalidatePath("/attendance");
    revalidatePath("/settings");
  } catch (error) {
    console.error("[deleteSpecialDay] Error:", error);
    throw error;
  }
}

/**
 * Verificar si una fecha es un día especial
 */
export async function isSpecialDay(schoolId: string, date: Date): Promise<{
  isSpecial: boolean;
  specialDay?: any;
}> {
  try {
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    const specialDay = await prisma.specialDay.findFirst({
      where: {
        schoolId,
        isActive: true,
        OR: [
          {
            date: {
              gte: dateStart,
              lte: dateEnd,
            },
          },
          {
            AND: [
              { recurring: true },
              // Para días recurrentes, comparar solo mes y día
              {
                date: {
                  gte: new Date(2000, date.getMonth(), date.getDate()),
                  lt: new Date(2000, date.getMonth(), date.getDate() + 1),
                },
              },
            ],
          },
        ],
      },
    });

    return {
      isSpecial: !!specialDay,
      specialDay,
    };
  } catch (error) {
    console.error("[isSpecialDay] Error:", error);
    return { isSpecial: false };
  }
}

/**
 * Obtener días especiales en un rango de fechas
 */
export async function getSpecialDaysInRange(
  schoolId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const session = await getSession();
    if (!session?.id) {
      throw new Error("No autorizado");
    }

    const specialDays = await prisma.specialDay.findMany({
      where: {
        schoolId,
        isActive: true,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    // También buscar días recurrentes
    const recurringDays = await prisma.specialDay.findMany({
      where: {
        schoolId,
        isActive: true,
        recurring: true,
      },
    });

    // Filtrar días recurrentes que caigan en el rango
    const relevantRecurring = recurringDays.filter((day: any) => {
      const month = new Date(day.date).getMonth();
      const date = new Date(day.date).getDate();

      // Verificar si este mes/día cae dentro del rango
      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        if (d.getMonth() === month && d.getDate() === date) {
          return true;
        }
      }
      return false;
    });

    return [...specialDays, ...relevantRecurring];
  } catch (error) {
    console.error("[getSpecialDaysInRange] Error:", error);
    throw error;
  }
}
