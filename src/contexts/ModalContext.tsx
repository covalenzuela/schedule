/**
 * 🎭 Modal Context - Sistema de modales global y escalable
 *
 * Este contexto permite abrir modales desde cualquier parte de la aplicación
 * pasando contenido dinámico como children o componentes.
 */

"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface ModalContextValue {
  isOpen: boolean;
  content: ReactNode | null;
  title: string;
  openModal: (content: ReactNode, title?: string, options?: { maxWidth?: string }) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<ReactNode | null>(null);
  const [title, setTitle] = useState("");
  const [modalMaxWidth, setModalMaxWidth] = useState<string | undefined>(undefined);

  const openModal = (content: ReactNode, title: string = "", options?: { maxWidth?: string }) => {
    setContent(content);
    setTitle(title);
    setModalMaxWidth(options?.maxWidth);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    // Limpiar el contenido después de la animación de cierre
    setTimeout(() => {
      setContent(null);
      setTitle("");
      setModalMaxWidth(undefined);
    }, 300);
  };

  // mantener una copia en `window.__modalMaxWidth` para compatibilidad con Modal
  useEffect(() => {
    const w = window as unknown as { __modalMaxWidth?: string | undefined };
    if (typeof w !== "undefined") {
      w.__modalMaxWidth = modalMaxWidth;
    }
    return () => {
      if (typeof w !== "undefined") {
        delete w.__modalMaxWidth;
      }
    };
  }, [modalMaxWidth]);

  // expose modalMaxWidth on window so `Modal` (which imports `useModal`) can read it
  // do this in an effect to satisfy react-hooks/immutability and avoid inline mutations
  // (also prevents SSR access since effect runs only on client)
  return (
    <ModalContext.Provider
      value={{ isOpen, content, title, openModal, closeModal }}
    >
      {children}
    </ModalContext.Provider>
  );

}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}
