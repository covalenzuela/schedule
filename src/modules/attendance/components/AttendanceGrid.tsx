"use client";

import { useState, useEffect } from "react";
import { getStudentsByCourse } from "@/modules/students/actions";
import {
  getAttendanceByCourse,
  recordAttendance,
} from "@/modules/attendance/actions";
import { getSpecialDaysInRange } from "@/modules/special-days/actions";
import "./AttendanceGrid.css";
import { useModal } from "@/contexts/ModalContext";
import { AttendanceMetricInfo } from "./AttendanceMetricInfo";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  enrollmentDate: Date;
}

interface AttendanceRecord {
  [studentId: string]: {
    [date: string]: "present" | "absent" | "late" | "justified";
  };
}

interface AttendanceGridProps {
  courseId: string;
  courseName: string;
  schoolId: string;
  month: number;
  year: number;
}

export function AttendanceGrid({
  courseId,
  courseName,
  schoolId,
  month,
  year,
}: AttendanceGridProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord>({});
  const [specialDays, setSpecialDays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { openModal } = useModal();

  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useEffect(() => {
    loadData();
  }, [courseId, month, year]);

  // no-op: metrics are fixed for now (not user-configurable)

  const loadData = async () => {
    try {
      setLoading(true);
      const studentsData = await getStudentsByCourse(courseId);
      setStudents(studentsData);

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      // Cargar asistencias
      const attendances = await getAttendanceByCourse(
        courseId,
        startDate,
        endDate
      );

      const data: AttendanceRecord = {};
      attendances.forEach((att: any) => {
        const studentId = att.studentId;
        const dateKey = new Date(att.date).getDate().toString();
        if (!data[studentId]) data[studentId] = {};
        data[studentId][dateKey] = att.status as any;
      });

      setAttendanceData(data);

      // Cargar días especiales
      const specialDaysData = await getSpecialDaysInRange(
        schoolId,
        startDate,
        endDate
      );
      setSpecialDays(specialDaysData);
    } catch (error) {
      console.error("Error loading attendance:", error);
      alert("Error al cargar la asistencia");
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = async (studentId: string, day: number) => {
    const dateKey = day.toString();
    const currentStatus = attendanceData[studentId]?.[dateKey];
    
    // Ciclo de estados: null → present → absent → late → justified → null
    let newStatus: "present" | "absent" | "late" | "justified" | null;
    
    switch (currentStatus) {
      case "present":
        newStatus = "absent";
        break;
      case "absent":
        newStatus = "late";
        break;
      case "late":
        newStatus = "justified";
        break;
      case "justified":
        newStatus = null;
        break;
      default:
        newStatus = "present";
    }

    const date = new Date(year, month - 1, day);

    try {
      setSaving(true);
      
      if (newStatus) {
        await recordAttendance({
          studentId,
          courseId,
          date,
          status: newStatus,
        });
        
        setAttendanceData((prev) => {
          const newData = { ...prev };
          if (!newData[studentId]) newData[studentId] = {};
          newData[studentId][dateKey] = newStatus;
          return newData;
        });
      } else {
        // Si es null, eliminar la entrada
        setAttendanceData((prev) => {
          const newData = { ...prev };
          if (newData[studentId]) {
            delete newData[studentId][dateKey];
          }
          return newData;
        });
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert("Error al guardar la asistencia");
    } finally {
      setSaving(false);
    }
  };

  const getStudentStats = (studentId: string) => {
    const records = attendanceData[studentId] || {};
    const entries = Object.values(records);
    const total = entries.length;
    const present = entries.filter((s) => s === "present").length;
    const absent = entries.filter((s) => s === "absent").length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, percentage };
  };

  // Detectar 3 ausencias consecutivas
  const hasConsecutiveAbsences = (studentId: string, day: number): boolean => {
    const records = attendanceData[studentId] || {};
    
    // Verificar si el día actual y los dos anteriores son ausentes
    if (day >= 3) {
      const day1 = records[day.toString()];
      const day2 = records[(day - 1).toString()];
      const day3 = records[(day - 2).toString()];
      
      if (day1 === "absent" && day2 === "absent" && day3 === "absent") {
        return true;
      }
    }
    
    // Verificar si el día actual, anterior y siguiente son ausentes
    if (day >= 2 && day < daysInMonth) {
      const day1 = records[(day - 1).toString()];
      const day2 = records[day.toString()];
      const day3 = records[(day + 1).toString()];
      
      if (day1 === "absent" && day2 === "absent" && day3 === "absent") {
        return true;
      }
    }
    
    // Verificar si el día actual y los dos siguientes son ausentes
    if (day <= daysInMonth - 2) {
      const day1 = records[day.toString()];
      const day2 = records[(day + 1).toString()];
      const day3 = records[(day + 2).toString()];
      
      if (day1 === "absent" && day2 === "absent" && day3 === "absent") {
        return true;
      }
    }
    
    return false;
  };

  // Verificar si un día es especial
  const isSpecialDayDate = (day: number): any => {
    const targetDate = new Date(year, month - 1, day);
    
    return specialDays.find((sd) => {
      const specialDate = new Date(sd.date);
      
      if (sd.recurring) {
        // Para días recurrentes, comparar solo mes y día
        return (
          specialDate.getMonth() === targetDate.getMonth() &&
          specialDate.getDate() === targetDate.getDate()
        );
      } else {
        // Para días no recurrentes, comparar fecha completa
        return (
          specialDate.getDate() === targetDate.getDate() &&
          specialDate.getMonth() === targetDate.getMonth() &&
          specialDate.getFullYear() === targetDate.getFullYear()
        );
      }
    });
  };

  if (loading) {
    return (
      <div className="attendance-loading">
        <div className="spinner"></div>
        <p>Cargando asistencia...</p>
      </div>
    );
  }

  return (
    <div className="attendance-grid-container">
      <div className="attendance-header">
        <h2>{courseName}</h2>
        <div className="attendance-period">
          {new Date(year, month - 1).toLocaleDateString("es", {
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>

      <div className="attendance-table-wrapper">
        <table className="attendance-table">
          <thead>
            <tr>
              <th className="student-name-header">Alumno</th>
              {days.map((day) => (
                <th key={day} className="day-header">
                  {day}
                </th>
              ))}
              <th className="stats-header">Ausentes <button title="¿Cómo se cuenta?" className="metrics-help-btn" onClick={() => openModal(<AttendanceMetricInfo metric="absent" />, 'Ausentes', { maxWidth: '520px' })}>❔</button></th>
              <th className="stats-header">Presentes <button title="¿Cómo se cuenta?" className="metrics-help-btn" onClick={() => openModal(<AttendanceMetricInfo metric="present" />, 'Presentes', { maxWidth: '520px' })}>❔</button></th>
              <th className="stats-header">Total <button title="¿Cómo se cuenta?" className="metrics-help-btn" onClick={() => openModal(<AttendanceMetricInfo metric="total" />, 'Total', { maxWidth: '520px' })}>❔</button></th>
              <th className="stats-header">% Asist. <button title="¿Cómo se calcula?" className="metrics-help-btn" onClick={() => openModal(<AttendanceMetricInfo metric="percentage" />, '% Asist.', { maxWidth: '520px' })}>❔</button></th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const stats = getStudentStats(student.id);
              const needsAlert = stats.percentage < 85 && stats.total > 0;

              return (
                <tr
                  key={student.id}
                  className={needsAlert ? "alert-row" : ""}
                >
                  <td className="student-name">
                    {student.lastName} {student.firstName}
                  </td>
                  {days.map((day) => {
                    const dateKey = day.toString();
                    const status = attendanceData[student.id]?.[dateKey];
                    const enrollmentDay = new Date(
                      student.enrollmentDate
                    ).getDate();
                    const enrollmentMonth =
                      new Date(student.enrollmentDate).getMonth() + 1;
                    const enrollmentYear = new Date(
                      student.enrollmentDate
                    ).getFullYear();

                    const isBeforeEnrollment =
                      year < enrollmentYear ||
                      (year === enrollmentYear && month < enrollmentMonth) ||
                      (year === enrollmentYear &&
                        month === enrollmentMonth &&
                        day < enrollmentDay);

                    if (isBeforeEnrollment) {
                      return (
                        <td key={day} className="cell-disabled">
                          -
                        </td>
                      );
                    }

                    // Verificar si es día especial
                    const specialDay = isSpecialDayDate(day);
                    if (specialDay) {
                      const typeClass = `special-${specialDay.type}`;
                      return (
                        <td 
                          key={day} 
                          className={`cell-special ${typeClass}`}
                          title={`${specialDay.name}${specialDay.description ? ': ' + specialDay.description : ''}`}
                        >
                          🗓️
                        </td>
                      );
                    }

                    const hasAlert = status === "absent" && hasConsecutiveAbsences(student.id, day);
                    
                    return (
                      <td
                        key={day}
                        className={`cell-status ${status || "empty"} ${hasAlert ? "consecutive-absences" : ""}`}
                        onClick={() => toggleAttendance(student.id, day)}
                        title={
                          hasAlert ? "⚠️ 3 Ausencias Consecutivas" :
                          status === "present" ? "Presente" :
                          status === "absent" ? "Ausente" :
                          status === "late" ? "Tarde/Atraso" :
                          status === "justified" ? "Justificado" :
                          "Sin registro"
                        }
                      >
                        {status === "present"
                          ? "P"
                          : status === "absent"
                          ? "X"
                          : status === "late"
                          ? "T"
                          : status === "justified"
                          ? "J"
                          : ""}
                      </td>
                    );
                  })}
                  <td className="stats-cell">{stats.absent}</td>
                  <td className="stats-cell">{stats.present}</td>
                  <td className="stats-cell">{stats.total}</td>
                  <td className={`stats-cell ${needsAlert ? "alert" : ""}`}>
                    {stats.percentage}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="attendance-legend">
        <div className="legend-item">
          <span className="legend-box present">P</span>
          <span>Presente</span>
        </div>
        <div className="legend-item">
          <span className="legend-box absent">X</span>
          <span>Ausente</span>
        </div>
        <div className="legend-item">
          <span className="legend-box late">T</span>
          <span>Tarde/Atraso</span>
        </div>
        <div className="legend-item">
          <span className="legend-box justified">J</span>
          <span>Justificado</span>
        </div>
        <div className="legend-item">
          <span className="legend-box empty"></span>
          <span>Sin registro (click para marcar)</span>
        </div>
        <div className="legend-item">
          <span className="legend-box alert-indicator"></span>
          <span>Asistencia baja (&lt; 85%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-box consecutive-alert">X</span>
          <span>⚠️ 3 Ausencias Consecutivas</span>
        </div>
        <div className="legend-item">
          <span className="legend-box special-day">🗓️</span>
          <span>Días Especiales/Feriados</span>
        </div>
      </div>

      {saving && (
        <div className="saving-indicator">
          <div className="spinner-small"></div>
          Guardando...
        </div>
      )}
    </div>
  );
}
