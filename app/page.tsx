"use static";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/config/site";

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Header/Nav con glassmorphism */}
      <header className="landing-nav">
        <div className="landing-nav-container">
          <Link href="/" className="landing-logo">
            <div className="landing-logo-icon">
              <span>📅</span>
            </div>
            <span className="landing-logo-text">{siteConfig.name}</span>
          </Link>
          <nav className="landing-menu">
            <a href="#features" className="landing-menu-link">
              Características
            </a>
            <Link href="/auth/login">
              <button className="landing-btn-login">Iniciar Sesión</button>
            </Link>
            <Link href="/auth/register">
              <button className="landing-btn-register">Comenzar Gratis</button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-bg">
          <div className="landing-hero-gradient"></div>
          <div className="landing-hero-orb landing-hero-orb-1"></div>
          <div className="landing-hero-orb landing-hero-orb-2"></div>
          <div className="landing-hero-orb landing-hero-orb-3"></div>
          <div className="landing-hero-grid"></div>
        </div>

        <div className="landing-hero-content">
          <div className="landing-hero-badge">
            <span className="landing-hero-badge-pulse"></span>
            <span className="landing-hero-badge-text">
              ✨ El futuro de la gestión de horarios
            </span>
          </div>

          <h1 className="landing-hero-title">
            Organiza horarios
            <br />
            <span className="landing-hero-title-gradient">
              sin complicaciones
            </span>
          </h1>

          <p className="landing-hero-description">
            La plataforma más avanzada para gestionar horarios escolares.
            Automatiza la asignación, detecta conflictos y optimiza recursos con
            IA.
          </p>

          <div className="landing-hero-actions">
            <Link href="/auth/register">
              <Button size="lg" className="landing-hero-btn-primary">
                🚀 Comenzar Ahora
              </Button>
            </Link>
            <Link href="#demo">
              <Button
                variant="outline"
                size="lg"
                className="landing-hero-btn-secondary"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                Ver Demo
              </Button>
            </Link>
          </div>

          <p className="landing-hero-footer">✨ Sin tarjeta</p>

          {/* Dashboard Preview con glassmorphism */}
          <div className="landing-hero-preview">
            <div className="landing-hero-preview-card">
              <div className="landing-hero-preview-header">
                <div className="landing-hero-preview-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="landing-hero-preview-title">
                  dashboard.{siteConfig.domain}
                </span>
              </div>
              <div className="landing-hero-preview-content">
                <div className="landing-hero-preview-grid">
                  <div className="landing-hero-preview-block"></div>
                  <div className="landing-hero-preview-block"></div>
                  <div className="landing-hero-preview-block"></div>
                  <div className="landing-hero-preview-block"></div>
                  <div className="landing-hero-preview-block"></div>
                  <div className="landing-hero-preview-block"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="landing-features">
        <div className="landing-section-header">
          <h2 className="landing-section-title">Todo lo que necesitas</h2>
          <p className="landing-section-subtitle">
            Herramientas poderosas diseñadas para simplificar tu trabajo
          </p>
        </div>

        <div className="landing-features-grid">
          {[
            {
              icon: "🤖",
              title: "Asignación Inteligente",
              description:
                "Algoritmos de IA que optimizan automáticamente la asignación de profesores y aulas.",
            },
            {
              icon: "⚡",
              title: "Detección Instantánea",
              description:
                "Identifica conflictos de horarios en tiempo real antes de que sean un problema.",
            },
            {
              icon: "👥",
              title: "Multi-Institución",
              description:
                "Gestiona múltiples colegios desde una única cuenta centralizada.",
            },
            {
              icon: "📊",
              title: "Analytics Avanzado",
              description:
                "Visualiza estadísticas y KPIs de utilización de recursos en tiempo real.",
            },
            {
              icon: "🔄",
              title: "Sincronización en Vivo",
              description:
                "Cambios instantáneos sincronizados en todos los dispositivos del equipo.",
            },
            {
              icon: "🎨",
              title: "Diseño Intuitivo",
              description:
                "Interfaz moderna y fácil de usar. Tu equipo estará operando en minutos.",
            },
          ].map((feature, index) => (
            <div key={index} className="landing-feature-card">
              <div className="landing-feature-icon">{feature.icon}</div>
              <h3 className="landing-feature-title">{feature.title}</h3>
              <p className="landing-feature-description">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-content">
          <div className="landing-footer-grid">
            <div className="landing-footer-brand">
              <div className="landing-footer-logo">
                <div className="landing-footer-logo-icon">📅</div>
                <span className="landing-footer-logo-text">
                  {siteConfig.name}
                </span>
              </div>
              <p className="landing-footer-tagline">{siteConfig.tagline}</p>
            </div>
            <div className="landing-footer-links">
              <h4>Producto</h4>
              <ul>
                <li>
                  <a href="#features">Características</a>
                </li>
              </ul>
            </div>
            <div className="landing-footer-links">
              <h4>Legal</h4>
              <ul>
                <li>
                  <a href="#privacy">Privacidad</a>
                </li>
                <li>
                  <a href="#terms">Términos</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="landing-footer-bottom">
            <p>&copy; 2025 {siteConfig.name}. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
