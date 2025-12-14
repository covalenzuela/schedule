/**
 * 🌱 Seed inicial para la base de datos
 *
 * Ejecutar con: npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });

const prisma = new PrismaClient({
  adapter,
  log: ["error"],
});

async function main() {
  console.log("🌱 Iniciando seed de la base de datos...");

  // Limpiar datos existentes
  await prisma.scheduleBlock.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.teacherSubject.deleteMany();
  await prisma.teacherAvailability.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.course.deleteMany();
  await prisma.school.deleteMany();

  // 🏫 Crear colegios
  const school1 = await prisma.school.create({
    data: {
      name: "Colegio San José",
      address: "Av. Principal 123, Santiago",
      phone: "+56 2 2345 6789",
      email: "contacto@sanjose.cl",
    },
  });

  const school2 = await prisma.school.create({
    data: {
      name: "Instituto Nacional",
      address: "Calle Central 456, Valparaíso",
      phone: "+56 32 234 5678",
      email: "info@institutonacional.cl",
    },
  });

  const school3 = await prisma.school.create({
    data: {
      name: "Liceo Técnico Industrial",
      address: "Av. Industrial 789, Concepción",
      phone: "+56 41 245 6789",
      email: "contacto@liceotecnico.cl",
    },
  });

  console.log("✅ Colegios creados");

  // 📚 Crear asignaturas para school1
  const matematicas = await prisma.subject.create({
    data: {
      schoolId: school1.id,
      name: "Matemáticas",
      code: "MAT101",
      description: "Matemáticas para educación básica",
      color: "#3aa6ff",
    },
  });

  const fisica = await prisma.subject.create({
    data: {
      schoolId: school1.id,
      name: "Física",
      code: "FIS201",
      description: "Física general",
      color: "#ff6ba8",
    },
  });

  const historia = await prisma.subject.create({
    data: {
      schoolId: school1.id,
      name: "Historia",
      code: "HIS301",
      description: "Historia de Chile",
      color: "#c084fc",
    },
  });

  const lenguaje = await prisma.subject.create({
    data: {
      schoolId: school1.id,
      name: "Lenguaje",
      code: "LEN101",
      description: "Lenguaje y Comunicación",
      color: "#4ade80",
    },
  });

  const quimica = await prisma.subject.create({
    data: {
      schoolId: school1.id,
      name: "Química",
      code: "QUI201",
      description: "Química general",
      color: "#fbbf24",
    },
  });

  const ingles = await prisma.subject.create({
    data: {
      schoolId: school1.id,
      name: "Inglés",
      code: "ING101",
      description: "Inglés básico",
      color: "#a3a3a3",
    },
  });

  console.log("✅ Asignaturas creadas");

  // 👨‍🏫 Crear profesores
  const mariaGonzalez = await prisma.teacher.create({
    data: {
      schoolId: school1.id,
      firstName: "María",
      lastName: "González",
      email: "maria.gonzalez@sanjose.cl",
      phone: "+56 9 1234 5678",
      specialization: "Matemáticas y Física",
    },
  });

  const pedroRamirez = await prisma.teacher.create({
    data: {
      schoolId: school1.id,
      firstName: "Pedro",
      lastName: "Ramírez",
      email: "pedro.ramirez@sanjose.cl",
      phone: "+56 9 2345 6789",
      specialization: "Historia",
    },
  });

  const anaTorres = await prisma.teacher.create({
    data: {
      schoolId: school1.id,
      firstName: "Ana",
      lastName: "Torres",
      email: "ana.torres@sanjose.cl",
      phone: "+56 9 3456 7890",
      specialization: "Lenguaje",
    },
  });

  const lauraFernandez = await prisma.teacher.create({
    data: {
      schoolId: school1.id,
      firstName: "Laura",
      lastName: "Fernández",
      email: "laura.fernandez@sanjose.cl",
      phone: "+56 9 4567 8901",
      specialization: "Química",
    },
  });

  const johnSmith = await prisma.teacher.create({
    data: {
      schoolId: school1.id,
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@sanjose.cl",
      phone: "+56 9 5678 9012",
      specialization: "Inglés",
    },
  });

  console.log("✅ Profesores creados");

  // 🕐 Crear disponibilidad para María González
  await prisma.teacherAvailability.createMany({
    data: [
      {
        teacherId: mariaGonzalez.id,
        dayOfWeek: "MONDAY",
        startTime: "08:00",
        endTime: "17:00",
      },
      {
        teacherId: mariaGonzalez.id,
        dayOfWeek: "TUESDAY",
        startTime: "08:00",
        endTime: "17:00",
      },
      {
        teacherId: mariaGonzalez.id,
        dayOfWeek: "WEDNESDAY",
        startTime: "08:00",
        endTime: "17:00",
      },
      {
        teacherId: mariaGonzalez.id,
        dayOfWeek: "THURSDAY",
        startTime: "08:00",
        endTime: "17:00",
      },
      {
        teacherId: mariaGonzalez.id,
        dayOfWeek: "FRIDAY",
        startTime: "08:00",
        endTime: "17:00",
      },
    ],
  });

  // Disponibilidad para Pedro Ramírez (Lunes a Jueves)
  await prisma.teacherAvailability.createMany({
    data: [
      {
        teacherId: pedroRamirez.id,
        dayOfWeek: "MONDAY",
        startTime: "09:00",
        endTime: "16:00",
      },
      {
        teacherId: pedroRamirez.id,
        dayOfWeek: "TUESDAY",
        startTime: "09:00",
        endTime: "16:00",
      },
      {
        teacherId: pedroRamirez.id,
        dayOfWeek: "WEDNESDAY",
        startTime: "09:00",
        endTime: "16:00",
      },
      {
        teacherId: pedroRamirez.id,
        dayOfWeek: "THURSDAY",
        startTime: "09:00",
        endTime: "16:00",
      },
    ],
  });

  // Disponibilidad para Ana Torres (Martes a Viernes)
  await prisma.teacherAvailability.createMany({
    data: [
      {
        teacherId: anaTorres.id,
        dayOfWeek: "TUESDAY",
        startTime: "08:30",
        endTime: "15:30",
      },
      {
        teacherId: anaTorres.id,
        dayOfWeek: "WEDNESDAY",
        startTime: "08:30",
        endTime: "15:30",
      },
      {
        teacherId: anaTorres.id,
        dayOfWeek: "THURSDAY",
        startTime: "08:30",
        endTime: "15:30",
      },
      {
        teacherId: anaTorres.id,
        dayOfWeek: "FRIDAY",
        startTime: "08:30",
        endTime: "15:30",
      },
    ],
  });

  console.log("✅ Disponibilidad de profesores creada");

  // 📚 Asignar asignaturas a profesores
  await prisma.teacherSubject.createMany({
    data: [
      { teacherId: mariaGonzalez.id, subjectId: matematicas.id },
      { teacherId: mariaGonzalez.id, subjectId: fisica.id },
      { teacherId: pedroRamirez.id, subjectId: historia.id },
      { teacherId: anaTorres.id, subjectId: lenguaje.id },
      { teacherId: lauraFernandez.id, subjectId: quimica.id },
      { teacherId: johnSmith.id, subjectId: ingles.id },
    ],
  });

  console.log("✅ Asignaturas asignadas a profesores");

  // 🎓 Crear cursos
  const curso1A = await prisma.course.create({
    data: {
      schoolId: school1.id,
      name: "1° Básico A",
      grade: "1",
      section: "A",
      academicLevel: "PRIMARY",
      academicYear: 2025,
      studentCount: 32,
    },
  });

  const curso1B = await prisma.course.create({
    data: {
      schoolId: school1.id,
      name: "1° Básico B",
      grade: "1",
      section: "B",
      academicLevel: "PRIMARY",
      academicYear: 2025,
      studentCount: 30,
    },
  });

  const curso2A = await prisma.course.create({
    data: {
      schoolId: school1.id,
      name: "2° Básico A",
      grade: "2",
      section: "A",
      academicLevel: "PRIMARY",
      academicYear: 2025,
      studentCount: 28,
    },
  });

  const curso3M_A = await prisma.course.create({
    data: {
      schoolId: school1.id,
      name: "3° Medio A",
      grade: "3",
      section: "A",
      academicLevel: "HIGH_SCHOOL",
      academicYear: 2025,
      studentCount: 35,
    },
  });

  console.log("✅ Cursos creados");

  // 🗓️ Crear horario para 1° Básico A
  const schedule1A = await prisma.schedule.create({
    data: {
      schoolId: school1.id,
      courseId: curso1A.id,
      name: "Horario 1° Básico A - Semestre 1",
      academicYear: 2025,
      semester: 1,
      startDate: new Date("2025-03-01"),
      endDate: new Date("2025-07-31"),
      isActive: true,
    },
  });

  // 📅 Crear bloques de horario para 1° Básico A
  await prisma.scheduleBlock.createMany({
    data: [
      // Lunes
      {
        scheduleId: schedule1A.id,
        courseId: curso1A.id,
        subjectId: matematicas.id,
        teacherId: mariaGonzalez.id,
        dayOfWeek: "MONDAY",
        blockNumber: 1,
        startTime: "08:00",
        endTime: "08:45",
        duration: 45,
        classroom: "Sala 101",
      },
      {
        scheduleId: schedule1A.id,
        courseId: curso1A.id,
        subjectId: lenguaje.id,
        teacherId: anaTorres.id,
        dayOfWeek: "MONDAY",
        blockNumber: 2,
        startTime: "08:45",
        endTime: "09:30",
        duration: 45,
        classroom: "Sala 101",
      },
      {
        scheduleId: schedule1A.id,
        courseId: curso1A.id,
        subjectId: historia.id,
        teacherId: pedroRamirez.id,
        dayOfWeek: "MONDAY",
        blockNumber: 4,
        startTime: "10:30",
        endTime: "11:15",
        duration: 45,
        classroom: "Sala 101",
      },
      // Martes
      {
        scheduleId: schedule1A.id,
        courseId: curso1A.id,
        subjectId: fisica.id,
        teacherId: mariaGonzalez.id,
        dayOfWeek: "TUESDAY",
        blockNumber: 1,
        startTime: "08:00",
        endTime: "08:45",
        duration: 45,
        classroom: "Lab. Ciencias",
      },
      {
        scheduleId: schedule1A.id,
        courseId: curso1A.id,
        subjectId: ingles.id,
        teacherId: johnSmith.id,
        dayOfWeek: "TUESDAY",
        blockNumber: 3,
        startTime: "09:45",
        endTime: "10:30",
        duration: 45,
        classroom: "Sala 101",
      },
      // Miércoles
      {
        scheduleId: schedule1A.id,
        courseId: curso1A.id,
        subjectId: matematicas.id,
        teacherId: mariaGonzalez.id,
        dayOfWeek: "WEDNESDAY",
        blockNumber: 2,
        startTime: "08:45",
        endTime: "09:30",
        duration: 45,
        classroom: "Sala 101",
      },
      {
        scheduleId: schedule1A.id,
        courseId: curso1A.id,
        subjectId: quimica.id,
        teacherId: lauraFernandez.id,
        dayOfWeek: "WEDNESDAY",
        blockNumber: 5,
        startTime: "11:30",
        endTime: "12:15",
        duration: 45,
        classroom: "Lab. Química",
      },
      // Jueves
      {
        scheduleId: schedule1A.id,
        courseId: curso1A.id,
        subjectId: lenguaje.id,
        teacherId: anaTorres.id,
        dayOfWeek: "THURSDAY",
        blockNumber: 1,
        startTime: "08:00",
        endTime: "08:45",
        duration: 45,
        classroom: "Sala 101",
      },
      {
        scheduleId: schedule1A.id,
        courseId: curso1A.id,
        subjectId: historia.id,
        teacherId: pedroRamirez.id,
        dayOfWeek: "THURSDAY",
        blockNumber: 4,
        startTime: "10:30",
        endTime: "11:15",
        duration: 45,
        classroom: "Sala 101",
      },
      // Viernes
      {
        scheduleId: schedule1A.id,
        courseId: curso1A.id,
        subjectId: matematicas.id,
        teacherId: mariaGonzalez.id,
        dayOfWeek: "FRIDAY",
        blockNumber: 3,
        startTime: "09:45",
        endTime: "10:30",
        duration: 45,
        classroom: "Sala 101",
      },
    ],
  });

  console.log("✅ Horarios y bloques creados");

  console.log("\n🎉 Seed completado exitosamente!");
  console.log(`\n📊 Resumen:`);
  console.log(`   - ${await prisma.school.count()} colegios`);
  console.log(`   - ${await prisma.teacher.count()} profesores`);
  console.log(`   - ${await prisma.subject.count()} asignaturas`);
  console.log(`   - ${await prisma.course.count()} cursos`);
  console.log(`   - ${await prisma.schedule.count()} horarios`);
  console.log(`   - ${await prisma.scheduleBlock.count()} bloques de horario`);
}

main()
  .catch((e) => {
    console.error("❌ Error al ejecutar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
