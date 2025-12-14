/**
 * 📥 DownloadScheduleModal - Modal para seleccionar formato de descarga
 */

"use client";

import { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./Modal.css";

export interface DownloadScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleName: string;
  scheduleId: string;
}

type DownloadFormat = "png" | "pdf";

export function DownloadScheduleModal({
  isOpen,
  onClose,
  scheduleName,
  scheduleId,
}: DownloadScheduleModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<DownloadFormat>("png");
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      // Buscar el elemento del horario en el DOM
      const scheduleElement = document.getElementById(
        `schedule-grid-${scheduleId}`
      );

      if (!scheduleElement) {
        alert(
          "No se pudo encontrar el elemento del horario. Por favor, asegúrate de que el acordeón esté expandido."
        );
        setIsDownloading(false);
        return;
      }

      // Generar canvas del horario
      const canvas = await html2canvas(scheduleElement, {
        scale: 2,
        backgroundColor: "#1a1a2e",
        logging: false,
        useCORS: true,
      });

      const fileName = `horario-${scheduleName
        .replace(/\s+/g, "-")
        .toLowerCase()}`;

      if (selectedFormat === "png") {
        // Descargar como PNG
        const link = document.createElement("a");
        link.download = `${fileName}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } else {
        // Descargar como PDF
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? "landscape" : "portrait",
          unit: "px",
          format: [canvas.width, canvas.height],
        });

        pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
        pdf.save(`${fileName}.pdf`);
      }

      // Cerrar modal después de descargar
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error("Error al descargar:", error);
      alert("Error al generar la descarga. Por favor intenta nuevamente.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "500px" }}
      >
        <div className="modal-header">
          <h2 className="modal-title">📥 Descargar Horario</h2>
          <button
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-content">
          {/* Información del horario */}
          <div
            style={{
              marginBottom: "1.5rem",
              padding: "1rem",
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "0.75rem",
              borderLeft: "4px solid rgba(13, 139, 255, 0.5)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "0.9375rem",
                color: "rgba(255, 255, 255, 0.9)",
              }}
            >
              <strong>Horario:</strong> {scheduleName}
            </p>
          </div>

          {/* Selector de formato */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.75rem",
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: "rgba(255, 255, 255, 0.9)",
              }}
            >
              Selecciona el formato de descarga:
            </label>
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
              }}
            >
              <button
                onClick={() => setSelectedFormat("png")}
                style={{
                  flex: 1,
                  padding: "1rem 1.25rem",
                  background:
                    selectedFormat === "png"
                      ? "linear-gradient(135deg, #0d8bff, #a855f7)"
                      : "rgba(255, 255, 255, 0.05)",
                  border:
                    selectedFormat === "png"
                      ? "2px solid rgba(13, 139, 255, 0.5)"
                      : "2px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "0.75rem",
                  color: "white",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontSize: "0.9375rem",
                }}
              >
                🖼️ PNG
              </button>
              <button
                onClick={() => setSelectedFormat("pdf")}
                style={{
                  flex: 1,
                  padding: "1rem 1.25rem",
                  background:
                    selectedFormat === "pdf"
                      ? "linear-gradient(135deg, #0d8bff, #a855f7)"
                      : "rgba(255, 255, 255, 0.05)",
                  border:
                    selectedFormat === "pdf"
                      ? "2px solid rgba(13, 139, 255, 0.5)"
                      : "2px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "0.75rem",
                  color: "white",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontSize: "0.9375rem",
                }}
              >
                📄 PDF
              </button>
            </div>
          </div>

          {/* Botones de acción */}
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={onClose}
              disabled={isDownloading}
              style={{
                padding: "0.75rem 1.5rem",
                background: "rgba(255, 255, 255, 0.1)",
                border: "none",
                borderRadius: "0.75rem",
                color: "rgba(255, 255, 255, 0.8)",
                fontWeight: 600,
                cursor: isDownloading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                fontSize: "0.9375rem",
                opacity: isDownloading ? 0.5 : 1,
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              style={{
                padding: "0.75rem 1.5rem",
                background: isDownloading
                  ? "rgba(13, 139, 255, 0.5)"
                  : "linear-gradient(135deg, #0d8bff, #a855f7)",
                border: "none",
                borderRadius: "0.75rem",
                color: "white",
                fontWeight: 600,
                cursor: isDownloading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                fontSize: "0.9375rem",
              }}
            >
              {isDownloading
                ? "⏳ Descargando..."
                : `📥 Descargar ${selectedFormat.toUpperCase()}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
