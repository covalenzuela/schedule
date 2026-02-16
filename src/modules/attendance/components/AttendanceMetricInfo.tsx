"use client";

import React from "react";
import { useModal } from "@/contexts/ModalContext";

export function AttendanceMetricInfo({ metric }: { metric: "absent" | "present" | "total" | "percentage" }) {
  const { closeModal } = useModal();

  const explanations: Record<string, string> = {
    absent: "Ausentes: cuenta las entradas registradas como 'Ausente' (marcadas como X). No incluye días sin registro.",
    present: "Presentes: cuenta las entradas registradas como 'Presente' (marcadas como P).",
    total: "Total: número de días con registro en el mes (días en los que hay al menos un registro). No incluye feriados ni días anteriores a la matrícula.",
    percentage: "% Asist.: (Presentes / Total) * 100. Si no hay registros, se muestra 0%.",
  };

  return (
    <div style={{ padding: 18, color: '#e6eef8', maxWidth: 520 }}>
      <h3 style={{ marginTop: 0 }}>Información — {metric === 'percentage' ? '% Asist.' : metric.charAt(0).toUpperCase() + metric.slice(1)}</h3>
      <p style={{ marginBottom: 12 }}>{explanations[metric]}</p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={closeModal} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', padding: '8px 12px', borderRadius: 8 }}>Cerrar</button>
      </div>
    </div>
  );
}
