import React, { useState } from "react";
import {
  Wallet,
  Coins,
  Ticket,
  Zap,
  AlertTriangle,
  CheckCircle2,
  LogOut,
  Copy,
  Check,
  Radar,
  Edit3,
} from "lucide-react";
import { useDialog } from "../context/DialogContext.tsx";
import { useScannerQueue } from "../context/ScannerQueueContext.tsx";

interface NavbarProps {
  address: string | null;
  playerName?: string;
  balance0G: string;
  isCorrectNetwork: boolean;
  coins: number;
  tickets: number;
  connectWallet: () => void;
  disconnectWallet: () => void;
  switchNetwork: () => void;
  onOpenRenameModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  address,
  playerName,
  balance0G,
  isCorrectNetwork,
  coins,
  tickets,
  connectWallet,
  disconnectWallet,
  switchNetwork,
  onOpenRenameModal,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const { showConfirm } = useDialog();
  const { activeJobs } = useScannerQueue();

  const handleCopyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!address) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleDisconnectClick = () => {
    showConfirm({
      title: "登出錢包連線",
      message: `即將登出當前錢包連線 (${address?.slice(0, 6)}...${address?.slice(-4)})。登出後將切換為未連線狀態，需再次連線方可進行鏈上交易與領取收益。`,
      confirmText: "確認登出",
      cancelText: "保留連線",
      onConfirm: () => {
        disconnectWallet();
      },
    });
  };

  const displayName = playerName || (address ? `Captain_${address.slice(2, 6)}` : "Captain");

  return (
    <header className="sticky top-0 z-30 bg-space-950/90 backdrop-blur-md border-b border-space-800 px-4 py-2.5">
      {/* Top row: Brand & Wallet */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="IdleColl Logo" className="w-8 h-8 drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]" />
          <div>
            <h1 className="text-base font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-purple-400 to-pink-500">
              IdleColl
            </h1>
            <p className="text-[10px] text-gray-400 font-mono tracking-tighter">0G DEEP SPACE</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Active Scanner Chip */}
          {activeJobs.length > 0 && (
            <div className="hidden xs:flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-[10px] font-mono animate-pulse">
              <Radar className="w-3 h-3 text-neon-cyan animate-spin" />
              <span>探測中 ({activeJobs.length})</span>
            </div>
          )}

          {/* Network Switcher Pill */}
          {address && (
            isCorrectNetwork ? (
              <div className="hidden xs:flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>0G Galileo</span>
              </div>
            ) : (
              <button
                onClick={switchNetwork}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/60 text-amber-300 text-[11px] font-mono animate-pulse hover:bg-amber-900"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>切換 0G</span>
              </button>
            )
          )}

          {/* Connect / Address Pill & Logout */}
          {address ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenRenameModal || handleCopyAddress}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-space-900 hover:bg-space-850 border border-space-700 hover:border-cyan-500/40 text-xs font-mono transition-all active:scale-95 group"
                title={onOpenRenameModal ? "點擊自訂艦長暱稱" : "點擊複製錢包完整地址"}
              >
                <div className="w-2 h-2 rounded-full bg-neon-cyan shadow-[0_0_6px_#00f0ff]" />
                <span className="text-gray-200 group-hover:text-cyan-300 transition-colors truncate max-w-[110px] sm:max-w-[130px]">
                  {displayName}
                </span>
                {onOpenRenameModal ? (
                  <Edit3 className="w-3 h-3 text-gray-500 group-hover:text-cyan-300 transition-colors" />
                ) : copied ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3 text-gray-500 group-hover:text-gray-300 opacity-60 group-hover:opacity-100 transition-opacity" />
                )}
              </button>

              <button
                onClick={handleDisconnectClick}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-space-900 hover:bg-rose-950/70 border border-space-700 hover:border-rose-500/50 text-gray-400 hover:text-rose-300 text-xs font-mono transition-all active:scale-95 group cursor-pointer"
                title="登出錢包連線"
              >
                <LogOut className="w-3.5 h-3.5 text-gray-400 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
                <span className="text-[11px] font-semibold text-gray-400 group-hover:text-rose-300">登出</span>
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-xs transition-all shadow-[0_0_12px_rgba(0,240,255,0.3)] active:scale-95 cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>連線錢包</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: Realtime Resource Stats */}
      <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-space-850">
        <div className="flex items-center justify-center gap-1.5 py-1 px-2 rounded-md bg-space-900/60 border border-space-800">
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <div className="flex flex-col leading-none">
            <span className="text-[9px] text-gray-400 font-mono">金幣</span>
            <span className="text-xs font-bold font-mono text-amber-300">{coins.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 py-1 px-2 rounded-md bg-space-900/60 border border-space-800">
          <Ticket className="w-3.5 h-3.5 text-purple-400" />
          <div className="flex flex-col leading-none">
            <span className="text-[9px] text-gray-400 font-mono">探測券</span>
            <span className="text-xs font-bold font-mono text-purple-300">{tickets} 張</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 py-1 px-2 rounded-md bg-space-900/60 border border-space-800">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <div className="flex flex-col leading-none">
            <span className="text-[9px] text-gray-400 font-mono">0G 原生幣</span>
            <span className="text-xs font-bold font-mono text-cyan-300">{balance0G}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
