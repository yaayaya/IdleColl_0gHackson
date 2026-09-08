import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertTriangle, XCircle, Info, X, ShieldAlert } from "lucide-react";

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
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const closeDialog = useCallback(() => {
    setCurrentDialog(null);
  }, []);

  const showDialog = useCallback((options: DialogOptions | string) => {
    if (typeof options === "string") {
      setCurrentDialog({
        title: "艦隊系統通訊",
        message: options,
        type: "info",
        confirmText: "確認",
      });
    } else {
      setCurrentDialog({
        title: options.title || "艦隊系統通訊",
        message: options.message,
        type: options.type || "info",
        confirmText: options.confirmText || "確認",
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
          border: "border-emerald-500/70 shadow-[0_0_40px_rgba(16,185,129,0.25)]",
          iconBg: "bg-emerald-950/80 border-emerald-500/50 text-emerald-400",
          icon: <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />,
          button:
            "bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-black shadow-[0_0_18px_rgba(16,185,129,0.4)]",
          tagText: "text-emerald-400",
          dotColor: "bg-emerald-400",
          accentGlow: "from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981]",
        };
      case "warning":
        return {
          border: "border-amber-500/70 shadow-[0_0_40px_rgba(245,158,11,0.25)]",
          iconBg: "bg-amber-950/80 border-amber-500/50 text-amber-400",
          icon: <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]" />,
          button:
            "bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black shadow-[0_0_18px_rgba(245,158,11,0.4)]",
          tagText: "text-amber-400",
          dotColor: "bg-amber-400",
          accentGlow: "from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#f59e0b]",
        };
      case "error":
        return {
          border: "border-rose-500/70 shadow-[0_0_40px_rgba(244,63,94,0.25)]",
          iconBg: "bg-rose-950/80 border-rose-500/50 text-rose-400",
          icon: <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]" />,
          button:
            "bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white shadow-[0_0_18px_rgba(244,63,94,0.4)]",
          tagText: "text-rose-400",
          dotColor: "bg-rose-400",
          accentGlow: "from-transparent via-rose-500 to-transparent shadow-[0_0_12px_#f43f5e]",
        };
      case "info":
      default:
        return {
          border: "border-neon-cyan/70 shadow-[0_0_40px_rgba(0,240,255,0.25)]",
          iconBg: "bg-cyan-950/80 border-cyan-500/50 text-neon-cyan",
          icon: <Info className="w-5 h-5 sm:w-6 sm:h-6 text-neon-cyan drop-shadow-[0_0_10px_rgba(0,240,255,0.8)]" />,
          button:
            "bg-gradient-to-r from-neon-cyan via-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black shadow-[0_0_18px_rgba(0,240,255,0.4)]",
          tagText: "text-neon-cyan",
          dotColor: "bg-neon-cyan",
          accentGlow: "from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#00f0ff]",
        };
    }
  };

  const currentStyle = currentDialog ? getStyleByType(currentDialog.type) : null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && currentDialog) {
      if (currentDialog.onCancel) {
        currentDialog.onCancel();
      }
      closeDialog();
    }
  };

  const handleCancelClick = () => {
    if (currentDialog?.onCancel) {
      currentDialog.onCancel();
    }
    closeDialog();
  };

  const handleConfirmClick = () => {
    if (currentDialog?.onConfirm) {
      currentDialog.onConfirm();
    }
    closeDialog();
  };

  const dialogModal =
    mounted && currentDialog && currentStyle ? (
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
        onClick={handleBackdropClick}
      >
        <div
          className={`relative w-full max-w-sm sm:max-w-md rounded-2xl bg-space-900/95 border-2 ${currentStyle.border} p-5 sm:p-6 space-y-4 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200 overflow-hidden`}
        >
          {/* Top ambient glowing accent line */}
          <div
            className={`absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r ${currentStyle.accentGlow}`}
          />

          {/* Top decorative header */}
          <div className="flex items-center justify-between border-b border-space-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${currentStyle.dotColor} shadow-[0_0_8px_currentColor]`} />
              <span
                className={`text-[10px] sm:text-[11px] font-mono tracking-wider uppercase font-bold ${currentStyle.tagText}`}
              >
                ◆ 0G PROTOCOL // {currentDialog.type?.toUpperCase() || "SYS"}
              </span>
            </div>
            <button
              onClick={handleCancelClick}
              className="p-1.5 rounded-lg bg-space-850 hover:bg-space-800 border border-space-700/60 hover:border-space-600 text-gray-400 hover:text-white transition-all active:scale-95"
              title="關閉"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Content section */}
          <div className="flex items-start gap-3.5 pt-1">
            <div
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl border flex items-center justify-center shrink-0 shadow-lg ${currentStyle.iconBg}`}
            >
              {currentStyle.icon}
            </div>

            <div className="space-y-1.5 text-left flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-bold font-mono text-gray-100 tracking-wide">
                {currentDialog.title}
              </h3>
              <div className="rounded-xl bg-space-950/70 border border-space-800/80 p-3 sm:p-3.5 text-xs sm:text-sm text-gray-300 font-mono leading-relaxed whitespace-pre-wrap break-words">
                {currentDialog.message}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2">
            {currentDialog.cancelText ? (
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <button
                  onClick={handleCancelClick}
                  className="w-full py-2.5 px-4 rounded-xl bg-space-850 hover:bg-space-800 border border-space-700 hover:border-space-600 text-gray-300 hover:text-white text-xs sm:text-sm font-mono font-bold active:scale-95 transition-all cursor-pointer"
                >
                  {currentDialog.cancelText}
                </button>
                <button
                  onClick={handleConfirmClick}
                  className={`w-full py-2.5 px-4 rounded-xl font-mono font-bold text-xs sm:text-sm active:scale-95 transition-all cursor-pointer ${currentStyle.button}`}
                >
                  {currentDialog.confirmText || "確認"}
                </button>
              </div>
            ) : (
              <button
                onClick={handleConfirmClick}
                className={`w-full py-2.5 sm:py-3 px-5 rounded-xl font-mono font-bold text-xs sm:text-sm active:scale-95 transition-all cursor-pointer ${currentStyle.button}`}
              >
                {currentDialog.confirmText || "確定"}
              </button>
            )}
          </div>
        </div>
      </div>
    ) : null;

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
      {dialogModal && createPortal(dialogModal, document.body)}
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
