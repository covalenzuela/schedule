import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const students = await prisma.student.findMany({
      include: {
        course: {
          include: {
            school: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { course: { school: { name: 'asc' } } },
        { course: { name: 'asc' } },
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Error al obtener los alumnos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const student = await prisma.student.create({
      data: body,
      include: {
        course: {
          include: {
            school: true,
          },
        },
      },
    });

    return NextResponse.json(student);
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json(
      { error: "Error al crear el alumno" },
      { status: 500 }
    );
  }
}
