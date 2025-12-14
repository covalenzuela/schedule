/**
 * 🧹 Script para limpiar datos huérfanos (sin usuario asociado)
 *
 * Este script elimina escuelas que no tienen ningún usuario asociado en UserSchool.
 * Útil para limpiar datos de seed que fueron creados sin asociar a usuarios.
 *
 * Ejecutar con: npx tsx prisma/clean-orphan-data.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./prisma/dev.db",
});

const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});

async function main() {
  console.log("🧹 Limpiando datos huérfanos...\n");

  // Encontrar escuelas sin usuarios asociados
  const orphanSchools = await prisma.school.findMany({
    where: {
      users: {
        none: {},
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (orphanSchools.length === 0) {
    console.log("✅ No se encontraron escuelas huérfanas. ¡Todo está bien!");
    return;
  }

  console.log(
    `⚠️  Se encontraron ${orphanSchools.length} escuelas sin usuarios:`
  );
  orphanSchools.forEach((school) => {
    console.log(`   - ${school.name} (ID: ${school.id})`);
  });

  console.log(
    "\n🗑️  Eliminando escuelas huérfanas y todos sus datos relacionados..."
  );

  // Eliminar escuelas huérfanas (esto eliminará en cascada todos los datos relacionados)
  const deleteResult = await prisma.school.deleteMany({
    where: {
      users: {
        none: {},
      },
    },
  });

  console.log(
    `✅ Se eliminaron ${deleteResult.count} escuelas y todos sus datos relacionados.`
  );
  console.log("\nDatos eliminados incluyen:");
  console.log("   - Profesores de estas escuelas");
  console.log("   - Asignaturas de estas escuelas");
  console.log("   - Cursos de estas escuelas");
  console.log("   - Horarios de estas escuelas");
  console.log("   - Todos los datos relacionados\n");
}

main()
  .then(() => {
    console.log("✅ Limpieza completada exitosamente");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error durante la limpieza:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
