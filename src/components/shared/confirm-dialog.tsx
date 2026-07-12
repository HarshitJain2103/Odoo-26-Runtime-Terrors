"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";


interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
      onClose();
    }
  }

  const confirmColors = {
    danger: { bg: "#ef4444", hover: "#dc2626", text: "white" },
    warning: { bg: "#f59e0b", hover: "#d97706", text: "white" },
    default: { bg: "#714b67", hover: "#5a3a52", text: "white" },
  };

  const colors = confirmColors[variant];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: variant === "danger" ? "#fee2e2" : variant === "warning" ? "#fef3c7" : "#f5f0f4",
                }}
              >
                <AlertTriangle
                  size={20}
                  style={{
                    color: variant === "danger" ? "#ef4444" : variant === "warning" ? "#f59e0b" : "#714b67",
                  }}
                />
              </div>
              <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors ml-4"
            >
              <X size={18} />
            </button>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-500 ml-13 mb-6 leading-relaxed pl-13" style={{ paddingLeft: "3.25rem" }}>
            {description}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="btn-secondary text-sm"
            >
              {cancelLabel}
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: colors.bg, color: colors.text }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.background = colors.hover)}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.background = colors.bg)}
              suppressHydrationWarning
            >
              {loading && (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
              )}
              {loading ? "Processing…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
