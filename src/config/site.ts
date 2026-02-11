/**
 * Configuración del sitio
 * Centraliza nombres, URLs y metadatos del proyecto
 */

export const siteConfig = {
  name: "Class & Time",
  description: "Sistema de Horarios Escolares",
  tagline: "Plataforma para la gestión de horarios escolares",
  url: "https://classtime.com",
  domain: "classtime.com",
  email: {
    support: "soporte@classtime.com",
    demo: "demo@classtime.com",
    contact: "contacto@classtime.com",
  },
  social: {
    twitter: "@classtime",
    github: "https://github.com/classtime",
  },
  metadata: {
    title: "Class&Time - Sistema de Horarios Escolares",
    description:
      "La plataforma más avanzada para gestionar horarios escolares. Automatiza la asignación, detecta conflictos y optimiza recursos con IA.",
    keywords: ["horarios", "escolares", "gestión", "educación", "saas"],
  },
} as const;
