import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

export type DialogType = "info" | "success" | "warning" | "error";

export interface DialogOptions {
  title?: string;
  message: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface DialogContextType {
  showDialog: (options: DialogOptions | string) => void;
  showSuccess: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  showConfirm: (options: {
    message: string;
    title?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }) => void;
  closeDialog: () => void;
}

const DialogContext = createContext<DialogContextType | null>(null);

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentDialog, setCurrentDialog] = useState<DialogOptions | null>(null);

  const closeDialog = useCallback(() => {
    setCurrentDialog(null);
  }, []);

  const showDialog = useCallback((options: DialogOptions | string) => {
    if (typeof options === "string") {
      setCurrentDialog({
        title: "艦隊系統通訊",
        message: options,
        type: "info",
        confirmText: "了解",
      });
    } else {
      setCurrentDialog({
        title: options.title || "艦隊系統通訊",
        message: options.message,
        type: options.type || "info",
        confirmText: options.confirmText || "確定",
        cancelText: options.cancelText,
        onConfirm: options.onConfirm,
        onCancel: options.onCancel,
      });
    }

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([15]);
    }
  }, []);

  const showSuccess = useCallback(
    (message: string, title = "指令執行成功") => {
      showDialog({ title, message, type: "success", confirmText: "太棒了" });
    },
    [showDialog]
  );

  const showWarning = useCallback(
    (message: string, title = "通訊注意") => {
      showDialog({ title, message, type: "warning", confirmText: "知道了" });
    },
    [showDialog]
  );

  const showError = useCallback(
    (message: string, title = "系統警告") => {
      showDialog({ title, message, type: "error", confirmText: "關閉" });
    },
    [showDialog]
  );

  const showInfo = useCallback(
    (message: string, title = "艦隊廣播") => {
      showDialog({ title, message, type: "info", confirmText: "收到" });
    },
    [showDialog]
  );

  const showConfirm = useCallback(
    (options: {
      message: string;
      title?: string;
      confirmText?: string;
      cancelText?: string;
      onConfirm: () => void;
      onCancel?: () => void;
    }) => {
      showDialog({
        title: options.title || "確認操作",
        message: options.message,
        type: "warning",
        confirmText: options.confirmText || "確認",
        cancelText: options.cancelText || "取消",
        onConfirm: options.onConfirm,
        onCancel: options.onCancel,
      });
    },
    [showDialog]
  );

  // Fallback: Intercept window.alert so even unexpected alerts render as custom game dialog
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (msg?: any) => {
      showDialog({
        title: "艦橋通訊系統",
        message: String(msg ?? ""),
        type: "info",
        confirmText: "確認",
      });
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [showDialog]);

  // Handle escape / enter key
  useEffect(() => {
    if (!currentDialog) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (currentDialog.onCancel) {
          currentDialog.onCancel();
        }
        closeDialog();
      } else if (e.key === "Enter") {
        if (currentDialog.onConfirm) {
          currentDialog.onConfirm();
        }
        closeDialog();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentDialog, closeDialog]);

  const getStyleByType = (type: DialogType = "info") => {
    switch (type) {
      case "success":
        return {
          border: "border-emerald-500/80 shadow-[0_0_30px_rgba(16,185,129,0.3)]",
          iconBg: "bg-emerald-950/80 border-emerald-500/60 text-emerald-400",
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />,
          button:
            "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]",
          tagText: "text-emerald-400",
        };
      case "warning":
        return {
          border: "border-amber-500/80 shadow-[0_0_30px_rgba(245,158,11,0.3)]",
          iconBg: "bg-amber-950/80 border-amber-500/60 text-amber-400",
          icon: <AlertTriangle className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />,
          button:
            "bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]",
          tagText: "text-amber-400",
        };
      case "error":
        return {
          border: "border-rose-500/80 shadow-[0_0_30px_rgba(244,63,94,0.3)]",
          iconBg: "bg-rose-950/80 border-rose-500/60 text-rose-400",
          icon: <XCircle className="w-5 h-5 text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" />,
          button:
            "bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]",
          tagText: "text-rose-400",
        };
      case "info":
      default:
        return {
          border: "border-neon-cyan/80 shadow-[0_0_30px_rgba(0,240,255,0.3)]",
          iconBg: "bg-cyan-950/80 border-cyan-500/60 text-neon-cyan",
          icon: <Info className="w-5 h-5 text-neon-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]" />,
          button:
            "bg-gradient-to-r from-neon-cyan to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]",
          tagText: "text-neon-cyan",
        };
    }
  };

  const currentStyle = currentDialog ? getStyleByType(currentDialog.type) : null;

  return (
    <DialogContext.Provider
      value={{
        showDialog,
        showSuccess,
        showWarning,
        showError,
        showInfo,
        showConfirm,
        closeDialog,
      }}
    >
      {children}

      {/* Sci-Fi Game Modal Dialog */}
      {currentDialog && currentStyle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`relative w-full max-w-sm rounded-2xl bg-space-900 border-2 ${currentStyle.border} p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150`}
          >
            {/* Top decorative header */}
            <div className="flex items-center justify-between border-b border-space-800 pb-2">
              <span className={`text-[10px] font-mono tracking-wider uppercase font-bold ${currentStyle.tagText}`}>
                ◆ 0G PROTOCOL // {currentDialog.type?.toUpperCase() || "SYS"}
              </span>
              <button
                onClick={() => {
                  if (currentDialog.onCancel) currentDialog.onCancel();
                  closeDialog();
                }}
                className="p-1 rounded-md bg-space-850 hover:bg-space-800 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Content row */}
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${currentStyle.iconBg}`}
              >
                {currentStyle.icon}
              </div>

              <div className="space-y-1 text-left flex-1 min-w-0">
                <h3 className="text-sm font-bold font-mono text-gray-100 tracking-wide">
                  {currentDialog.title}
                </h3>
                <p className="text-xs text-gray-300 font-mono leading-relaxed whitespace-pre-wrap break-words">
                  {currentDialog.message}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center justify-end gap-2">
              {currentDialog.cancelText && (
                <button
                  onClick={() => {
                    if (currentDialog.onCancel) currentDialog.onCancel();
                    closeDialog();
                  }}
                  className="px-4 py-2 rounded-xl bg-space-850 hover:bg-space-800 border border-space-700 text-gray-300 text-xs font-mono font-bold active:scale-95 transition-all"
                >
                  {currentDialog.cancelText}
                </button>
              )}

              <button
                onClick={() => {
                  if (currentDialog.onConfirm) currentDialog.onConfirm();
                  closeDialog();
                }}
                className={`px-5 py-2 rounded-xl font-mono font-bold text-xs active:scale-95 transition-all ${currentStyle.button}`}
              >
                {currentDialog.confirmText || "確定"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
};

export const useDialog = (): DialogContextType => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
};
