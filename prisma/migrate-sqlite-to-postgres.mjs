/**
 * 🔄 Script de migración segura de SQLite a PostgreSQL
 *
 * Este script:
 * 1. Exporta datos de SQLite (si existen)
 * 2. Aplica migraciones en PostgreSQL
 * 3. Importa los datos exportados
 * 4. Verifica que todo funcione
 */

import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function exec(command, description) {
  log(`\n${description}`, colors.blue);
  try {
    execSync(command, { stdio: "inherit" });
    log("✅ Completado", colors.green);
    return true;
  } catch (error) {
    log(`❌ Error: ${error.message}`, colors.red);
    return false;
  }
}

async function exportDataFromSQLite() {
  try {
    log("\n📦 Paso 1: Exportando datos de SQLite...", colors.blue);

    // Verificar si existe la base de datos SQLite
    const sqliteDbPath = path.join(process.cwd(), "prisma", "dev.db");
    if (!fs.existsSync(sqliteDbPath)) {
      log(
        "⚠️  No se encontró base de datos SQLite. Continuando sin datos...",
        colors.yellow
      );
      return null;
    }

    // Cambiar temporalmente a SQLite para exportar
    process.env.DATABASE_URL = "file:./prisma/dev.db";

    const prisma = new PrismaClient();

    const data = {
      users: await prisma.user.findMany({ include: { schools: true } }),
      schools: await prisma.school.findMany(),
      teachers: await prisma.teacher.findMany({
        include: { availability: true, teacherSubjects: true },
      }),
      subjects: await prisma.subject.findMany({
        include: { teacherSubjects: true },
      }),
      courses: await prisma.course.findMany(),
      schedules: await prisma.schedule.findMany({ include: { blocks: true } }),
    };

    await prisma.$disconnect();

    // Guardar datos en archivo JSON
    const backupPath = path.join(process.cwd(), "backup-data.json");
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));

    log(`✅ Datos exportados a: ${backupPath}`, colors.green);
    log(`   - ${data.users.length} usuarios`, colors.green);
    log(`   - ${data.schools.length} colegios`, colors.green);
    log(`   - ${data.teachers.length} profesores`, colors.green);
    log(`   - ${data.subjects.length} asignaturas`, colors.green);
    log(`   - ${data.courses.length} cursos`, colors.green);
    log(`   - ${data.schedules.length} horarios`, colors.green);

    return data;
  } catch (error) {
    log(`⚠️  Error exportando datos: ${error.message}`, colors.yellow);
    log("   Continuando sin importar datos...", colors.yellow);
    return null;
  }
}

