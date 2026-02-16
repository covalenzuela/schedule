import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function resolveIdFromContext(context?: { params?: any } | Promise<{ params?: any }>) {
  try {
    const p = (context as any)?.params;
    const params = p && typeof p.then === "function" ? await p : p;
    return params?.id;
  } catch (e) {
    return undefined;
  }
}

export async function DELETE(request: NextRequest, context: any) {
  try {
    const id = await resolveIdFromContext(context);
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await prisma.student.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json(
      { error: "Error al eliminar el alumno" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, context: any) {
  try {
    const id = await resolveIdFromContext(context);
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({ where: { id } ,
      include: {
        course: {
          include: {
            school: true,
          },
        },
        courseHistory: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Alumno no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { error: "Error al obtener el alumno" },
      { status: 500 }
    );
  }
}
