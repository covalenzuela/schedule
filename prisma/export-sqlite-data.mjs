/**
 * 📦 Exportar datos de SQLite
 */

import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function main() {
  try {
    log("\n📦 Exportando datos de SQLite...", colors.blue);

    // Crear conexión a SQLite
    const db = new Database("prisma/dev.db", { readonly: true });
    const adapter = new PrismaBetterSqlite3(db);
    const prisma = new PrismaClient({ adapter });

    const data = {
      users: await prisma.user.findMany({ include: { schools: true } }),
      schools: await prisma.school.findMany(),
      teachers: await prisma.teacher.findMany({
        include: {
          availability: true,
          teacherSubjects: true,
        },
      }),
      subjects: await prisma.subject.findMany({
        include: {
          teacherSubjects: true,
        },
      }),
      courses: await prisma.course.findMany(),
      schedules: await prisma.schedule.findMany({ include: { blocks: true } }),
    };

    await prisma.$disconnect();
    db.close();

    // Guardar datos
    const backupPath = path.join(process.cwd(), "backup-data.json");
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));

    log(`\n✅ Datos exportados exitosamente!`, colors.green);
    log(`   Archivo: ${backupPath}`, colors.green);
    log(`   - ${data.users.length} usuarios`, colors.green);
    log(`   - ${data.schools.length} colegios`, colors.green);
    log(`   - ${data.teachers.length} profesores`, colors.green);
    log(`   - ${data.subjects.length} asignaturas`, colors.green);
    log(`   - ${data.courses.length} cursos`, colors.green);
    log(`   - ${data.schedules.length} horarios\n`, colors.green);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();
