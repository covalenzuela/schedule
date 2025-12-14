'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import '../../subjects/components/ImportSubjectsModal.css';

interface ImportAvailabilityModalProps {
  teacherName: string;
  onImport: (availability: Array<{
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }>) => void;
  onCancel: () => void;
}

const DAY_MAP: Record<string, string> = {
  'LUNES': 'MONDAY',
  'MARTES': 'TUESDAY',
  'MIÉRCOLES': 'WEDNESDAY',
  'MIERCOLES': 'WEDNESDAY',
  'JUEVES': 'THURSDAY',
  'VIERNES': 'FRIDAY',
  'SÁBADO': 'SATURDAY',
  'SABADO': 'SATURDAY',
  'DOMINGO': 'SUNDAY',
  'L': 'MONDAY',
  'M': 'TUESDAY',
  'X': 'WEDNESDAY',
  'J': 'THURSDAY',
  'V': 'FRIDAY',
  'S': 'SATURDAY',
  'D': 'SUNDAY',
};

export function ImportAvailabilityModal({ teacherName, onImport, onCancel }: ImportAvailabilityModalProps) {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [previewData, setPreviewData] = useState<Array<any>>([]);
  const [error, setError] = useState('');

  const exampleData = [
    { Día: 'Lunes', 'Hora Inicio': '08:00', 'Hora Fin': '12:00' },
    { Día: 'Lunes', 'Hora Inicio': '14:00', 'Hora Fin': '18:00' },
    { Día: 'Martes', 'Hora Inicio': '08:00', 'Hora Fin': '13:00' },
    { Día: 'Miércoles', 'Hora Inicio': '09:00', 'Hora Fin': '17:00' },
    { Día: 'Jueves', 'Hora Inicio': '08:00', 'Hora Fin': '12:00' },
    { Día: 'Viernes', 'Hora Inicio': '14:00', 'Hora Fin': '18:00' },
  ];

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet(exampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Disponibilidad');
    XLSX.writeFile(wb, `disponibilidad_${teacherName.replace(/\s+/g, '_')}.xlsx`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          setError('El archivo está vacío');
          return;
        }

        // Validar columnas
        const firstRow: any = jsonData[0];
        const requiredColumns = ['Día', 'Hora Inicio', 'Hora Fin'];
        const hasRequiredColumns = requiredColumns.some(col => 
          col in firstRow || 
          col.toLowerCase() in Object.keys(firstRow).map(k => k.toLowerCase())
        );

        if (!hasRequiredColumns) {
          setError(`El archivo debe tener las columnas: ${requiredColumns.join(', ')}`);
          return;
        }

        setPreviewData(jsonData);
        setStep('preview');
        setError('');
      } catch (err) {
        setError('Error al leer el archivo. Asegúrate de que sea un archivo Excel válido.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const normalizeDay = (day: string): string | null => {
    const normalized = day.toUpperCase().trim();
    return DAY_MAP[normalized] || null;
  };

  const handleImport = () => {
    const availability = previewData.map((row: any) => {
      const dayKey = Object.keys(row).find(k => 
        k.toLowerCase().includes('día') || k.toLowerCase().includes('dia') || k.toLowerCase() === 'day'
      );
      const startKey = Object.keys(row).find(k => 
        k.toLowerCase().includes('inicio') || k.toLowerCase().includes('start')
      );
      const endKey = Object.keys(row).find(k => 
        k.toLowerCase().includes('fin') || k.toLowerCase().includes('end')
      );

      if (!dayKey || !startKey || !endKey) return null;

      const dayOfWeek = normalizeDay(row[dayKey]);
      if (!dayOfWeek) return null;

      return {
        dayOfWeek,
        startTime: row[startKey],
        endTime: row[endKey],
      };
    }).filter(Boolean) as Array<{
      dayOfWeek: string;
      startTime: string;
      endTime: string;
    }>;

    onImport(availability);
  };

  const getDayName = (dayKey: string): string => {
    const names: Record<string, string> = {
      'MONDAY': 'Lunes',
      'TUESDAY': 'Martes',
      'WEDNESDAY': 'Miércoles',
      'THURSDAY': 'Jueves',
      'FRIDAY': 'Viernes',
      'SATURDAY': 'Sábado',
      'SUNDAY': 'Domingo',
    };
    return names[normalizeDay(dayKey) || ''] || dayKey;
  };

  return (
    <div className="import-modal">
      {step === 'upload' && (
        <>
          <div className="import-header">
            <h3>📥 Importar Disponibilidad Horaria</h3>
            <p className="import-subtitle">
              Importa la disponibilidad de <strong>{teacherName}</strong> desde Excel
            </p>
          </div>

          <div className="import-example">
            <h4>📋 Formato del archivo:</h4>
            <div className="example-table">
              <table>
                <thead>
                  <tr>
                    <th>Día</th>
                    <th>Hora Inicio</th>
                    <th>Hora Fin</th>
                  </tr>
                </thead>
                <tbody>
                  {exampleData.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.Día}</td>
                      <td>{row['Hora Inicio']}</td>
                      <td>{row['Hora Fin']}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="import-note">
              * Puedes agregar múltiples bloques para el mismo día
              <br />
              * Formato de hora: HH:mm (ej: 08:00, 14:30)
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
              Se importarán {previewData.length} bloques de disponibilidad
            </p>
          </div>

          <div className="preview-table-wrapper">
            <table className="preview-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Día</th>
                  <th>Hora Inicio</th>
                  <th>Hora Fin</th>
                  <th>Duración</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((row: any, idx) => {
                  const dayKey = Object.keys(row).find(k => 
                    k.toLowerCase().includes('día') || k.toLowerCase().includes('dia') || k.toLowerCase() === 'day'
                  );
                  const startKey = Object.keys(row).find(k => 
                    k.toLowerCase().includes('inicio') || k.toLowerCase().includes('start')
                  );
                  const endKey = Object.keys(row).find(k => 
                    k.toLowerCase().includes('fin') || k.toLowerCase().includes('end')
                  );

                  const day = dayKey ? row[dayKey] : '-';
                  const start = startKey ? row[startKey] : '-';
                  const end = endKey ? row[endKey] : '-';

                  // Calcular duración
                  let duration = '-';
                  if (start !== '-' && end !== '-') {
                    try {
                      const [startH, startM] = start.split(':').map(Number);
                      const [endH, endM] = end.split(':').map(Number);
                      const minutes = (endH * 60 + endM) - (startH * 60 + startM);
                      const hours = Math.floor(minutes / 60);
                      const mins = minutes % 60;
                      duration = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
                    } catch (e) {
                      duration = '?';
                    }
                  }

                  return (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{getDayName(day)}</td>
                      <td>{start}</td>
                      <td>{end}</td>
                      <td>{duration}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={() => setStep('upload')}>
              ← Volver
            </button>
            <button type="button" className="btn-confirm" onClick={handleImport}>
              ✓ Importar Disponibilidad
            </button>
          </div>
        </>
      )}
    </div>
  );
}
