/**
 * 🔍 Script para verificar la integridad de los datos
 *
 * Verifica que todos los datos estén correctamente asociados a usuarios
 *
 * Ejecutar con: npx tsx prisma/check-data-integrity.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./prisma/dev.db",
});

const prisma = new PrismaClient({
  adapter,
  log: ["error"],
});

async function main() {
  console.log("🔍 Verificando integridad de datos...\n");

  // Verificar usuarios
  const userCount = await prisma.user.count();
  console.log(`👤 Usuarios registrados: ${userCount}`);

  // Verificar escuelas
  const schoolCount = await prisma.school.count();
  console.log(`🏫 Escuelas totales: ${schoolCount}`);

  // Verificar escuelas con usuarios
  const schoolsWithUsers = await prisma.school.findMany({
    include: {
      users: {
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          teachers: true,
          subjects: true,
          courses: true,
        },
      },
    },
  });

  console.log("\n📊 Desglose de escuelas:\n");

  for (const school of schoolsWithUsers) {
    console.log(`🏫 ${school.name}`);
    console.log(`   ID: ${school.id}`);
    console.log(`   Usuarios asociados: ${school.users.length}`);
    school.users.forEach((us) => {
      console.log(`      - ${us.user.email} (${us.role})`);
    });
    console.log(`   👨‍🏫 Profesores: ${school._count.teachers}`);
    console.log(`   📚 Asignaturas: ${school._count.subjects}`);
    console.log(`   🎓 Cursos: ${school._count.courses}`);
    console.log("");
  }

  // Verificar escuelas huérfanas
  const orphanSchools = await prisma.school.findMany({
    where: {
      users: {
        none: {},
      },
    },
  });

  if (orphanSchools.length > 0) {
    console.log(`⚠️  ESCUELAS SIN USUARIOS (${orphanSchools.length}):`);
    orphanSchools.forEach((school) => {
      console.log(`   - ${school.name} (ID: ${school.id})`);
    });
    console.log("\n⚡ Ejecuta el script clean-orphan-data.ts para eliminarlas");
  }

  // Verificar profesores
  const teacherCount = await prisma.teacher.count();
  console.log(`\n👨‍🏫 Profesores totales: ${teacherCount}`);

  // Verificar asignaturas
  const subjectCount = await prisma.subject.count();
  console.log(`📚 Asignaturas totales: ${subjectCount}`);

  // Verificar cursos
  const courseCount = await prisma.course.count();
  console.log(`🎓 Cursos totales: ${courseCount}`);

  console.log("\n✅ Verificación completada");
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error durante la verificación:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
