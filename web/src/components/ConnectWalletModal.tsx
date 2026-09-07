import React, { useState, useEffect } from "react";
import { Smartphone, Monitor, ExternalLink, Copy, Check, Wallet, X, Zap } from "lucide-react";

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectMetaMask: () => void;
  onLoginAsGuest: () => void;
}

export const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({
  isOpen,
  onClose,
  onConnectMetaMask,
  onLoginAsGuest,
}) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [hasInjectedProvider, setHasInjectedProvider] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      const mobileCheck = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      setIsMobile(mobileCheck);
    }
    if (typeof window !== "undefined") {
      setHasInjectedProvider(Boolean((window as any).ethereum));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentUrl = typeof window !== "undefined" ? window.location.href : "https://idlecoll.yayayayaya.xyz";
  const host = typeof window !== "undefined" ? window.location.host : "idlecoll.yayayayaya.xyz";
  const metaMaskDeepLink = `https://metamask.app.link/dapp/${host}`;

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      if (navigator.vibrate) navigator.vibrate([15]);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleOpenMetaMaskApp = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([20]);
    }
    window.location.href = metaMaskDeepLink;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm rounded-2xl bg-space-900 border-2 border-neon-cyan/80 p-5 space-y-4 shadow-[0_0_35px_rgba(0,240,255,0.3)] animate-in zoom-in-95 duration-150">
        {/* Top header */}
        <div className="flex items-center justify-between border-b border-space-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-neon-cyan" />
            <h3 className="text-xs font-bold font-mono text-gray-100 uppercase tracking-wider">
              連線 0G 星際艦隊
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md bg-space-850 hover:bg-space-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Device Detection Badge */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-space-850 border border-space-800 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-gray-300">
            {isMobile ? <Smartphone className="w-3.5 h-3.5 text-cyan-400" /> : <Monitor className="w-3.5 h-3.5 text-purple-400" />}
            <span>當前環境：{isMobile ? "手機端 (Mobile)" : "電腦端 (Desktop)"}</span>
          </div>
          <span className={`text-[10px] font-bold ${hasInjectedProvider ? "text-emerald-400" : "text-amber-400"}`}>
            {hasInjectedProvider ? "● MetaMask 已偵測" : "○ 未掛載擴充"}
          </span>
        </div>

        {/* Dynamic content depending on environment */}
        <div className="space-y-3 pt-1">
          {hasInjectedProvider ? (
            /* Case 1: Has MetaMask Injected (e.g. MetaMask browser on phone or Chrome on desktop) */
            <div className="space-y-3">
              <p className="text-xs text-gray-300 font-mono leading-relaxed">
                系統已偵測到你的 MetaMask 錢包，點擊下方即可安全授權登入並自動切換至 <strong>0G Galileo 測試網</strong>。
              </p>

              <button
                onClick={() => {
                  onConnectMetaMask();
                  onClose();
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-neon-cyan via-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-mono font-bold text-xs shadow-[0_0_16px_rgba(0,240,255,0.4)] active:scale-95 flex items-center justify-center gap-2 transition-all"
              >
                <Wallet className="w-4 h-4" />
                <span>立即連線 MetaMask 錢包</span>
              </button>
            </div>
          ) : isMobile ? (
            /* Case 2: Mobile Safari / Mobile Chrome without injected provider */
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-200 text-[11px] font-mono leading-relaxed">
                你目前正在手機的 <strong>Safari / Chrome</strong> 一般瀏覽器中。手機端需要使用 <strong>MetaMask App</strong> 才能進行 Web3 鏈上交易。
              </div>

              {/* Action 1: Deep Link */}
              <button
                onClick={handleOpenMetaMaskApp}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-mono font-bold text-xs shadow-[0_0_16px_rgba(245,158,11,0.4)] active:scale-95 flex items-center justify-center gap-2 transition-all"
              >
                <Zap className="w-4 h-4" />
                <span>🚀 一鍵在 MetaMask App 中開啟</span>
              </button>

              {/* Action 2: Copy Link */}
              <button
                onClick={handleCopy}
                className="w-full py-2.5 rounded-xl bg-space-850 hover:bg-space-800 border border-space-700 text-gray-200 font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                <span>{copied ? "已複製！請在 MetaMask 貼上" : "📋 複製遊戲網址 (貼至錢包)"}</span>
              </button>

              {copied && (
                <p className="text-[10px] text-emerald-400 font-mono text-center animate-pulse">
                  打開 MetaMask App ➔ 點擊底部「瀏覽器 🌐」➔ 貼上網址即可遊玩！
                </p>
              )}
            </div>
          ) : (
            /* Case 3: Desktop Browser without MetaMask extension */
            <div className="space-y-3">
              <p className="text-xs text-gray-300 font-mono leading-relaxed">
                電腦瀏覽器尚未安裝 MetaMask 擴充套件。安裝後即可連線 0G Galileo 區塊鏈並交易 NFT 藏品。
              </p>

              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-mono font-bold text-xs shadow-[0_0_16px_rgba(245,158,11,0.4)] active:scale-95 flex items-center justify-center gap-2 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>安裝 MetaMask 瀏覽器擴充套件</span>
              </a>
            </div>
          )}

          {/* Universal Guest Mode Alternative */}
          <div className="pt-2 border-t border-space-800">
            <button
              onClick={() => {
                onLoginAsGuest();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-space-850 hover:bg-space-800 border border-space-700 text-cyan-300 font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>🎮 訪客體驗 (免裝錢包直接玩)</span>
            </button>
            <p className="text-[9px] text-gray-500 font-mono text-center mt-1">
              訪客模式即刻發放 10.00 0G 體驗金，可完整體驗放置採礦與 12 格圖鑑抽卡。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
