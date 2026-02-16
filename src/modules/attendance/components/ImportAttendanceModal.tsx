/**
 * 📊 ImportAttendanceModal - Modal para importar asistencia desde Excel
 */

'use client';

import { useState } from 'react';
import ExcelJS from 'exceljs';
import { recordBulkAttendance } from '@/modules/attendance/actions';
import { getStudentsByCourse } from '@/modules/students/actions';
import '../../subjects/components/ImportSubjectsModal.css';

interface ImportAttendanceModalProps {
  courseId: string;
  month: number;
  year: number;
  onImport: () => void;
  onCancel: () => void;
}

// Configuración de estados de asistencia
const ATTENDANCE_STATUSES = {
  P: { value: 'present', label: 'Presente', color: '#10b981' },
  X: { value: 'absent', label: 'Ausente', color: '#ef4444' },
  T: { value: 'late', label: 'Atraso/Tarde', color: '#f59e0b' },
  J: { value: 'justified', label: 'Justificado', color: '#6366f1' },
  '-': { value: null, label: 'Sin registro', color: '#9ca3af' },
};

export function ImportAttendanceModal({ 
  courseId, 
  month, 
  year,
  onImport, 
  onCancel 
}: ImportAttendanceModalProps) {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [previewData, setPreviewData] = useState<Array<any>>([]);
  const [error, setError] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const monthName = new Date(year, month - 1).toLocaleString('es', { month: 'long' });

  // Feriados de Chile 2026 (agregar más según sea necesario)
  const HOLIDAYS_2026 = [
    '2026-01-01', // Año Nuevo
    '2026-04-03', // Viernes Santo
    '2026-04-04', // Sábado Santo
    '2026-05-01', // Día del Trabajador
    '2026-05-21', // Día de las Glorias Navales
    '2026-06-29', // San Pedro y San Pablo
    '2026-07-16', // Día de la Virgen del Carmen
    '2026-08-15', // Asunción de la Virgen
    '2026-09-18', // Primera Junta Nacional de Gobierno
    '2026-09-19', // Día de las Glorias del Ejército
    '2026-10-12', // Encuentro de Dos Mundos
    '2026-10-31', // Día de las Iglesias Evangélicas y Protestantes
    '2026-11-01', // Día de Todos los Santos
    '2026-12-08', // Inmaculada Concepción
    '2026-12-25', // Navidad
  ];

  // Función para verificar si un día es feriado
  const isHoliday = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return HOLIDAYS_2026.includes(dateStr);
  };

  // Función para verificar si un día es fin de semana
  const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Domingo, 6 = Sábado
  };

  // Función para obtener días hábiles del mes
  const getSchoolDays = (year: number, month: number): number[] => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const schoolDays: number[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      if (!isWeekend(date) && !isHoliday(date)) {
        schoolDays.push(day);
      }
    }

    return schoolDays;
  };

  const downloadTemplate = async () => {
    try {
      // Obtener estudiantes reales del curso
      const students = await getStudentsByCourse(courseId);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Asistencia');

      // Determinar días hábiles del mes (excluye fines de semana y feriados)
      const dayColumns = getSchoolDays(year, month);

      // Agregar título con el mes y año en la primera fila
      worksheet.mergeCells('A1:B1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = `ASISTENCIA - ${monthName.toUpperCase()} ${year}`;
      titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' },
      };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(1).height = 25;

      // Configurar columnas (ahora en la fila 2)
      const columns = [
        { header: 'Nombre', key: 'nombre', width: 20 },
        { header: 'Apellido', key: 'apellido', width: 20 },
        ...dayColumns.map(day => ({
          header: day.toString(),
          key: `day_${day}`,
          width: 3,
        })),
      ];

      // Insertar headers en la fila 2
      worksheet.insertRow(2, columns.map(col => col.header));
      columns.forEach((col, idx) => {
        const cell = worksheet.getCell(2, idx + 1);
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4F46E5' },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getColumn(idx + 1).width = col.width;
      });

      // Agregar filas con estudiantes reales del curso (empezando desde la fila 3)
      let currentRow = 3;
      if (students && students.length > 0) {
        students.forEach((student: any) => {
          const rowData = [
            student.firstName.toUpperCase(),
            student.lastName.toUpperCase(),
            ...dayColumns.map(() => '-'),
          ];
          worksheet.insertRow(currentRow, rowData);
          currentRow++;
        });
      } else {
        // Si no hay estudiantes, agregar filas de ejemplo
        worksheet.insertRow(currentRow, ['HÉCTOR', 'ÁLVAREZ DÍAZ', ...dayColumns.map(() => '-')]);
        currentRow++;
        worksheet.insertRow(currentRow, ['HÉCTOR', 'CLEAVERSON', ...dayColumns.map(() => '-')]);
      }

    // Estilo de encabezado ya aplicado arriba

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `asistencia_${monthName}_${year}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al generar plantilla:', err);
      setError('Error al generar la plantilla de Excel');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError('');
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        setError('El archivo no contiene hojas');
        return;
      }

      // Obtener días válidos del mes seleccionado
      const validDays = getSchoolDays(year, month);

      const jsonData: any[] = [];
      let headers: string[] = [];

      worksheet.eachRow((row, rowNumber) => {
        // La fila 1 es el título, la fila 2 son los headers
        if (rowNumber === 2) {
          row.eachCell((cell) => {
            headers.push(cell.value?.toString() || '');
          });
        } else if (rowNumber > 2) {
          // Resto de filas son datos
          const rowData: any = { rowNumber };
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1];
            rowData[header] = cell.value?.toString() || '';
          });
          
          if ((rowData['Nombre'] || rowData['nombre']) && (rowData['Apellido'] || rowData['apellido'])) {
            // Validar que solo se procesen columnas de días válidos
            const filteredRowData: any = {
              rowNumber: rowData.rowNumber,
              Nombre: rowData['Nombre'] || rowData['nombre'],
              Apellido: rowData['Apellido'] || rowData['apellido'],
            };
            
            // Solo incluir columnas de días que sean válidos para el mes
            Object.keys(rowData).forEach(key => {
              const dayNum = parseInt(key);
              if (!isNaN(dayNum) && validDays.includes(dayNum)) {
                filteredRowData[key] = rowData[key];
              }
            });
            
            jsonData.push(filteredRowData);
          }
        }
      });

      if (jsonData.length === 0) {
        setError('El archivo no contiene datos de estudiantes');
        return;
      }

      setPreviewData(jsonData);
      setStep('preview');
    } catch (err) {
      setError('Error al leer el archivo Excel');
      console.error(err);
    }
  };

  const handleConfirmImport = async () => {
    try {
      setIsImporting(true);
      setError('');

      const attendanceRecords: Array<{
        studentName: string;
        courseId: string;
        date: Date;
        status: 'present' | 'absent' | 'late' | 'justified';
      }> = [];

      // Procesar cada fila (estudiante)
      for (const row of previewData) {
        const firstName = row['Nombre'] || row['nombre'] || '';
        const lastName = row['Apellido'] || row['apellido'] || '';
        const studentName = `${firstName} ${lastName}`.trim();
        
        // Procesar cada columna de día
        Object.keys(row).forEach(key => {
          const dayMatch = key.match(/^(\d+)$/);
          if (dayMatch) {
            const day = parseInt(dayMatch[1]);
            const statusCode = row[key]?.toUpperCase() || '-';
            
            // Validar que el día sea válido para el mes/año seleccionado
            const daysInMonth = new Date(year, month, 0).getDate();
            if (day < 1 || day > daysInMonth) {
              console.warn(`Día ${day} inválido para ${monthName} ${year}`);
              return;
            }
            
            // Solo importar si hay un código válido
            if (statusCode !== '-' && ATTENDANCE_STATUSES[statusCode as keyof typeof ATTENDANCE_STATUSES]) {
              const status = ATTENDANCE_STATUSES[statusCode as keyof typeof ATTENDANCE_STATUSES].value;
              
              if (status) {
                attendanceRecords.push({
                  studentName,
                  courseId,
                  date: new Date(year, month - 1, day),
                  status: status as 'present' | 'absent' | 'late' | 'justified',
                });
              }
            }
          }
        });
      }

      if (attendanceRecords.length === 0) {
        setError('No se encontraron registros de asistencia válidos');
        return;
      }

      // Llamar a la función de importación (necesitarás implementar esto)
      console.log('Importando:', attendanceRecords);
      alert(`✓ ${attendanceRecords.length} registros de asistencia procesados`);
      onImport();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar asistencia');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="import-modal">
      {step === 'upload' && (
        <>
          <div className="import-header">
            <h3>📊 Importar Asistencia desde Excel</h3>
            <p className="import-subtitle">
              Sube un archivo Excel con la asistencia de {monthName} {year}
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
                    <th>1</th>
                    <th>2</th>
                    <th>3</th>
                    <th>...</th>
                    <th>30</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>HÉCTOR</td>
                    <td>ÁLVAREZ DÍAZ</td>
                    <td>P</td>
                    <td>X</td>
                    <td>P</td>
                    <td>...</td>
                    <td>P</td>
                  </tr>
                  <tr>
                    <td>HÉCTOR</td>
                    <td>CLEAVERSON</td>
                    <td>P</td>
                    <td>P</td>
                    <td>T</td>
                    <td>...</td>
                    <td>X</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="attendance-legend">
              <h4>Códigos de asistencia:</h4>
              <div className="legend-items">
                {Object.entries(ATTENDANCE_STATUSES).map(([code, config]) => (
                  <div key={code} className="legend-item">
                    <span 
                      className="legend-badge" 
                      style={{ backgroundColor: config.color }}
                    >
                      {code}
                    </span>
                    <span>{config.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="import-note">
              * Las columnas <strong>Nombre</strong> y <strong>Apellido</strong> son obligatorias. Los días se marcan con las letras indicadas. Solo aparecerán días hábiles (excluye fines de semana y feriados).
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
              Se importarán registros de {previewData.length} estudiantes
            </p>
          </div>

          <div className="preview-table-wrapper">
            <table className="preview-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Estudiante</th>
                  <th>Registros</th>
                </tr>
              </thead>
              <tbody>
                {previewData.slice(0, 10).map((row: any, idx) => {
                  const firstName = row['Nombre'] || row['nombre'] || '';
                  const lastName = row['Apellido'] || row['apellido'] || '';
                  const studentName = `${firstName} ${lastName}`.trim();
                  const records = Object.keys(row).filter(k => k.match(/^\d+$/)).length;
                  return (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{studentName}</td>
                      <td>{records} días</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {previewData.length > 10 && (
              <p style={{ textAlign: 'center', color: '#6b7280', marginTop: '1rem' }}>
                ... y {previewData.length - 10} estudiantes más
              </p>
            )}
          </div>

          {error && (
            <div className="import-error">
              ⚠️ {error}
            </div>
          )}

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn-cancel" 
              onClick={() => setStep('upload')}
              disabled={isImporting}
            >
              ← Volver
            </button>
            <button 
              type="button" 
              className="btn-confirm" 
              onClick={handleConfirmImport}
              disabled={isImporting}
            >
              {isImporting ? '⏳ Importando...' : `✓ Importar Asistencia`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
