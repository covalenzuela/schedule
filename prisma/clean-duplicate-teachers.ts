import { prisma } from "../src/lib/prisma";

async function cleanDuplicateTeachers() {
  try {
    console.log("\n🔍 Buscando profesores duplicados...\n");

    // Obtener todos los profesores con sus datos
    const teachers = await prisma.teacher.findMany({
      include: {
        school: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            scheduleBlocks: true,
            availability: true,
            teacherSubjects: true,
          },
        },
      },
    });

    // Agrupar por nombre completo y schoolId
    const groups = new Map<string, typeof teachers>();
    teachers.forEach((teacher) => {
      const key = `${teacher.firstName.toLowerCase()}|${teacher.lastName.toLowerCase()}|${
        teacher.schoolId
      }`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(teacher);
    });

    // Identificar duplicados
    const duplicateGroups = Array.from(groups.entries()).filter(
      ([_, group]) => group.length > 1
    );

    if (duplicateGroups.length === 0) {
      console.log("✅ No se encontraron duplicados\n");
      return;
    }

    console.log(
      `⚠️  Encontrados ${duplicateGroups.length} grupos de duplicados:\n`
    );

    for (const [key, group] of duplicateGroups) {
      const [firstName, lastName, schoolId] = key.split("|");
      console.log(`\n👤 ${firstName} ${lastName} (${group[0].school.name})`);
      console.log("   Duplicados encontrados:");

      // Ordenar: mantener el que tiene más datos (bloques, disponibilidad, materias)
      const sorted = group.sort((a, b) => {
        const scoreA =
          a._count.scheduleBlocks * 10 +
          a._count.availability * 5 +
          a._count.teacherSubjects * 3;
        const scoreB =
          b._count.scheduleBlocks * 10 +
          b._count.availability * 5 +
          b._count.teacherSubjects * 3;
        return scoreB - scoreA; // Descendente
      });

      const keepTeacher = sorted[0];
      const deleteTeachers = sorted.slice(1);

      console.log(`   ✅ MANTENER: ID ${keepTeacher.id}`);
      console.log(`      - Bloques: ${keepTeacher._count.scheduleBlocks}`);
      console.log(`      - Disponibilidad: ${keepTeacher._count.availability}`);
      console.log(`      - Materias: ${keepTeacher._count.teacherSubjects}`);
      console.log(`      - Email: ${keepTeacher.email}`);

      for (const teacher of deleteTeachers) {
        console.log(`   🗑️  ELIMINAR: ID ${teacher.id}`);
        console.log(`      - Bloques: ${teacher._count.scheduleBlocks}`);
        console.log(`      - Disponibilidad: ${teacher._count.availability}`);
        console.log(`      - Materias: ${teacher._count.teacherSubjects}`);
        console.log(`      - Email: ${teacher.email}`);

        // Si el duplicado tiene bloques, reasignarlos al profesor principal
        if (teacher._count.scheduleBlocks > 0) {
          console.log(
            `      ⚠️  Reasignando ${teacher._count.scheduleBlocks} bloques al profesor principal...`
          );
          await prisma.scheduleBlock.updateMany({
            where: { teacherId: teacher.id },
            data: { teacherId: keepTeacher.id },
          });
        }

        // Eliminar disponibilidad
        if (teacher._count.availability > 0) {
          await prisma.teacherAvailability.deleteMany({
            where: { teacherId: teacher.id },
          });
        }

        // Eliminar relaciones con materias
        if (teacher._count.teacherSubjects > 0) {
          await prisma.teacherSubject.deleteMany({
            where: { teacherId: teacher.id },
          });
        }

        // Eliminar el profesor duplicado
        await prisma.teacher.delete({
          where: { id: teacher.id },
        });

        console.log(`      ✅ Eliminado exitosamente`);
      }
    }

    console.log("\n✅ Limpieza completada!\n");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDuplicateTeachers();
