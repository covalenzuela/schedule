/**
 * 🏷️ Componente Badge - Sistema de Horarios
 *
 * Badge/etiqueta para mostrar estado, categorías, etc.
 * Usa colores pastel de la paleta
 */

import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type BadgeVariant =
  | "primary"
  | "secondary"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: "bg-primary-100 text-primary-700 border-primary-200",
  secondary: "bg-secondary-100 text-secondary-700 border-secondary-200",
  accent: "bg-accent-100 text-accent-700 border-accent-200",
  success: "bg-success-100 text-success-700 border-success-200",
  warning: "bg-warning-100 text-warning-700 border-warning-200",
  danger: "bg-danger-100 text-danger-700 border-danger-200",
  neutral: "bg-neutral-100 text-neutral-700 border-neutral-200",
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
  lg: "px-3 py-1.5 text-base",
};

export function Badge({
  variant = "neutral",
  size = "md",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-full border",
        "transition-colors duration-200",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
