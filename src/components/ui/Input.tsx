/**
 * ⌨️ Componente Input - Sistema de Horarios
 *
 * Input reutilizable para formularios
 * Diseño pastel limpio
 */

import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, value, onChange, ...props }, ref) => {
    // Si se pasa value pero no onChange, el componente debe ser no controlado
    const isControlled = value !== undefined && onChange !== undefined;
    const inputProps = isControlled
      ? { value: value ?? "", onChange }
      : { defaultValue: value, onChange };

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
        <input
          ref={ref}
          className={cn(className)}
          {...inputProps}
          style={{
            width: "100%",
            padding: "0.75rem 1rem",
            borderRadius: "0.75rem",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            background: "rgba(255, 255, 255, 0.08)",
            color: "#fff",
            fontSize: "1rem",
            transition: "all 0.2s ease",
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
        />
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

Input.displayName = "Input";
