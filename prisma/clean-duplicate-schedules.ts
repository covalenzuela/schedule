/**
 * Script para limpiar schedules duplicados
 * Mantiene solo el schedule más reciente por curso/año académico
 */

import { prisma } from "../src/lib/prisma";

async function cleanDuplicateSchedules() {
  console.log("🧹 Iniciando limpieza de schedules duplicados...\n");

  try {
    // Obtener todos los cursos
    const courses = await prisma.course.findMany({
      select: { id: true, name: true },
    });

    let totalCleaned = 0;
    const currentYear = new Date().getFullYear();

    for (const course of courses) {
      // Buscar schedules activos para este curso en el año actual
      const schedules = await prisma.schedule.findMany({
        where: {
          courseId: course.id,
          academicYear: currentYear,
          isActive: true,
        },
        include: {
          blocks: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (schedules.length > 1) {
        console.log(`📚 Curso: ${course.name}`);
        console.log(`   Schedules encontrados: ${schedules.length}`);

        // Mantener el más reciente (primero en la lista)
        const [keepSchedule, ...duplicates] = schedules;

        console.log(
          `   ✅ Manteniendo: ${keepSchedule.name} (${keepSchedule.blocks.length} bloques)`
        );

        // Desactivar los duplicados
        for (const duplicate of duplicates) {
          await prisma.schedule.update({
            where: { id: duplicate.id },
            data: { isActive: false },
          });
          console.log(
            `   ❌ Desactivando: ${duplicate.name} (${duplicate.blocks.length} bloques)`
          );
          totalCleaned++;
        }
        console.log("");
      }
    }

    console.log(`\n✅ Limpieza completada!`);
    console.log(
      `   Total de schedules duplicados desactivados: ${totalCleaned}`
    );

    // Mostrar resumen final
    const activeSchedules = await prisma.schedule.count({
      where: { isActive: true, academicYear: currentYear },
    });
    console.log(
      `   Schedules activos restantes (${currentYear}): ${activeSchedules}`
    );
  } catch (error) {
    console.error("❌ Error durante la limpieza:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanDuplicateSchedules().catch((error) => {
  console.error("Error fatal:", error);
  process.exit(1);
});
