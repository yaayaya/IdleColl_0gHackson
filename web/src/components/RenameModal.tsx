import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { User, Check, X, Shield, Sparkles } from "lucide-react";

interface RenameModalProps {
  isOpen: boolean;
  currentName: string;
  onClose: () => void;
  onSave: (newName: string) => Promise<boolean>;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  currentName,
  onClose,
  onSave,
}) => {
  const [mounted, setMounted] = useState(false);
  const [nameInput, setNameInput] = useState(currentName);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setNameInput(currentName);
    setError(null);
  }, [isOpen, currentName]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setError("艦長暱稱不可為空白！");
      return;
    }
    if (trimmed.length > 20) {
      setError("暱稱長度上限為 20 個字元！");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const success = await onSave(trimmed);
      if (success) {
        onClose();
      } else {
        setError("暱稱修改失敗，請稍後再試！");
      }
    } catch (err: any) {
      setError(err?.message || "網路異常，請稍後再試！");
    } finally {
      setIsSaving(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-sm my-auto max-h-[calc(100dvh-2rem)] flex flex-col rounded-2xl bg-space-900/98 border-2 border-cyan-500/60 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Top ambient laser glow line */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#00f0ff]" />

        {/* Top Header */}
        <div className="flex items-center justify-between p-4 pb-3 border-b border-space-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-neon-cyan shadow-[0_0_10px_rgba(0,240,255,0.35)]">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-gray-100 uppercase tracking-wider">
                自訂艦長暱稱
              </h3>
              <p className="text-[10px] text-cyan-400/80 font-mono tracking-wider">
                CAPTAIN IDENTIFICATION // RENAME
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-space-850 hover:bg-space-800 border border-space-700/60 text-gray-400 hover:text-white transition-all active:scale-95 flex items-center justify-center touch-manipulation cursor-pointer"
            title="關閉"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4 flex-1 text-left">
          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-gray-300">
              請輸入專屬星際呼號 (1 ~ 20 字)：
            </label>
            <div className="relative">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  if (error) setError(null);
                }}
                maxLength={20}
                placeholder="例如：銀河漫步者、0G 先鋒官..."
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-space-950/80 border border-space-700 focus:border-cyan-400 text-sm font-mono text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-400/40 transition-all"
                autoFocus
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-500">
                {nameInput.length}/20
              </span>
            </div>
            {error && (
              <p className="text-[11px] font-mono text-rose-400 pt-0.5">{error}</p>
            )}
          </div>

          <div className="p-3 rounded-xl bg-space-950/60 border border-space-800/80 text-[11px] font-mono text-gray-400 leading-relaxed">
            💡 暱稱將展示於艦橋儀表板、深空雷達通訊與 0G 拍賣場買賣紀錄中。
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-space-850 hover:bg-space-800 border border-space-700 text-gray-300 text-xs font-mono font-bold active:scale-95 transition-all cursor-pointer touch-manipulation flex items-center justify-center"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-neon-cyan via-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-mono font-bold text-xs shadow-[0_0_15px_rgba(0,240,255,0.4)] active:scale-95 transition-all cursor-pointer touch-manipulation flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? (
                <span>儲存中...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>確認修改</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
