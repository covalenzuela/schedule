/**
 * 🏗️ Componente Container - Sistema de Horarios
 *
 * Container responsive para contenido de página
 */

import { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface ContainerProps {
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
}

const sizeStyles = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-7xl",
  xl: "max-w-[1400px]",
  full: "max-w-full",
};

export function Container({
  children,
  size = "lg",
  className,
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto px-4 sm:px-6 lg:px-8 py-8",
        sizeStyles[size],
        className
      )}
    >
      {children}
    </div>
  );
}
