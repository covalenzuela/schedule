"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * Verificar y enviar alertas de ausencias
 * Se llama después de registrar asistencia
 */
export async function checkAndNotifyAbsences(studentId: string) {
  try {
    const session = await getSession();
    if (!session?.id) {
      throw new Error("No autorizado");
    }

    // Obtener estudiante con datos del tutor
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        course: {
          include: {
            school: true,
          },
        },
      },
    });

    if (!student) {
      throw new Error("Estudiante no encontrado");
    }

    // Contar ausencias del mes actual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const absences = await prisma.attendance.count({
      where: {
        studentId,
        status: "absent",
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // Si tiene 3 o más ausencias, crear notificación
    if (absences >= 3) {
      // Verificar si ya se envió notificación este mes
      const existingNotification = await prisma.notification.findFirst({
        where: {
          studentId,
          type: "absence_alert",
          createdAt: {
            gte: startOfMonth,
          },
        },
      });

      if (!existingNotification) {
        // Crear notificación
        await prisma.notification.create({
          data: {
            studentId,
            type: "absence_alert",
            title: `Alerta de Ausencias - ${student.firstName} ${student.lastName}`,
            message: `El alumno ${student.firstName} ${student.lastName} ha acumulado ${absences} ausencias en ${now.toLocaleString('es', { month: 'long', year: 'numeric' })}. Se requiere contactar al apoderado.`,
            metadata: {
              absences,
              month: now.getMonth() + 1,
              year: now.getFullYear(),
              guardianPhone: student.guardianPhone,
              guardianName: student.guardianName,
              schoolName: student.course.school.name,
              courseName: student.course.name,
            },
            isRead: false,
          },
        });

        // TODO: Integrar con API de WhatsApp
        // Aquí se puede integrar con servicios como:
        // - Twilio WhatsApp API
        // - Meta WhatsApp Business API
        // - Wati
        // - etc.
        
        console.log(`📱 Notificación de ausencias creada para ${student.firstName} ${student.lastName}`);
        console.log(`   Ausencias: ${absences}`);
        console.log(`   Teléfono tutor: ${student.guardianPhone || 'No disponible'}`);
        
        return {
          notificationCreated: true,
          absences,
          guardianPhone: student.guardianPhone,
        };
      }
    }

    return {
      notificationCreated: false,
      absences,
    };
  } catch (error) {
    console.error("[checkAndNotifyAbsences] Error:", error);
    throw error;
  }
}

/**
 * Obtener notificaciones pendientes
 */
export async function getPendingNotifications() {
  try {
    const session = await getSession();
    if (!session?.id) {
      throw new Error("No autorizado");
    }

    const notifications = await prisma.notification.findMany({
      where: {
        isRead: false,
      },
      include: {
        student: {
          include: {
            course: {
              include: {
                school: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return notifications;
  } catch (error) {
    console.error("[getPendingNotifications] Error:", error);
    throw error;
  }
}

/**
 * Marcar notificación como leída
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const session = await getSession();
    if (!session?.id) {
      throw new Error("No autorizado");
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return { success: true };
  } catch (error) {
    console.error("[markNotificationAsRead] Error:", error);
    throw error;
  }
}

/**
 * Enviar mensaje de WhatsApp (integración futura)
 * Requiere configurar una API de WhatsApp
 */
export async function sendWhatsAppNotification(
  phoneNumber: string,
  message: string
) {
  // TODO: Implementar integración con API de WhatsApp
  // Ejemplo con Twilio:
  /*
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = require('twilio')(accountSid, authToken);
  
  await client.messages.create({
    from: 'whatsapp:+14155238886',
    to: `whatsapp:${phoneNumber}`,
    body: message
  });
  */
  
  console.log(`📱 [WhatsApp] Enviar a ${phoneNumber}: ${message}`);
  return { success: true, pending: true };
}
