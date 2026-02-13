/**
 * 🎯 Componente SkipToMain - Mejora de accesibilidad
 * Link para saltar al contenido principal (hidden hasta focus)
 */

"use client";

export function SkipToMain() {
  return (
    <a 
      href="#main-content" 
      className="skip-to-main"
      style={{
        position: "absolute",
        top: "-40px",
        left: 0,
        background: "var(--primary-600)",
        color: "white",
        padding: "0.5rem 1rem",
        textDecoration: "none",
        borderRadius: "0 0 0.25rem 0",
        zIndex: 100,
        fontWeight: 600,
        transition: "top 0.2s",
      }}
      onFocus={(e) => {
        e.currentTarget.style.top = "0";
      }}
      onBlur={(e) => {
        e.currentTarget.style.top = "-40px";
      }}
    >
      Saltar al contenido principal
    </a>
  );
}
