/**
 * 🔍 Script para verificar que el campo activeAcademicLevels existe en Prisma Client
 */

import { prisma } from "../src/lib/prisma";

async function verifyPrismaClient() {
  console.log("🔍 Verificando cliente de Prisma...\n");

  try {
    // Intentar obtener la primera escuela con el campo activeAcademicLevels
    const school = await prisma.school.findFirst({
      select: {
        id: true,
        name: true,
        activeAcademicLevels: true,
      },
    });

    if (school) {
      console.log("✅ Campo activeAcademicLevels disponible en Prisma Client");
      console.log(`   Colegio: ${school.name}`);
      console.log(`   Niveles activos: ${school.activeAcademicLevels}`);
      console.log();
    } else {
      console.log("⚠️  No hay colegios en la base de datos para verificar");
    }

    // Verificar que el tipo está correcto
    const schoolWithAllFields = await prisma.school.findFirst();
    if (schoolWithAllFields) {
      const hasField = "activeAcademicLevels" in schoolWithAllFields;
      if (hasField) {
        console.log("✅ El campo existe en el tipo TypeScript del cliente");
      } else {
        console.log("❌ El campo NO existe en el tipo TypeScript");
        console.log("   Ejecuta: npm run fix-prisma-cache.sh");
      }
    }

    console.log("\n✅ Verificación completada exitosamente");
  } catch (error: any) {
    console.error("❌ Error al verificar cliente de Prisma:");
    console.error(error.message);
    console.log("\n💡 Solución:");
    console.log("   1. Ejecuta: ./fix-prisma-cache.sh");
    console.log("   2. Reinicia el servidor de desarrollo");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyPrismaClient();
