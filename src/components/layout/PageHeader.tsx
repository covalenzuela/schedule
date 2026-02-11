/**
 * 📄 Componente PageHeader - Sistema de Horarios
 *
 * Header de página con título, descripción y acciones
 */

import { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">{title}</h1>
          {description && (
            <p className="text-neutral-600 max-w-2xl">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
