/**
 * 🧭 Componente Navbar - Sistema de Horarios
 *
 * Barra de navegación principal con diseño oscuro y menú hamburguesa responsive
 */

"use client";

import Link from "next/link";
import { useState, ReactNode } from "react";
import "./Navbar.css";

// Componente de Avatar de Usuario
function UserAvatar({ name }: { name?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      setIsLoading(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="navbar-user-menu">
      <button
        className="navbar-user-avatar"
        onClick={() => setIsOpen(!isOpen)}
        title={name || "Usuario"}
      >
        <span className="navbar-user-initials">{getInitials(name)}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="navbar-user-overlay"
            onClick={() => setIsOpen(false)}
          />
          <div className="navbar-user-dropdown">
            {name && (
              <div className="navbar-user-info">
                <span className="navbar-user-name">{name}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="navbar-user-logout"
            >
              🚪 {isLoading ? "Cerrando..." : "Cerrar Sesión"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Componente de Menú Dropdown
function DropdownMenu({
  title,
  icon,
  items,
}: {
  title: string;
  icon: string;
  items: { href: string; label: string; icon: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef[0]) {
      clearTimeout(timeoutRef[0]);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef[0] = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  return (
    <div
      className="navbar-dropdown"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button className="navbar-dropdown-trigger">
        {icon} {title}
        <span className={`navbar-dropdown-arrow ${isOpen ? "open" : ""}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div
          className="navbar-dropdown-menu"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="navbar-dropdown-item"
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export interface NavbarProps {
  children?: ReactNode;
  userName?: string;
}

export function Navbar({ children, userName }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const managementItems = [
    { href: "/schools", label: "Colegios", icon: "🏫" },
    { href: "/teachers", label: "Profesores", icon: "👨‍🏫" },
    { href: "/subjects", label: "Asignaturas", icon: "📚" },
    { href: "/courses", label: "Cursos", icon: "🎓" },
  ];

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          {/* Logo y título */}
          <Link href="/dashboard" className="navbar-logo" onClick={closeMenu}>
            <div className="navbar-logo-icon">
              <span>📅</span>
            </div>
            <div className="navbar-logo-text">
              <span className="navbar-title">Horarios</span>
            </div>
          </Link>

          {/* Navegación desktop */}
          <div className="navbar-menu-desktop">
            <NavLink href="/dashboard">🏠 Dashboard</NavLink>
            <DropdownMenu title="Gestión" icon="⚙️" items={managementItems} />
            <NavLink href="/schedules">🗓️ Horarios</NavLink>
          </div>

          {/* Acciones adicionales */}
          <div className="navbar-actions">
            <UserAvatar name={userName} />
            {children}
          </div>

          {/* Botón hamburguesa */}
          <button
            className={`navbar-hamburger ${isMenuOpen ? "active" : ""}`}
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Overlay */}
      {isMenuOpen && <div className="navbar-overlay" onClick={closeMenu} />}

      {/* Menú móvil deslizante */}
      <div className={`navbar-menu-mobile ${isMenuOpen ? "open" : ""}`}>
        <div className="navbar-menu-mobile-header">
          <span className="navbar-menu-mobile-title">Menú</span>
          <button
            className="navbar-menu-mobile-close"
            onClick={closeMenu}
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>

        <div className="navbar-menu-mobile-links">
          <MobileNavLink href="/dashboard" onClick={closeMenu}>
            🏠 Dashboard
          </MobileNavLink>

          {/* Sección de Gestión en móvil */}
          <div className="navbar-mobile-section">
            <div className="navbar-mobile-section-title">⚙️ Gestión</div>
            <MobileNavLink href="/schools" onClick={closeMenu}>
              🏫 Colegios
            </MobileNavLink>
            <MobileNavLink href="/teachers" onClick={closeMenu}>
              👨‍🏫 Profesores
            </MobileNavLink>
            <MobileNavLink href="/subjects" onClick={closeMenu}>
              📚 Asignaturas
            </MobileNavLink>
            <MobileNavLink href="/courses" onClick={closeMenu}>
              🎓 Cursos
            </MobileNavLink>
          </div>

          <MobileNavLink href="/schedules" onClick={closeMenu}>
            🗓️ Horarios
          </MobileNavLink>

          {/* Usuario y Logout en menú móvil */}
          {userName && (
            <div className="navbar-mobile-user">
              <span className="navbar-mobile-user-label">👤 {userName}</span>
            </div>
          )}

          <button
            onClick={async () => {
              try {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/auth/login";
              } catch (error) {
                console.error("Error al cerrar sesión:", error);
              }
            }}
            className="navbar-mobile-logout"
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      </div>
    </>
  );
}

interface NavLinkProps {
  href: string;
  children: ReactNode;
}

function NavLink({ href, children }: NavLinkProps) {
  return (
    <Link href={href} className="navbar-link">
      {children}
    </Link>
  );
}

interface MobileNavLinkProps extends NavLinkProps {
  onClick: () => void;
}

function MobileNavLink({ href, children, onClick }: MobileNavLinkProps) {
  return (
    <Link href={href} className="navbar-mobile-link" onClick={onClick}>
      {children}
    </Link>
  );
}
