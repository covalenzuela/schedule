/**
 * 🗑️ ConfirmDialog - Componente para confirmación de acciones destructivas
 */

"use client";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmDialog({
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  variant = "danger",
}: ConfirmDialogProps) {
  const variantStyles = {
    danger: "schools-card-btn-danger",
    warning: "schools-card-btn-warning",
    info: "schools-card-btn-primary",
  };

  return (
    <div className="confirm-dialog">
      <div className="confirm-dialog-icon">
        {variant === "danger" && "⚠️"}
        {variant === "warning" && "⚡"}
        {variant === "info" && "ℹ️"}
      </div>
      <h3 className="confirm-dialog-title">{title}</h3>
      <p className="confirm-dialog-message">{message}</p>
      <div className="confirm-dialog-actions">
        <button
          onClick={onCancel}
          className="schools-card-btn schools-card-btn-ghost"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          className={`schools-card-btn ${variantStyles[variant]}`}
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
}
