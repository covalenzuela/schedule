/**
 * 📥 ImportStudentsModal - Modal para importar alumnos desde Excel
 */

'use client';

import { useState } from 'react';
import ExcelJS from 'exceljs';
import '../../subjects/components/ImportSubjectsModal.css';

interface ImportStudentsModalProps {
  courseId: string;
  onImport: (students: Array<{
    firstName: string;
    lastName: string;
    email?: string;
    enrollmentDate: string;
  }>) => void;
  onCancel: () => void;
}

export function ImportStudentsModal({ courseId, onImport, onCancel }: ImportStudentsModalProps) {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [previewData, setPreviewData] = useState<Array<any>>([]);
  const [error, setError] = useState('');

  const exampleData = [
    { 
      Nombre: 'Ana', 
      Apellido: 'Martínez', 
      Email: 'ana.martinez@estudiante.cl',
      'Fecha Inscripción': '2025-03-01'
    },
    { 
      Nombre: 'Carlos', 
      Apellido: 'López', 
      Email: 'carlos.lopez@estudiante.cl',
      'Fecha Inscripción': '2025-03-01'
    },
    { 
      Nombre: 'Daniela', 
      Apellido: 'Rojas', 
      Email: 'daniela.rojas@estudiante.cl',
      'Fecha Inscripción': '2025-03-15'
    },
  ];

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Alumnos');

    worksheet.columns = [
      { header: 'Nombre', key: 'Nombre', width: 15 },
      { header: 'Apellido', key: 'Apellido', width: 15 },
      { header: 'Email', key: 'Email', width: 30 },
      { header: 'Fecha Inscripción', key: 'Fecha Inscripción', width: 18 },
    ];

    exampleData.forEach(row => worksheet.addRow(row));

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_alumnos.xlsx';
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
        setError('El archivo no contiene hojas');
        return;
      }

      const jsonData: any[] = [];
      const headers: string[] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          row.eachCell((cell) => {
            headers.push(cell.value?.toString() || '');
          });
        } else {
          const rowData: any = {};
          row.eachCell((cell, colNumber) => {
            rowData[headers[colNumber - 1]] = cell.value;
          });
          if (Object.keys(rowData).length > 0) {
            jsonData.push(rowData);
          }
        }
      });

      if (jsonData.length === 0) {
        setError('El archivo no contiene datos');
        return;
      }

      setPreviewData(jsonData);
      setStep('preview');
      setError('');
    } catch (err) {
      setError('Error al leer el archivo Excel');
      console.error(err);
    }
  };

  const handleConfirmImport = () => {
    const students = previewData.map(row => ({
      firstName: row.Nombre?.toString() || '',
      lastName: row.Apellido?.toString() || '',
      email: row.Email?.toString() || undefined,
      enrollmentDate: row['Fecha Inscripción']?.toString() || new Date().toISOString().split('T')[0],
    }));

    onImport(students);
  };

  return (
    <div className="import-modal">
      {step === 'upload' && (
        <>
          <div className="import-header">
            <h3>📥 Importar Alumnos desde Excel</h3>
            <p className="import-subtitle">
              Sube un archivo Excel con tus alumnos o descarga la plantilla
            </p>
          </div>

          <div className="import-example">
            <h4>📋 Formato del archivo:</h4>
            <div className="example-table">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th>Email</th>
                    <th>Fecha Inscripción</th>
                  </tr>
                </thead>
                <tbody>
                  {exampleData.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.Nombre}</td>
                      <td>{row.Apellido}</td>
                      <td>{row.Email}</td>
                      <td>{row['Fecha Inscripción']}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="import-note">
              * Las columnas <strong>Nombre</strong>, <strong>Apellido</strong> y <strong>Fecha Inscripción</strong> son obligatorias (formato: YYYY-MM-DD)
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
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {error && (
            <div className="import-error">
              ⚠️ {error}
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onCancel}>
              Cancelar
            </button>
          </div>
        </>
      )}

      {step === 'preview' && (
        <>
          <div className="import-header">
            <h3>👀 Vista Previa</h3>
            <p className="import-subtitle">
              Se importarán {previewData.length} alumnos
            </p>
          </div>

          <div className="preview-table-wrapper">
            <table className="preview-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Email</th>
                  <th>Fecha Inscripción</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((row: any, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{row.Nombre || row.nombre}</td>
                    <td>{row.Apellido || row.apellido}</td>
                    <td>{row.Email || row.email || '-'}</td>
                    <td>{row['Fecha Inscripción'] || row['fecha_inscripcion'] || row.enrollmentDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={() => setStep('upload')}>
              ← Volver
            </button>
            <button type="button" className="btn-confirm" onClick={handleConfirmImport}>
              ✓ Importar {previewData.length} Alumnos
            </button>
          </div>
        </>
      )}
    </div>
  );
}
