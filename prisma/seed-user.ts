/**
 * 👤 Script para crear un usuario demo
 * Ejecutar con: npm run seed:user
 */

import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hash } from "bcryptjs";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });

const prisma = new PrismaClient({
  adapter,
  log: ["error"],
});

async function main() {
  console.log("👤 Creando usuario demo...");

  const password = await hash("demo1234", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@bbschedule.com" },
    update: {},
    create: {
      name: "Usuario Demo",
      email: "demo@bbschedule.com",
      password: password,
      role: "admin",
    },
  });

  console.log("✅ Usuario demo creado:");
  console.log("   Email: demo@bbschedule.com");
  console.log("   Password: demo1234");
  console.log("   Role:", user.role);

  // Relacionar usuario con los colegios existentes
  const schools = await prisma.school.findMany();

  for (const school of schools) {
    await prisma.userSchool.upsert({
      where: {
        userId_schoolId: {
          userId: user.id,
          schoolId: school.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        schoolId: school.id,
        role: "admin",
      },
    });
  }

  console.log(`✅ Usuario vinculado a ${schools.length} colegios`);
  console.log("\n🎉 Seed de usuario completado!");
}

main()
  .catch((e) => {
    console.error("❌ Error al ejecutar seed de usuario:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
