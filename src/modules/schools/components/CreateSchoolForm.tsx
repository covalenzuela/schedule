/**
 * 🏫 CreateSchoolForm - Formulario para crear un nuevo colegio
 *
 * Este componente se usa dentro de un modal
 */

"use client";

import { useState } from "react";
import { useModal } from "@/contexts/ModalContext";
import { createSchool } from "@/modules/schools/actions";
import { Input } from "@/components/ui";
import "./SchoolForms.css";

interface CreateSchoolFormProps {
  onSchoolCreated?: () => void;
}

export function CreateSchoolForm({ onSchoolCreated }: CreateSchoolFormProps) {
  const { closeModal } = useModal();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      address: formData.get("address") as string,
      phone: (formData.get("phone") as string) || undefined,
      email: (formData.get("email") as string) || undefined,
    };

    try {
      await createSchool(data);
      closeModal();
      // Llamar callback para actualizar la lista
      if (onSchoolCreated) {
        onSchoolCreated();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al crear el colegio"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="school-form">
      {error && <div className="form-error">{error}</div>}

      <div className="form-group">
        <label htmlFor="name" className="form-label">
          Nombre del Colegio <span className="required">*</span>
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Ej: Colegio San José"
          required
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="address" className="form-label">
          Dirección <span className="required">*</span>
        </label>
        <Input
          id="address"
          name="address"
          type="text"
          placeholder="Ej: Av. Principal 123, Santiago"
          required
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="phone" className="form-label">
          Teléfono
        </label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="Ej: +56 2 2345 6789"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="email" className="form-label">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Ej: contacto@colegio.cl"
          disabled={isLoading}
        />
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="auth-button auth-button-outline"
          onClick={closeModal}
          disabled={isLoading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="auth-button auth-button-primary"
          disabled={isLoading}
        >
          {isLoading ? "Creando..." : "Crear Colegio"}
        </button>
      </div>
    </form>
  );
}
