"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
}

interface ToastContextType {
  toast: (item: Omit<ToastItem, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ title, description, type = "info" }: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, description, type }]);

      setTimeout(() => {
        removeToast(id);
      }, 3500);
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, description?: string) => addToast({ title, description, type: "success" }),
    [addToast]
  );
  const error = useCallback(
    (title: string, description?: string) => addToast({ title, description, type: "error" }),
    [addToast]
  );
  const info = useCallback(
    (title: string, description?: string) => addToast({ title, description, type: "info" }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info }}>
      {children}
      {/* Toast Overlay Container */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0"
      >
        {toasts.map((t) => {
          const isSuccess = t.type === "success";
          const isError = t.type === "error";

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-xl backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-3 ${
                isSuccess
                  ? "bg-emerald-950/90 border-emerald-500/30 text-white dark:bg-emerald-950/95"
                  : isError
                  ? "bg-destructive/95 border-destructive/40 text-destructive-foreground"
                  : "bg-card/95 border-border text-foreground dark:bg-card/95"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isSuccess ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : isError ? (
                  <AlertCircle className="h-4 w-4 text-white" />
                ) : (
                  <Info className="h-4 w-4 text-primary" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold leading-tight">{t.title}</p>
                {t.description && (
                  <p className="mt-1 text-[11px] opacity-90 leading-snug">{t.description}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="shrink-0 p-1 rounded-md opacity-70 hover:opacity-100 transition-opacity"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
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
    // Graceful fallback if invoked outside provider
    return {
      toast: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
    };
  }
  return context;
}
