import React from "react";
import { Wallet, Coins, Ticket, Zap, AlertTriangle, CheckCircle2 } from "lucide-react";

interface NavbarProps {
  address: string | null;
  balance0G: string;
  isCorrectNetwork: boolean;
  isGuest?: boolean;
  coins: number;
  tickets: number;
  connectWallet: () => void;
  loginAsGuest: () => void;
  switchNetwork: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  address,
  balance0G,
  isCorrectNetwork,
  isGuest,
  coins,
  tickets,
  connectWallet,
  loginAsGuest,
  switchNetwork,
}) => {
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
          {/* Network Switcher Pill */}
          {address && !isGuest && (
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

          {/* Connect / Address Pill */}
          {address ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-space-900 border border-space-700 text-xs font-mono">
              <div className={`w-2 h-2 rounded-full ${isGuest ? "bg-amber-400 shadow-[0_0_6px_#f59e0b]" : "bg-neon-cyan shadow-[0_0_6px_#00f0ff]"}`} />
              <span className="text-gray-200">
                {isGuest ? `Guest_${address.slice(2, 6)}` : `Captain_${address.slice(2, 6)}`}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={loginAsGuest}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-space-800 hover:bg-space-700 border border-space-600 text-cyan-300 font-semibold text-xs transition-all active:scale-95"
                title="免裝錢包直接體驗"
              >
                <span>訪客體驗</span>
              </button>
              <button
                onClick={connectWallet}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-xs transition-all shadow-[0_0_12px_rgba(0,240,255,0.3)] active:scale-95"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>連線錢包</span>
              </button>
            </div>
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
