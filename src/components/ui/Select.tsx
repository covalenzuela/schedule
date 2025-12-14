/**
 * 📋 Componente Select - Sistema de Horarios
 *
 * Select dropdown reutilizable
 * Diseño consistente con Input
 *
 * NOTA: Usa color-scheme: dark para asegurar que las opciones
 * tengan fondo oscuro y texto blanco en todos los navegadores
 */

import { SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, error, helperText, options, placeholder, className, ...props },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "rgba(255, 255, 255, 0.9)" }}
          >
            {label}
            {props.required && (
              <span
                style={{ color: "var(--danger-400)", marginLeft: "0.25rem" }}
              >
                *
              </span>
            )}
          </label>
        )}
        <select
          ref={ref}
          className={cn(className)}
          style={{
            width: "100%",
            padding: "0.75rem 1rem",
            borderRadius: "0.75rem",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            background: "rgba(255, 255, 255, 0.08)",
            color: "#fff",
            fontSize: "1rem",
            transition: "all 0.2s ease",
            cursor: "pointer",
            appearance: "none",
            backgroundImage:
              "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 0.75rem center",
            backgroundSize: "1.25rem",
            paddingRight: "2.5rem",
            colorScheme: "dark",
            ...((props as any).style || {}),
          }}
          onFocus={(e) => {
            e.target.style.outline = "none";
            e.target.style.borderColor = "var(--primary-400)";
            e.target.style.background = "rgba(255, 255, 255, 0.12)";
            e.target.style.boxShadow = "0 0 0 3px rgba(13, 139, 255, 0.1)";
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
            e.target.style.background = "rgba(255, 255, 255, 0.08)";
            e.target.style.boxShadow = "none";
            props.onBlur?.(e);
          }}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p
            className="mt-1.5 text-sm"
            style={{ color: "#fca5a5", fontWeight: "500" }}
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            className="mt-1.5 text-sm"
            style={{ color: "rgba(255, 255, 255, 0.6)" }}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
