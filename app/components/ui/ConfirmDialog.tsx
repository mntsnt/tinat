"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from "react";
import { AlertTriangle, Trash2, Info, X } from "lucide-react";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export interface AlertOptions {
  title?: string;
  message: string;
  buttonText?: string;
  variant?: "info" | "warning" | "danger";
}

interface DialogState {
  isOpen: boolean;
  type: "confirm" | "alert";
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  variant: "danger" | "warning" | "info";
}

interface ConfirmContextType {
  confirm: (options: string | ConfirmOptions) => Promise<boolean>;
  alert: (options: string | AlertOptions) => Promise<void>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    type: "confirm",
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    variant: "warning",
  });

  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  const confirm = useCallback((options: string | ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;

      if (typeof options === "string") {
        const isDestructive =
          options.toLowerCase().includes("delete") ||
          options.toLowerCase().includes("remove") ||
          options.toLowerCase().includes("suspend") ||
          options.toLowerCase().includes("purge");

        setDialogState({
          isOpen: true,
          type: "confirm",
          title: isDestructive ? "Confirm Deletion" : "Confirm Action",
          message: options,
          confirmText: isDestructive ? "Delete" : "Confirm",
          cancelText: "Cancel",
          variant: isDestructive ? "danger" : "warning",
        });
      } else {
        setDialogState({
          isOpen: true,
          type: "confirm",
          title: options.title || (options.variant === "danger" ? "Confirm Deletion" : "Confirm Action"),
          message: options.message,
          confirmText: options.confirmText || (options.variant === "danger" ? "Delete" : "Confirm"),
          cancelText: options.cancelText || "Cancel",
          variant: options.variant || "warning",
        });
      }
    });
  }, []);

  const alert = useCallback((options: string | AlertOptions): Promise<void> => {
    return new Promise((resolve) => {
      resolverRef.current = () => resolve();

      if (typeof options === "string") {
        setDialogState({
          isOpen: true,
          type: "alert",
          title: "Notice",
          message: options,
          confirmText: "OK",
          cancelText: "",
          variant: "info",
        });
      } else {
        setDialogState({
          isOpen: true,
          type: "alert",
          title: options.title || "Notice",
          message: options.message,
          confirmText: options.buttonText || "OK",
          cancelText: "",
          variant: options.variant || "info",
        });
      }
    });
  }, []);

  const handleConfirm = () => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  };

  const handleCancel = () => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  };

  // Keyboard accessibility
  useEffect(() => {
    if (!dialogState.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      } else if (e.key === "Enter" && !e.shiftKey) {
        // Only trigger confirm on Enter if active element is not cancel button
        if (document.activeElement !== cancelButtonRef.current) {
          e.preventDefault();
          handleConfirm();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Focus cancel button by default for safety on destructive actions
    setTimeout(() => {
      cancelButtonRef.current?.focus();
    }, 50);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dialogState.isOpen]);

  const renderIcon = () => {
    switch (dialogState.variant) {
      case "danger":
        return (
          <div className="w-11 h-11 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
        );
      case "warning":
        return (
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5" />
          </div>
        );
    }
  };

  const getConfirmButtonClasses = () => {
    switch (dialogState.variant) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 focus-visible:ring-red-500";
      case "warning":
        return "bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 focus-visible:ring-amber-500";
      default:
        return "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 focus-visible:ring-emerald-500";
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm, alert }}>
      {children}

      {dialogState.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-description"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={handleCancel}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close 'X' Button */}
            <button
              type="button"
              onClick={handleCancel}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              {renderIcon()}
              <div className="flex-1 pr-4">
                <h3
                  id="confirm-dialog-title"
                  className="text-lg font-bold text-foreground tracking-tight"
                >
                  {dialogState.title}
                </h3>
                <p
                  id="confirm-dialog-description"
                  className="mt-2 text-sm text-muted-foreground leading-relaxed"
                >
                  {dialogState.message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-2">
              {dialogState.type === "confirm" && (
                <button
                  ref={cancelButtonRef}
                  type="button"
                  onClick={handleCancel}
                  className="rounded-xl px-4 py-2 text-sm font-medium border border-border bg-background hover:bg-muted text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {dialogState.cancelText}
                </button>
              )}

              <button
                type="button"
                onClick={handleConfirm}
                className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${getConfirmButtonClasses()}`}
              >
                {dialogState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
}
