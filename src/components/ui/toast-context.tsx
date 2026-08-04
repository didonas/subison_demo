"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<Toast, "id">) => string;
  addToast: (toast: Omit<Toast, "id">) => string;
  dismissToast: (id: string) => void;
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastCounter = 0;

function createToastId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  toastCounter += 1;
  return `snc-toast-${toastCounter}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 5000 }: Omit<Toast, "id">) => {
      const id = createToastId();
      const newToast: Toast = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [dismissToast]
  );

  const success = useCallback((title: string, message?: string) => showToast({ type: "success", title, message }), [showToast]);
  const error = useCallback((title: string, message?: string) => showToast({ type: "error", title, message, duration: 7000 }), [showToast]);
  const warning = useCallback((title: string, message?: string) => showToast({ type: "warning", title, message }), [showToast]);
  const info = useCallback((title: string, message?: string) => showToast({ type: "info", title, message }), [showToast]);

  // Global Escape key listener to dismiss newest toast
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && toasts.length > 0) {
        dismissToast(toasts[toasts.length - 1].id);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toasts, dismissToast]);

  return (
    <ToastContext.Provider value={{ showToast, addToast: showToast, dismissToast, success, error, warning, info }}>
      {children}
      {/* Accessible Toast Container */}
      <div
        aria-live="polite"
        aria-relevant="additions text"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none p-4 sm:p-0"
      >
        {toasts.map((toast) => {
          const isError = toast.type === "error";
          const isWarning = toast.type === "warning";
          const isSuccess = toast.type === "success";

          const borderColors = isSuccess
            ? "border-emerald-500/40 bg-white dark:bg-slate-900 shadow-elevation-md text-slate-900 dark:text-white"
            : isError
            ? "border-red-500/40 bg-white dark:bg-slate-900 shadow-elevation-md text-slate-900 dark:text-white"
            : isWarning
            ? "border-amber-500/40 bg-white dark:bg-slate-900 shadow-elevation-md text-slate-900 dark:text-white"
            : "border-sky-500/40 bg-white dark:bg-slate-900 shadow-elevation-md text-slate-900 dark:text-white";

          const iconColor = isSuccess
            ? "text-emerald-500"
            : isError
            ? "text-red-500"
            : isWarning
            ? "text-amber-500"
            : "text-sky-500";

          const IconComponent = isSuccess
            ? CheckCircle2
            : isError
            ? AlertCircle
            : isWarning
            ? AlertTriangle
            : Info;

          return (
            <div
              key={toast.id}
              role={isError ? "alert" : "status"}
              className={`pointer-events-auto rounded-2xl border p-4 flex items-start gap-3.5 transition-all duration-200 ${borderColors}`}
            >
              <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{toast.title}</div>
                {toast.message && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{toast.message}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Close notification"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition focus-ring"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