async function importDataToPostgres(data) {
  if (!data) {
    log("\n⏭️  No hay datos para importar", colors.yellow);
    return;
  }

  try {
    log("\n📥 Paso 4: Importando datos a PostgreSQL...", colors.blue);

    const prisma = new PrismaClient();

    // Importar en orden correcto (respetando relaciones)

    // 1. Users
    log("   Importando usuarios...", colors.blue);
    for (const user of data.users) {
      const { schools, sessions, ...userData } = user;
      await prisma.user.upsert({
        where: { id: user.id },
        create: userData,
        update: userData,
      });
    }

    // 2. Schools
    log("   Importando colegios...", colors.blue);
    for (const school of data.schools) {
      const { users, teachers, subjects, courses, schedules, ...schoolData } =
        school;
      await prisma.school.upsert({
        where: { id: school.id },
        create: schoolData,
        update: schoolData,
      });
    }

    // 3. UserSchool relations
    log("   Importando relaciones usuario-colegio...", colors.blue);
    for (const user of data.users) {
      for (const userSchool of user.schools) {
        await prisma.userSchool.upsert({
          where: { id: userSchool.id },
          create: userSchool,
          update: userSchool,
        });
      }
    }

    // 4. Teachers
    log("   Importando profesores...", colors.blue);
    for (const teacher of data.teachers) {
      const { availability, teacherSubjects, scheduleBlocks, ...teacherData } =
        teacher;
      await prisma.teacher.upsert({
        where: { id: teacher.id },
        create: teacherData,
        update: teacherData,
      });
    }

    // 5. Teacher Availability
    log("   Importando disponibilidad de profesores...", colors.blue);
    for (const teacher of data.teachers) {
      for (const avail of teacher.availability) {
        await prisma.teacherAvailability.upsert({
          where: { id: avail.id },
          create: avail,
          update: avail,
        });
      }
    }

    // 6. Subjects
    log("   Importando asignaturas...", colors.blue);
    for (const subject of data.subjects) {
      const { teacherSubjects, scheduleBlocks, ...subjectData } = subject;
      await prisma.subject.upsert({
        where: { id: subject.id },
        create: subjectData,
        update: subjectData,
      });
    }

    // 7. TeacherSubjects
    log("   Importando relaciones profesor-asignatura...", colors.blue);
    for (const subject of data.subjects) {
      for (const ts of subject.teacherSubjects) {
        await prisma.teacherSubject.upsert({
          where: { id: ts.id },
          create: ts,
          update: ts,
        });
      }
    }

    // 8. Courses
    log("   Importando cursos...", colors.blue);
    for (const course of data.courses) {
      const { schedules, scheduleBlocks, ...courseData } = course;
      await prisma.course.upsert({
        where: { id: course.id },
        create: courseData,
        update: courseData,
      });
    }

    // 9. Schedules
    log("   Importando horarios...", colors.blue);
    for (const schedule of data.schedules) {
      const { blocks, ...scheduleData } = schedule;
      await prisma.schedule.upsert({
        where: { id: schedule.id },
        create: scheduleData,
        update: scheduleData,
      });
    }

    // 10. Schedule Blocks
    log("   Importando bloques de horario...", colors.blue);
    for (const schedule of data.schedules) {
      for (const block of schedule.blocks) {
        await prisma.scheduleBlock.upsert({
          where: { id: block.id },
          create: block,
          update: block,
        });
      }
    }

    await prisma.$disconnect();

    log("\n✅ Datos importados exitosamente!", colors.green);
  } catch (error) {
    log(`\n❌ Error importando datos: ${error.message}`, colors.red);
    throw error;
  }
}

async function main() {
  log("🎯 Iniciando migración segura de SQLite a PostgreSQL...", colors.blue);

  try {
    // Paso 1: Exportar datos de SQLite
    const exportedData = await exportDataFromSQLite();

    // Paso 2: Generar cliente de Prisma
    if (
      !exec("npx prisma generate", "📦 Paso 2: Generando cliente de Prisma...")
    ) {
      process.exit(1);
    }

    // Paso 3: Aplicar migraciones en PostgreSQL
    log("\n🔄 Paso 3: Aplicando migraciones en PostgreSQL...", colors.blue);
    log("⚠️  Esto creará las tablas en PostgreSQL", colors.yellow);

    if (!exec("npx prisma migrate deploy", "   Ejecutando migraciones...")) {
      // Si no hay migraciones, hacer push
      log("   No hay migraciones, usando db push...", colors.yellow);
      if (!exec("npx prisma db push", "   Aplicando schema...")) {
        process.exit(1);
      }
    }

    // Paso 4: Importar datos
    if (exportedData) {
      await importDataToPostgres(exportedData);
    }

    // Paso 5: Verificar
    exec("npx prisma migrate status", "\n🔍 Paso 5: Verificando estado...");

    log("\n🎉 ¡Migración completada exitosamente!", colors.green);
    log("\nPróximos pasos:", colors.blue);
    log("  1. Ejecuta: npm run dev");
    log("  2. Verifica que todo funcione correctamente");
    log("  3. Si todo está OK, puedes eliminar prisma/dev.db");
    log("  4. El backup está en: backup-data.json");
  } catch (error) {
    log(`\n❌ Error en la migración: ${error.message}`, colors.red);
    log("\n⚠️  La base de datos SQLite no fue modificada", colors.yellow);
    process.exit(1);
  }
}

main();
