"use client";

import { useState, useEffect } from "react";
import { useModal } from "@/contexts/ModalContext";

export function AttendanceMetricsSettings() {
  const { closeModal } = useModal();
  const [presentStatuses, setPresentStatuses] = useState("present");
  const [absentStatuses, setAbsentStatuses] = useState("absent");
  const [totalMode, setTotalMode] = useState("recorded");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("attendanceMetricsPrefs");
      if (raw) {
        const parsed = JSON.parse(raw);
        setPresentStatuses((parsed.presentStatuses || ["present"]).join(","));
        setAbsentStatuses((parsed.absentStatuses || ["absent"]).join(","));
        setTotalMode(parsed.totalMode || "recorded");
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleSave = () => {
    const prefs = {
      presentStatuses: presentStatuses.split(",").map((s) => s.trim()).filter(Boolean),
      absentStatuses: absentStatuses.split(",").map((s) => s.trim()).filter(Boolean),
      totalMode,
    };
    localStorage.setItem("attendanceMetricsPrefs", JSON.stringify(prefs));

    // Notify other components to refresh
    try {
      window.dispatchEvent(new CustomEvent("attendanceMetricsUpdated", { detail: prefs }));
    } catch (e) {}

    closeModal();
  };

  const handleReset = () => {
    localStorage.removeItem("attendanceMetricsPrefs");
    window.dispatchEvent(new CustomEvent("attendanceMetricsUpdated", { detail: null }));
    closeModal();
  };

  return (
    <div style={{ padding: 20, color: "#e6eef8", maxWidth: "680px" }}>
      <h3>¿Cómo se calculan las métricas?</h3>
      <p>
        Puedes definir qué estados cuentan como <strong>Presente</strong> y
        cuáles como <strong>Ausente</strong>. También puedes elegir si el
        total se calcula como los días con registro (actual) o como los días
        programados del mes (excluye feriados y días antes de la matrícula).
      </p>

      <div style={{ marginTop: 12 }}>
        <label style={{ display: "block", marginBottom: 6 }}>Estados que cuentan como <strong>Presente</strong> (separados por coma)</label>
        <input
          style={{ width: "100%", padding: 8, borderRadius: 6, background: "#0f1724", color: "#e6eef8", border: "1px solid rgba(255,255,255,0.06)" }}
          value={presentStatuses}
          onChange={(e) => setPresentStatuses(e.target.value)}
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={{ display: "block", marginBottom: 6 }}>Estados que cuentan como <strong>Ausente</strong> (separados por coma)</label>
        <input
          style={{ width: "100%", padding: 8, borderRadius: 6, background: "#0f1724", color: "#e6eef8", border: "1px solid rgba(255,255,255,0.06)" }}
          value={absentStatuses}
          onChange={(e) => setAbsentStatuses(e.target.value)}
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={{ display: "block", marginBottom: 6 }}>Modo de cálculo del <strong>Total</strong></label>
        <div style={{ display: "flex", gap: 12 }}>
          <label style={{ cursor: "pointer" }}>
            <input type="radio" name="totalMode" value="recorded" checked={totalMode === "recorded"} onChange={() => setTotalMode("recorded")} />{' '}
            Registrados (solo días con registro)
          </label>
          <label style={{ cursor: "pointer" }}>
            <input type="radio" name="totalMode" value="scheduled" checked={totalMode === "scheduled"} onChange={() => setTotalMode("scheduled")} />{' '}
            Programados (excluye feriados y días antes de la matrícula)
          </label>
        </div>
      </div>

      <div style={{ marginTop: 18, display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={handleReset} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.06)", padding: "8px 12px", borderRadius: 8 }}>Restablecer</button>
        <button onClick={handleSave} style={{ background: "#10B981", border: "none", padding: "8px 12px", borderRadius: 8, color: "white" }}>Guardar</button>
      </div>
    </div>
  );
}
