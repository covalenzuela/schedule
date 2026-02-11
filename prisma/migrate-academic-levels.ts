/**
 * Script de migración: Crear configuraciones por defecto para escuelas existentes
 * Y actualizar cursos con academicLevel
 */

import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🚀 Iniciando migración de datos...\n");

  // 1. Obtener todas las escuelas
  const schools = await prisma.school.findMany();
  console.log(`📚 Encontradas ${schools.length} escuelas\n`);

  // 2. Crear configuraciones por defecto para cada escuela
  for (const school of schools) {
    console.log(`🏫 Procesando: ${school.name}`);

    // Configuración para BÁSICA (1° a 8°)
    const basicConfig = await prisma.scheduleLevelConfig.upsert({
      where: {
        schoolId_academicLevel: {
          schoolId: school.id,
          academicLevel: "BASIC",
        },
      },
      create: {
        schoolId: school.id,
        academicLevel: "BASIC",
        startTime: "08:00",
        endTime: "17:00",
        blockDuration: 45,
        breaks: JSON.stringify([
          { afterBlock: 2, duration: 15, name: "Recreo" },
          { afterBlock: 4, duration: 15, name: "Recreo" },
          { afterBlock: 6, duration: 45, name: "Almuerzo" },
        ]),
      },
      update: {},
    });
    console.log(`  ✅ Config BÁSICA creada/actualizada`);

    // Configuración para MEDIA (1° a 4°)
    const middleConfig = await prisma.scheduleLevelConfig.upsert({
      where: {
        schoolId_academicLevel: {
          schoolId: school.id,
          academicLevel: "MIDDLE",
        },
      },
      create: {
        schoolId: school.id,
        academicLevel: "MIDDLE",
        startTime: "08:00",
        endTime: "18:00",
        blockDuration: 90,
        breaks: JSON.stringify([
          { afterBlock: 2, duration: 15, name: "Recreo" },
          { afterBlock: 4, duration: 45, name: "Almuerzo" },
          { afterBlock: 6, duration: 15, name: "Recreo" },
        ]),
      },
      update: {},
    });
    console.log(`  ✅ Config MEDIA creada/actualizada\n`);
  }

  // 3. Actualizar cursos existentes con academicLevel
  console.log("📝 Actualizando cursos con academicLevel...\n");

  const courses = await prisma.course.findMany();

  for (const course of courses) {
    // Determinar nivel según el nombre o grado
    let academicLevel = "BASIC";

    // Si el curso menciona "Medio" o "III" o "IV" -> MIDDLE
    if (
      course.name.toLowerCase().includes("medio") ||
      course.name.toLowerCase().includes("iii") ||
      course.name.toLowerCase().includes("iv") ||
      ["9", "10", "11", "12"].includes(course.grade)
    ) {
      academicLevel = "MIDDLE";
    }

    await prisma.course.update({
      where: { id: course.id },
      data: { academicLevel },
    });

    console.log(`  📌 ${course.name} -> ${academicLevel}`);
  }

  console.log(`\n✅ Migración completada!\n`);
  console.log(`📊 Resumen:`);
  console.log(`   - ${schools.length} escuelas configuradas`);
  console.log(`   - ${courses.length} cursos actualizados`);
}

main().catch((e) => {
  console.error("❌ Error en la migración:", e);
  process.exit(1);
});
