/**
 * 👨‍🎓 CreateStudentForm - Formulario completo para agregar un nuevo alumno
 */

'use client';

import { useState, useEffect } from 'react';
import { useModal } from '@/contexts/ModalContext';
import { createStudent } from '@/modules/students/actions';
import { Input, Select } from '@/components/ui';
import './StudentForms.css';

interface CreateStudentFormProps {
  courseId?: string;
  schoolId?: string;
  onStudentCreated?: () => void;
}

export function CreateStudentForm({ courseId, schoolId, onStudentCreated }: CreateStudentFormProps) {
  const { closeModal } = useModal();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'guardian' | 'medical'>('basic');
  const [schools, setSchools] = useState<Array<{ id: string; name: string; courses: any[] }>>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState(schoolId || '');
  const [courses, setCourses] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (!schoolId) {
      fetchSchools();
    }
  }, [schoolId]);

  useEffect(() => {
    if (selectedSchoolId) {
      const school = schools.find(s => s.id === selectedSchoolId);
      setCourses(school?.courses || []);
    }
  }, [selectedSchoolId, schools]);

  const fetchSchools = async () => {
    try {
      const response = await fetch('/api/schools');
      const data = await response.json();
      setSchools(data);
    } catch (err) {
      console.error('Error loading schools:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    
    const enrollmentDateStr = formData.get('enrollmentDate') as string;
    const birthDateStr = formData.get('birthDate') as string;
    
    const data = {
      schoolId: schoolId || (formData.get('schoolId') as string),
      courseId: courseId || (formData.get('courseId') as string),
      
      // Datos básicos
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      rut: formData.get('rut') as string || undefined,
      birthDate: birthDateStr ? new Date(birthDateStr) : undefined,
      gender: formData.get('gender') as string || undefined,
      email: formData.get('email') as string || undefined,
      phone: formData.get('phone') as string || undefined,
      address: formData.get('address') as string || undefined,
      enrollmentDate: enrollmentDateStr ? new Date(enrollmentDateStr) : new Date(),
      
      // Datos del apoderado
      guardianName: formData.get('guardianName') as string || undefined,
      guardianRelation: formData.get('guardianRelation') as string || undefined,
      guardianPhone: formData.get('guardianPhone') as string || undefined,
      guardianEmail: formData.get('guardianEmail') as string || undefined,
      guardianRut: formData.get('guardianRut') as string || undefined,
      guardianAddress: formData.get('guardianAddress') as string || undefined,
      
      // Contacto de emergencia
      emergencyName: formData.get('emergencyName') as string || undefined,
      emergencyPhone: formData.get('emergencyPhone') as string || undefined,
      emergencyRelation: formData.get('emergencyRelation') as string || undefined,
      
      // Información médica
      bloodType: formData.get('bloodType') as string || undefined,
      allergies: formData.get('allergies') as string || undefined,
      medicalConditions: formData.get('medicalConditions') as string || undefined,
      medications: formData.get('medications') as string || undefined,
      healthInsurance: formData.get('healthInsurance') as string || undefined,
      
      notes: formData.get('notes') as string || undefined,
    };

    try {
      await createStudent(data);
      closeModal();
      if (onStudentCreated) {
        onStudentCreated();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el alumno');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="student-form">
      {error && (
        <div className="form-error">
          {error}
        </div>
      )}

      {/* Pestañas */}
      <div className="form-tabs">
        <button
          type="button"
          className={`form-tab ${activeTab === 'basic' ? 'active' : ''}`}
          onClick={() => setActiveTab('basic')}
        >
          👤 Datos Básicos
        </button>
        <button
          type="button"
          className={`form-tab ${activeTab === 'guardian' ? 'active' : ''}`}
          onClick={() => setActiveTab('guardian')}
        >
          👨‍👩‍👦 Apoderado
        </button>
        <button
          type="button"
          className={`form-tab ${activeTab === 'medical' ? 'active' : ''}`}
          onClick={() => setActiveTab('medical')}
        >
          🏥 Salud
        </button>
      </div>

      {/* PESTAÑA: DATOS BÁSICOS */}
      {activeTab === 'basic' && (
        <div className="form-tab-content">
          {!schoolId && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="schoolId" className="form-label">
                  Colegio <span className="required">*</span>
                </label>
                <Select
                  id="schoolId"
                  name="schoolId"
                  value={selectedSchoolId}
                  onChange={(e) => setSelectedSchoolId(e.target.value)}
                  disabled={isLoading}
                  required
                  options={[
                    { value: '', label: 'Seleccionar colegio...' },
                    ...schools.map(s => ({ value: s.id, label: s.name }))
                  ]}
                />
              </div>

              <div className="form-group">
                <label htmlFor="courseId" className="form-label">
                  Curso <span className="required">*</span>
                </label>
                <Select
                  id="courseId"
                  name="courseId"
                  disabled={isLoading || !selectedSchoolId}
                  required
                  options={[
                    { value: '', label: selectedSchoolId ? 'Seleccionar curso...' : 'Primero seleccione un colegio' },
                    ...courses.map(c => ({ value: c.id, label: c.name }))
                  ]}
                />
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">
                Nombre <span className="required">*</span>
              </label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Ej: Juan"
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName" className="form-label">
                Apellido <span className="required">*</span>
              </label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Ej: Pérez"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="rut" className="form-label">
                RUT
              </label>
              <Input
                id="rut"
                name="rut"
                type="text"
                placeholder="Ej: 12345678-9"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="birthDate" className="form-label">
                Fecha de Nacimiento
              </label>
              <Input
                id="birthDate"
                name="birthDate"
                type="date"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="gender" className="form-label">
                Género
              </label>
              <Select
                id="gender"
                name="gender"
                disabled={isLoading}
                options={[
                  { value: '', label: 'Seleccionar...' },
                  { value: 'M', label: 'Masculino' },
                  { value: 'F', label: 'Femenino' },
                  { value: 'Other', label: 'Otro' },
                ]}
              />
            </div>

            <div className="form-group">
              <label htmlFor="enrollmentDate" className="form-label">
                Fecha de Inscripción <span className="required">*</span>
              </label>
              <Input
                id="enrollmentDate"
                name="enrollmentDate"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Ej: juan.perez@colegio.cl"
              disabled={isLoading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                Teléfono
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Ej: +56 9 1234 5678"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address" className="form-label">
              Dirección
            </label>
            <Input
              id="address"
              name="address"
              type="text"
              placeholder="Ej: Calle Principal 123, Depto 4B"
              disabled={isLoading}
            />
          </div>
        </div>
      )}

      {/* PESTAÑA: APODERADO */}
      {activeTab === 'guardian' && (
        <div className="form-tab-content">
          <h3 className="form-section-title">👨‍👩‍👦 Datos del Apoderado/Tutor</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="guardianName" className="form-label">
                Nombre Completo
              </label>
              <Input
                id="guardianName"
                name="guardianName"
                type="text"
                placeholder="Ej: María González"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="guardianRelation" className="form-label">
                Relación
              </label>
              <Select
                id="guardianRelation"
                name="guardianRelation"
                disabled={isLoading}
                options={[
                  { value: '', label: 'Seleccionar...' },
                  { value: 'padre', label: 'Padre' },
                  { value: 'madre', label: 'Madre' },
                  { value: 'tutor', label: 'Tutor Legal' },
                  { value: 'abuelo', label: 'Abuelo/a' },
                  { value: 'tio', label: 'Tío/a' },
                  { value: 'otro', label: 'Otro' },
                ]}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="guardianRut" className="form-label">
                RUT
              </label>
              <Input
                id="guardianRut"
                name="guardianRut"
                type="text"
                placeholder="Ej: 12345678-9"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="guardianPhone" className="form-label">
                Teléfono
              </label>
              <Input
                id="guardianPhone"
                name="guardianPhone"
                type="tel"
                placeholder="Ej: +56 9 8765 4321"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="guardianEmail" className="form-label">
              Email
            </label>
            <Input
              id="guardianEmail"
              name="guardianEmail"
              type="email"
              placeholder="Ej: apoderado@email.com"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="guardianAddress" className="form-label">
              Dirección
            </label>
            <Input
              id="guardianAddress"
              name="guardianAddress"
              type="text"
              placeholder="Ej: Av. Principal 456"
              disabled={isLoading}
            />
            <p className="form-help">
              Si es diferente a la del alumno
            </p>
          </div>

          <hr className="form-divider" />

          <h3 className="form-section-title">🚨 Contacto de Emergencia</h3>
          <p className="form-help" style={{ marginTop: '-0.5rem', marginBottom: '1rem' }}>
            Puede ser el mismo apoderado u otra persona
          </p>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="emergencyName" className="form-label">
                Nombre Completo
              </label>
              <Input
                id="emergencyName"
                name="emergencyName"
                type="text"
                placeholder="Ej: Pedro Silva"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="emergencyPhone" className="form-label">
                Teléfono
              </label>
              <Input
                id="emergencyPhone"
                name="emergencyPhone"
                type="tel"
                placeholder="Ej: +56 9 5555 5555"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="emergencyRelation" className="form-label">
              Relación con el Alumno
            </label>
            <Input
              id="emergencyRelation"
              name="emergencyRelation"
              type="text"
              placeholder="Ej: Padre, Tío, Vecino"
              disabled={isLoading}
            />
          </div>
        </div>
      )}

      {/* PESTAÑA: INFORMACIÓN MÉDICA */}
      {activeTab === 'medical' && (
        <div className="form-tab-content">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="bloodType" className="form-label">
                Tipo de Sangre
              </label>
              <Select
                id="bloodType"
                name="bloodType"
                disabled={isLoading}
                options={[
                  { value: '', label: 'Seleccionar...' },
                  { value: 'A+', label: 'A+' },
                  { value: 'A-', label: 'A-' },
                  { value: 'B+', label: 'B+' },
                  { value: 'B-', label: 'B-' },
                  { value: 'AB+', label: 'AB+' },
                  { value: 'AB-', label: 'AB-' },
                  { value: 'O+', label: 'O+' },
                  { value: 'O-', label: 'O-' },
                ]}
              />
            </div>

            <div className="form-group">
              <label htmlFor="healthInsurance" className="form-label">
                Previsión de Salud
              </label>
              <Input
                id="healthInsurance"
                name="healthInsurance"
                type="text"
                placeholder="Ej: Fonasa, Isapre"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="allergies" className="form-label">
              Alergias
            </label>
            <textarea
              id="allergies"
              name="allergies"
              className="form-textarea"
              placeholder="Ej: Polen, maní, lactosa..."
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="medicalConditions" className="form-label">
              Condiciones Médicas
            </label>
            <textarea
              id="medicalConditions"
              name="medicalConditions"
              className="form-textarea"
              placeholder="Ej: Asma, diabetes, epilepsia..."
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="medications" className="form-label">
              Medicamentos
            </label>
            <textarea
              id="medications"
              name="medications"
              className="form-textarea"
              placeholder="Ej: Inhalador para asma, insulina..."
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes" className="form-label">
              Notas Adicionales
            </label>
            <textarea
              id="notes"
              name="notes"
              className="form-textarea"
              placeholder="Cualquier información relevante..."
              disabled={isLoading}
              rows={3}
            />
          </div>
        </div>
      )}

      <div className="form-actions">
        <button
          type="button"
          onClick={closeModal}
          className="btn-secondary"
          disabled={isLoading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Creando...' : 'Crear Alumno'}
        </button>
      </div>
    </form>
  );
}
