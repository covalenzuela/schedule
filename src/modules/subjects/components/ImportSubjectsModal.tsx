"use client";

import { useState } from "react";
import ExcelJS from "exceljs";
import "./ImportSubjectsModal.css";

interface ImportSubjectsModalProps {
  schoolId: string;
  onImport: (
    subjects: Array<{
      name: string;
      code: string;
      description?: string;
      color?: string;
    }>
  ) => void;
  onCancel: () => void;
}

export function ImportSubjectsModal({
  schoolId,
  onImport,
  onCancel,
}: ImportSubjectsModalProps) {
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [previewData, setPreviewData] = useState<Array<any>>([]);
  const [error, setError] = useState("");

  const exampleData = [
    {
      Nombre: "Matemáticas",
      Código: "MAT",
      Descripción: "Álgebra y cálculo",
      Color: "#3B82F6",
    },
    {
      Nombre: "Física",
      Código: "FIS",
      Descripción: "Mecánica y termodinámica",
      Color: "#8B5CF6",
    },
    {
      Nombre: "Química",
      Código: "QUI",
      Descripción: "Química orgánica",
      Color: "#06B6D4",
    },
  ];

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Asignaturas");

    // Añadir columnas
    worksheet.columns = [
      { header: "Nombre", key: "Nombre", width: 20 },
      { header: "Código", key: "Código", width: 10 },
      { header: "Descripción", key: "Descripción", width: 30 },
      { header: "Color", key: "Color", width: 10 },
    ];

    // Añadir datos de ejemplo
    exampleData.forEach((row) => worksheet.addRow(row));

    // Generar y descargar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_asignaturas.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        setError("El archivo no contiene hojas");
        return;
      }

      const jsonData: any[] = [];
      const headers: string[] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          // Primera fila son los headers
          row.eachCell((cell) => {
            headers.push(cell.value?.toString() || "");
          });
        } else {
          // Resto de filas son datos
          const rowData: any = {};
          row.eachCell((cell, colNumber) => {
            rowData[headers[colNumber - 1]] = cell.value;
          });
          jsonData.push(rowData);
        }
      });

      if (jsonData.length === 0) {
        setError("El archivo está vacío");
        return;
      }

      // Validar columnas
      const firstRow: any = jsonData[0];
      const requiredColumns = ["Nombre", "Código"];
      const hasRequiredColumns = requiredColumns.every(
        (col) => col in firstRow
      );

      if (!hasRequiredColumns) {
        setError(
          `El archivo debe tener las columnas: ${requiredColumns.join(", ")}`
        );
        return;
      }

      setPreviewData(jsonData);
      setStep("preview");
      setError("");
    } catch (err) {
      setError(
        "Error al leer el archivo. Asegúrate de que sea un archivo Excel válido."
      );
    }
  };

  const handleImport = () => {
    const subjects = previewData
      .map((row: any) => ({
        name: row.Nombre || row.nombre || "",
        code: row.Código || row.codigo || row.code || "",
        description:
          row.Descripción || row.descripcion || row.description || undefined,
        color: row.Color || row.color || "#3B82F6",
      }))
      .filter((s) => s.name && s.code);

    onImport(subjects);
  };

  return (
    <div className="import-modal">
      {step === "upload" && (
        <>
          <div className="import-header">
            <h3>📥 Importar Asignaturas desde Excel</h3>
            <p className="import-subtitle">
              Sube un archivo Excel con tus asignaturas o descarga la plantilla
            </p>
          </div>

          <div className="import-example">
            <h4>📋 Formato del archivo:</h4>
            <div className="example-table">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Código</th>
                    <th>Descripción</th>
                    <th>Color</th>
                  </tr>
                </thead>
                <tbody>
                  {exampleData.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.Nombre}</td>
                      <td>{row.Código}</td>
                      <td>{row.Descripción}</td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <div
                            style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "4px",
                              backgroundColor: row.Color,
                            }}
                          />
                          {row.Color}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="import-note">
              * Las columnas <strong>Nombre</strong> y <strong>Código</strong>{" "}
              son obligatorias
            </p>
          </div>

          <div className="import-actions">
            <button
              type="button"
              className="btn-download-template"
              onClick={downloadTemplate}
            >
              📥 Descargar Plantilla
            </button>

            <div className="file-upload-section">
              <label htmlFor="file-upload" className="btn-upload">
                📎 Seleccionar Archivo Excel
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
            </div>
          </div>

          {error && <div className="import-error">⚠️ {error}</div>}

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onCancel}>
              Cancelar
            </button>
          </div>
        </>
      )}

      {step === "preview" && (
        <>
          <div className="import-header">
            <h3>👀 Vista Previa</h3>
            <p className="import-subtitle">
              Se importarán {previewData.length} asignaturas
            </p>
          </div>

          <div className="preview-table-wrapper">
            <table className="preview-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Código</th>
                  <th>Descripción</th>
                  <th>Color</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((row: any, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{row.Nombre || row.nombre}</td>
                    <td>{row.Código || row.codigo || row.code}</td>
                    <td>
                      {row.Descripción ||
                        row.descripcion ||
                        row.description ||
                        "-"}
                    </td>
                    <td>
                      <div
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "4px",
                          backgroundColor: row.Color || row.color || "#3B82F6",
                          border: "1px solid rgba(255,255,255,0.2)",
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => setStep("upload")}
            >
              ← Volver
            </button>
            <button
              type="button"
              className="btn-confirm"
              onClick={handleImport}
            >
              ✓ Importar {previewData.length} Asignaturas
            </button>
          </div>
        </>
      )}
    </div>
  );
}
