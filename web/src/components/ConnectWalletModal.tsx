import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Smartphone,
  Monitor,
  ExternalLink,
  Copy,
  Check,
  Wallet,
  X,
  Zap,
  ShieldCheck,
  Globe,
  Radio,
} from "lucide-react";
import { getEthereumProvider, isMobileDevice } from "../hooks/useWeb3.ts";

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectMetaMask: () => void;
}

export const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({
  isOpen,
  onClose,
  onConnectMetaMask,
}) => {
  const [mounted, setMounted] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [hasInjectedProvider, setHasInjectedProvider] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsMobile(isMobileDevice());
    const eth = getEthereumProvider();
    setHasInjectedProvider(Boolean(eth));
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const currentUrl =
    typeof window !== "undefined"
      ? window.location.href
      : "https://idlecoll.yayayayaya.xyz";
  const host =
    typeof window !== "undefined"
      ? window.location.host
      : "idlecoll.yayayayaya.xyz";
  const metaMaskDeepLink = `https://metamask.app.link/dapp/${host}`;

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      if (navigator.vibrate) navigator.vibrate([15]);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenMetaMaskApp = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([20]);
    }
    window.location.href = metaMaskDeepLink;
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-sm sm:max-w-md my-auto max-h-[calc(100dvh-2rem)] flex flex-col rounded-2xl bg-space-900/98 border border-cyan-500/50 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Top ambient glowing cyber line */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#00f0ff]" />

        {/* Top Header */}
        <div className="flex items-center justify-between p-4 pb-3 border-b border-space-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-neon-cyan shadow-[0_0_12px_rgba(0,240,255,0.35)]">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-gray-100 uppercase tracking-wider flex items-center gap-1.5">
                <span>連線 0G 星際艦隊</span>
              </h3>
              <p className="text-[10px] text-cyan-400/80 font-mono tracking-wider uppercase">
                WALLET AUTHENTICATION PROTOCOL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-space-850 hover:bg-space-800 border border-space-700/60 hover:border-space-600 text-gray-400 hover:text-white transition-all active:scale-95 flex items-center justify-center touch-manipulation cursor-pointer"
            title="關閉視窗"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-3.5 flex-1 text-left">
          {/* Device & Protocol Status Badge */}
          <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-space-950/80 border border-space-800 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-gray-300">
              {isMobile ? (
                <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <Monitor className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>{isMobile ? "行動裝置 (Mobile)" : "電腦終端 (Desktop)"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  hasInjectedProvider
                    ? "bg-emerald-400 shadow-[0_0_6px_#34d399]"
                    : "bg-amber-400 shadow-[0_0_6px_#fbbf24]"
                }`}
              />
              <span
                className={`text-[10px] font-bold ${
                  hasInjectedProvider ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {hasInjectedProvider
                  ? "Web3 外掛已就緒"
                  : isMobile
                  ? "支援 App 喚醒"
                  : "尚未偵測到外掛"}
              </span>
            </div>
          </div>

          {/* Dynamic Context Actions */}
          <div className="space-y-3">
            {hasInjectedProvider ? (
              /* Case 1: Injected Provider Detected (e.g. Chrome Extension or In-App Browser) */
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-gray-300 text-xs font-mono leading-relaxed">
                  系統已偵測到您的瀏覽器錢包外掛，點擊下方即可授權連線並自動切換至{" "}
                  <strong className="text-cyan-300">0G Galileo 測試網</strong>。
                </div>

                <button
                  onClick={() => {
                    onConnectMetaMask();
                    onClose();
                  }}
                  className="w-full min-h-[44px] py-3 rounded-xl bg-gradient-to-r from-neon-cyan via-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-mono font-bold text-xs shadow-[0_0_20px_rgba(0,240,255,0.45)] active:scale-95 flex items-center justify-center gap-2 transition-all cursor-pointer touch-manipulation"
                >
                  <Wallet className="w-4 h-4 text-black" />
                  <span>立即授權連線錢包</span>
                </button>
              </div>
            ) : isMobile ? (
              /* Case 2: Mobile Safari / Mobile Chrome */
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-gray-300 text-xs font-mono leading-relaxed space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    <span>MetaMask 手機連線協定</span>
                  </div>
                  <p className="text-[11px] text-gray-300">
                    可直接喚醒手機端 MetaMask App 授權，或透過內建專用瀏覽器體驗最順暢的 Web3 操作。
                  </p>
                </div>

                {/* Primary Action: Direct SDK Wakeup */}
                <button
                  onClick={() => {
                    onConnectMetaMask();
                    onClose();
                  }}
                  className="w-full min-h-[44px] py-3 rounded-xl bg-gradient-to-r from-neon-cyan via-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-mono font-bold text-xs shadow-[0_0_20px_rgba(0,240,255,0.45)] active:scale-95 flex items-center justify-center gap-2 transition-all cursor-pointer touch-manipulation"
                >
                  <Wallet className="w-4 h-4 text-black" />
                  <span>🚀 喚醒手機 MetaMask App 連線</span>
                </button>

                {/* Secondary Action: Open in MetaMask App Browser */}
                <button
                  onClick={handleOpenMetaMaskApp}
                  className="w-full min-h-[44px] py-2.5 rounded-xl bg-space-850 hover:bg-space-800 border border-space-700 hover:border-cyan-500/40 text-cyan-300 font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer touch-manipulation"
                >
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>在 MetaMask 內建瀏覽器中開啟</span>
                </button>

                {/* Tertiary Action: Copy Game Link */}
                <button
                  onClick={handleCopy}
                  className="w-full min-h-[44px] py-2 rounded-xl bg-space-950/60 hover:bg-space-850 border border-space-800 text-gray-400 hover:text-gray-200 font-mono text-[11px] flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer touch-manipulation"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-gray-500" />
                  )}
                  <span>{copied ? "已複製遊戲專屬網址！" : "複製遊戲網址 (前往 MetaMask 開啟)"}</span>
                </button>
              </div>
            ) : (
              /* Case 3: Desktop Browser without injected provider */
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-gray-300 text-xs font-mono leading-relaxed space-y-1.5">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                    <Monitor className="w-4 h-4 text-cyan-400" />
                    <span>電腦端外掛登入 (Browser Extension)</span>
                  </div>
                  <p className="text-[11px] text-gray-300 leading-normal">
                    為確保 0G Galileo 區塊鏈合約互動安全與簽署順暢，電腦端請使用 <strong>MetaMask 等 Web3 瀏覽器擴充外掛</strong>。目前尚未偵測到外掛。
                  </p>
                </div>

                {/* Action 1: Install Extension */}
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full min-h-[44px] py-3 rounded-xl bg-gradient-to-r from-neon-cyan via-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-mono font-bold text-xs shadow-[0_0_20px_rgba(0,240,255,0.45)] active:scale-95 flex items-center justify-center gap-2 transition-all"
                >
                  <ExternalLink className="w-4 h-4 text-black" />
                  <span>前往安裝 MetaMask 瀏覽器外掛</span>
                </a>

                {/* Action 2: Reload Page after installation */}
                <button
                  onClick={() => window.location.reload()}
                  className="w-full min-h-[44px] py-2.5 rounded-xl bg-space-850 hover:bg-space-800 border border-space-700 text-gray-300 hover:text-white font-mono text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer touch-manipulation"
                >
                  <span>🔄 我已完成外掛安裝，點此重新整理頁面</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Security & Network Footnote */}
        <div className="p-3 border-t border-space-800/80 shrink-0 flex items-center justify-center gap-1.5 text-[10px] text-gray-400 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>0G Galileo 測試網端點加密連線 · 無需揭露私鑰</span>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
