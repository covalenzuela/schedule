/**
 * 📱 Componente Sidebar - Sistema de Horarios
 *
 * Sidebar colapsable para navegación secundaria
 */

import Link from "next/link";
import { ReactNode } from "react";

export interface SidebarProps {
  children: ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  return (
    <aside className="hidden lg:block w-64 bg-white border-r border-neutral-200 min-h-screen">
      <div className="p-6 space-y-6">{children}</div>
    </aside>
  );
}

export interface SidebarSectionProps {
  title: string;
  children: ReactNode;
}

export function SidebarSection({ title, children }: SidebarSectionProps) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export interface SidebarLinkProps {
  href: string;
  icon?: string;
  children: ReactNode;
  active?: boolean;
}

export function SidebarLink({
  href,
  icon,
  children,
  active,
}: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
        transition-all duration-200
        ${
          active
            ? "bg-primary-100 text-primary-700"
            : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
        }
      `}
    >
      {icon && <span className="text-lg">{icon}</span>}
      <span>{children}</span>
    </Link>
  );
}
