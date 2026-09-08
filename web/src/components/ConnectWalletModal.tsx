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
    if (typeof navigator !== "undefined") {
      const mobileCheck = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      setIsMobile(mobileCheck);
    }
    if (typeof window !== "undefined") {
      const eth = (window as any).ethereum;
      const hasRealExtension = Boolean(
        eth && eth.isMetaMask && !eth._log
      );
      setHasInjectedProvider(hasRealExtension);
    }
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
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-sm sm:max-w-md rounded-2xl bg-space-900/95 border border-cyan-500/50 p-5 sm:p-6 space-y-4 shadow-[0_0_50px_rgba(0,240,255,0.25)] backdrop-blur-xl animate-in zoom-in-95 duration-200">
        {/* Top ambient glowing cyber line */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#00f0ff]" />

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-space-800 pb-3">
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
            className="p-1.5 rounded-lg bg-space-850 hover:bg-space-800 border border-space-700/60 hover:border-space-600 text-gray-400 hover:text-white transition-all active:scale-95"
            title="關閉視窗"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Device & Protocol Status Badge */}
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-space-950/80 border border-space-800 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-gray-300">
            {isMobile ? (
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <Monitor className="w-3.5 h-3.5 text-purple-400" />
            )}
            <span>{isMobile ? "行動裝置 (Mobile)" : "電腦終端 (Desktop)"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                hasInjectedProvider
                  ? "bg-emerald-400 shadow-[0_0_6px_#34d399]"
                  : "bg-cyan-400 shadow-[0_0_6px_#22d3ee]"
              }`}
            />
            <span
              className={`text-[10px] font-bold ${
                hasInjectedProvider ? "text-emerald-400" : "text-cyan-400"
              }`}
            >
              {hasInjectedProvider ? "MetaMask 已就緒" : "SDK 通訊就緒"}
            </span>
          </div>
        </div>

        {/* Dynamic Context Actions */}
        <div className="space-y-3 pt-1">
          {hasInjectedProvider ? (
            /* Case 1: Injected Provider Detected (e.g. Chrome Extension or In-App Browser) */
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-gray-300 text-xs font-mono leading-relaxed">
                系統已偵測到您的 MetaMask 錢包，點擊下方即可安全授權登入並自動切換至{" "}
                <strong className="text-cyan-300">0G Galileo 測試網</strong>。
              </div>

              <button
                onClick={() => {
                  onConnectMetaMask();
                  onClose();
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-neon-cyan via-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-mono font-bold text-xs shadow-[0_0_20px_rgba(0,240,255,0.45)] active:scale-95 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Wallet className="w-4 h-4 text-black" />
                <span>立即連線 MetaMask 錢包</span>
              </button>
            </div>
          ) : isMobile ? (
            /* Case 2: Mobile Safari / Mobile Chrome */
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-gray-300 text-xs font-mono leading-relaxed space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span>MetaMask SDK 跨端通訊協定</span>
                </div>
                <p className="text-[11px] text-gray-300">
                  可直接喚醒手機端 MetaMask App 授權，或透過內建專用瀏覽器體驗最流暢的 Web3 交互。
                </p>
              </div>

              {/* Primary Action: Direct SDK Wakeup */}
              <button
                onClick={() => {
                  onConnectMetaMask();
                  onClose();
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-neon-cyan via-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-mono font-bold text-xs shadow-[0_0_20px_rgba(0,240,255,0.45)] active:scale-95 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Wallet className="w-4 h-4 text-black" />
                <span>🚀 喚醒手機 MetaMask App 連線</span>
              </button>

              {/* Secondary Action: Open in MetaMask App Browser */}
              <button
                onClick={handleOpenMetaMaskApp}
                className="w-full py-2.5 rounded-xl bg-space-850 hover:bg-space-800 border border-space-700 hover:border-cyan-500/40 text-cyan-300 font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>在 MetaMask 內建瀏覽器中開啟</span>
              </button>

              {/* Tertiary Action: Copy Game Link */}
              <button
                onClick={handleCopy}
                className="w-full py-2 rounded-xl bg-space-950/60 hover:bg-space-850 border border-space-800 text-gray-400 hover:text-gray-200 font-mono text-[11px] flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
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
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-gray-300 text-xs font-mono leading-relaxed space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                  <Radio className="w-3.5 h-3.5" />
                  <span>多模式連線支援</span>
                </div>
                <p className="text-[11px] text-gray-300">
                  支援手機 MetaMask App 掃描 QR 碼連線，或安裝瀏覽器擴充套件直接授權。
                </p>
              </div>

              {/* Primary: Connect via SDK (shows QR code or auto-detects) */}
              <button
                onClick={() => {
                  onConnectMetaMask();
                  onClose();
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-neon-cyan via-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-mono font-bold text-xs shadow-[0_0_20px_rgba(0,240,255,0.45)] active:scale-95 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Wallet className="w-4 h-4 text-black" />
                <span>🚀 啟動連線 (支援手機掃碼 / SDK)</span>
              </button>

              {/* Secondary: Install MetaMask Extension (Cyberpunk glass style - NO ugly orange) */}
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-space-850 hover:bg-space-800 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 hover:text-cyan-200 font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                <span>安裝 MetaMask 瀏覽器擴充套件</span>
              </a>
            </div>
          )}
        </div>

        {/* Security & Network Footnote */}
        <div className="pt-2 border-t border-space-800/80 flex items-center justify-center gap-1.5 text-[10px] text-gray-400 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>0G Galileo 測試網端點加密連線 · 無需揭露私鑰</span>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
