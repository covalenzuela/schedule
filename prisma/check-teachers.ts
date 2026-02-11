import { prisma } from "../src/lib/prisma";

async function checkTeachers() {
  try {
    const teachers = await prisma.teacher.findMany({
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      include: {
        school: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            scheduleBlocks: true,
          },
        },
      },
    });

    console.log("\n=== PROFESORES EN LA BASE DE DATOS ===\n");
    console.log(`Total de profesores: ${teachers.length}\n`);

    teachers.forEach((teacher, index) => {
      console.log(`${index + 1}. ${teacher.firstName} ${teacher.lastName}`);
      console.log(`   ID: ${teacher.id}`);
      console.log(`   Email: ${teacher.email}`);
      console.log(`   Colegio: ${teacher.school.name}`);
      console.log(`   Bloques asignados: ${teacher._count.scheduleBlocks}`);
      console.log("");
    });

    // Buscar posibles duplicados (mismo nombre)
    const nameGroups = new Map<string, typeof teachers>();
    teachers.forEach((teacher) => {
      const fullName = `${teacher.firstName} ${teacher.lastName}`.toLowerCase();
      if (!nameGroups.has(fullName)) {
        nameGroups.set(fullName, []);
      }
      nameGroups.get(fullName)!.push(teacher);
    });

    const duplicates = Array.from(nameGroups.entries()).filter(
      ([_, group]) => group.length > 1
    );

    if (duplicates.length > 0) {
      console.log("\n⚠️  POSIBLES DUPLICADOS DETECTADOS:\n");
      duplicates.forEach(([name, group]) => {
        console.log(`Nombre: ${name}`);
        group.forEach((teacher) => {
          console.log(
            `  - ID: ${teacher.id}, Bloques: ${teacher._count.scheduleBlocks}`
          );
        });
        console.log("");
      });
    } else {
      console.log("✅ No se detectaron duplicados\n");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTeachers();
