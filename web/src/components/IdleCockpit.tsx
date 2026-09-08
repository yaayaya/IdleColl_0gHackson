import React, { useState, useEffect } from "react";
import {
  Pickaxe,
  Ticket,
  Sparkles,
  TrendingUp,
  Clock,
  Wallet,
  BatteryCharging,
  Zap,
  Radar,
} from "lucide-react";
import { useDialog } from "../context/DialogContext.tsx";

interface IdleCockpitProps {
  address: string | null;
  playerName: string;
  coins: number;
  tickets: number;
  initialPending: number;
  miningRate: number;
  maxIdleCoins?: number;
  bonusMiningRate?: number;
  bonusCapacity?: number;
  fleetLuck?: number;
  activeBuffs?: { title: string; trait: string; bonusText: string }[];
  onClaimSuccess: (newCoins: number, claimed: number) => void;
  onBuyTicketSuccess: (newCoins: number, newTickets: number) => void;
  onConnectWallet: () => void;
  onRename: (newName: string) => Promise<boolean>;
  onNavigateToScanner: () => void;
}

export const IdleCockpit: React.FC<IdleCockpitProps> = ({
  address,
  playerName,
  coins,
  tickets,
  initialPending,
  miningRate,
  maxIdleCoins = 1000,
  bonusMiningRate = 0,
  bonusCapacity = 0,
  fleetLuck = 50,
  activeBuffs = [],
  onClaimSuccess,
  onBuyTicketSuccess,
  onConnectWallet,
  onRename,
  onNavigateToScanner,
}) => {
  const { showWarning } = useDialog();
  const effectiveMaxIdle = maxIdleCoins || 1000;
  const [livePending, setLivePending] = useState<number>(initialPending);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [isBuying, setIsBuying] = useState<boolean>(false);
  const [claimToast, setClaimToast] = useState<{ message: string; isCrit: boolean } | null>(null);

  // Synchronize livePending when initialPending changes
  useEffect(() => {
    if (address) {
      setLivePending(Math.min(initialPending, effectiveMaxIdle));
    } else {
      setLivePending(0);
    }
  }, [initialPending, address, effectiveMaxIdle]);

  // Live ticking counter - ONLY tick if address is connected, and capped at effectiveMaxIdle
  useEffect(() => {
    if (!address) return; // Do not tick if user is not logged in

    const timer = setInterval(() => {
      setLivePending((prev) => Math.min(prev + miningRate, effectiveMaxIdle));
    }, 1000);

    return () => clearInterval(timer);
  }, [address, miningRate, effectiveMaxIdle]);

  const handleClaim = async () => {
    if (!address || isClaiming || livePending <= 0) return;
    try {
      setIsClaiming(true);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([25]);
      }
      const res = await fetch("/api/player/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();
      if (res.ok && data.claimed > 0) {
        setLivePending(0);
        onClaimSuccess(data.player.coins, data.claimed);

        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(data.isCrit ? [40, 60, 40] : [25]);
        }

        if (data.isCrit) {
          setClaimToast({
            message: `⚡ 0G 能量共振！觸發幸運爆擊（2倍收益）：+${data.claimed.toLocaleString()} 金幣！`,
            isCrit: true,
          });
        } else {
          setClaimToast({
            message: `+${data.claimed.toLocaleString()} 金幣已安全入帳！`,
            isCrit: false,
          });
        }
        setTimeout(() => setClaimToast(null), 3000);
      }
    } catch (err) {
      console.error("Claim error:", err);
    } finally {
      setIsClaiming(false);
    }
  };

  const TICKET_PRICE = 500;

  const handleBuyTicket = async (count: number) => {
    if (!address || isBuying) return;
    const cost = count * TICKET_PRICE;
    if (coins < cost) {
      showWarning(
        `金幣儲量不足！購買 ${count} 張探測券需要 ${cost.toLocaleString()} 金幣，艦隊當前僅有 ${coins.toLocaleString()} 金幣。\n\n請先收取採礦艙產出的金幣後再試！`,
        "物資配額不足"
      );
      return;
    }

    try {
      setIsBuying(true);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([15]);
      }
      const res = await fetch("/api/player/buy-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, count }),
      });
      const data = await res.json();
      if (res.ok) {
        onBuyTicketSuccess(data.player.coins, data.player.tickets);
        setClaimToast({
          message: `兌換成功！已獲得 ${count} 張深空探測券`,
          isCrit: false,
        });
        setTimeout(() => setClaimToast(null), 2500);
      }
    } catch (err) {
      console.error("Buy ticket error:", err);
    } finally {
      setIsBuying(false);
    }
  };

  const isCapped = livePending >= effectiveMaxIdle;
  const progressPercent = Math.min(100, Math.round((livePending / effectiveMaxIdle) * 100));

  return (
    <div className="space-y-4 pb-20">
      {/* Toast Notification */}
      {claimToast && (
        <div
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl font-mono text-xs font-bold shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200 flex items-center gap-2 ${
            claimToast.isCrit
              ? "bg-amber-950/95 border-2 border-amber-400 text-amber-200 shadow-[0_0_25px_rgba(245,158,11,0.6)]"
              : "bg-space-900/95 border-2 border-neon-cyan text-neon-cyan shadow-[0_0_20px_rgba(0,240,255,0.4)]"
          }`}
        >
          <span>{claimToast.message}</span>
        </div>
      )}

      {/* Main Mining Reactor Card */}
      {!address ? (
        /* Unauthenticated Standby Reactor Card */
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-space-900 via-space-950 to-space-950 border border-space-800 p-6 shadow-2xl text-center space-y-5">
          {/* Top ambient glow */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          {/* Standby Reactor Emblem */}
          <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
            {/* Concentric rings */}
            <div className="absolute inset-0 rounded-full border border-space-700/50 border-dashed animate-[spin_30s_linear_infinite]" />
            <div className="absolute inset-3 rounded-full border border-space-800" />
            <div className="w-20 h-20 rounded-full bg-space-900 border border-space-700 flex items-center justify-center text-gray-500 shadow-inner">
              <BatteryCharging className="w-9 h-9 animate-pulse text-cyan-400/60" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-space-850 border border-space-700 text-gray-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-400/70" />
              <span>採礦反應爐 · 待機休眠中 (STANDBY)</span>
            </div>
            <h3 className="text-base font-bold font-mono text-gray-100">
              連線錢包以啟動反應爐
            </h3>
            <p className="text-xs text-gray-400 font-mono leading-relaxed max-w-xs mx-auto">
              立即連線 0G 星際錢包以啟動自動採礦程序（每秒產出 +10 金幣），累積物資兌換深空探測券並挖掘 AI NFT 藏品！
            </p>
          </div>

          {/* Connect Button */}
          <button
            onClick={onConnectWallet}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-neon-cyan via-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-mono font-bold text-sm shadow-[0_0_25px_rgba(0,240,255,0.4)] active:scale-95 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Wallet className="w-4 h-4 text-black" />
            <span>連線錢包 · 啟動採礦反應爐</span>
          </button>
        </div>
      ) : (
        /* Authenticated Active Reactor Card */
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-space-850 via-space-900 to-space-950 border border-space-700/80 p-5 shadow-2xl space-y-4">
          {/* Top header & Rate */}
          <div className="flex items-center justify-between border-b border-space-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-neon-cyan shadow-[0_0_8px_rgba(0,240,255,0.3)]">
                <Pickaxe className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold font-mono text-gray-200 uppercase tracking-wider">
                  深空採礦反應爐 (Reactor)
                </h2>
                <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  運轉中 · 效率 100%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-semibold">
                <TrendingUp className="w-3.5 h-3.5 text-neon-cyan" />
                <span>+{miningRate} 幣/秒</span>
              </div>
              {bonusMiningRate > 0 && (
                <span className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/50 text-[10px] font-mono font-bold text-purple-300">
                  <Zap className="w-2.5 h-2.5 text-purple-400" />
                  <span>+{bonusMiningRate} 艦隊</span>
                </span>
              )}
            </div>
          </div>

          {/* Pending Coins Display */}
          <div className="py-2 text-center space-y-2">
            <p className="text-[11px] text-gray-400 font-mono tracking-wider uppercase">
              待採集星際金幣 (Pending Pool)
            </p>

            <div className="flex items-center justify-center gap-2">
              <div
                className={`text-4xl font-black font-mono tracking-tight transition-colors ${
                  isCapped ? "text-amber-300 drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]" : "text-neon-cyan drop-shadow-[0_0_12px_rgba(0,240,255,0.6)]"
                }`}
              >
                +{livePending.toLocaleString()}
              </div>
              <span className="text-xs font-mono text-gray-400 self-end mb-1">
                / {effectiveMaxIdle.toLocaleString()}
              </span>
            </div>

            {/* Capacity Progress Bar */}
            <div className="space-y-1 pt-1">
              <div className="w-full h-2 rounded-full bg-space-950 border border-space-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    isCapped
                      ? "bg-gradient-to-r from-amber-400 to-yellow-500 shadow-[0_0_10px_#f59e0b]"
                      : "bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_10px_#00f0ff]"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 px-0.5">
                <span>儲能進度 {progressPercent}%</span>
                <span className={isCapped ? "text-amber-400 font-bold" : "text-gray-400"}>
                  {isCapped
                    ? "⚡ 儲存池已滿載！"
                    : `上限 ${effectiveMaxIdle.toLocaleString()} 金幣 ${
                        bonusCapacity > 0 ? `(艦隊擴充 +${bonusCapacity})` : ""
                      }`}
                </span>
              </div>
            </div>
          </div>

          {/* Active Fleet Synergy Pills */}
          {activeBuffs && activeBuffs.length > 0 && (
            <div className="px-3 py-2 rounded-xl bg-space-950/80 border border-space-800/80 space-y-1.5 text-left">
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                <span className="text-cyan-400 font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3 text-neon-cyan" />
                  <span>星際艦隊賦能共振 (Fleet Synergy)</span>
                </span>
                <span className="text-purple-300">
                  幸運值: {fleetLuck} · 賦能藏品: {activeBuffs.length} 件
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeBuffs.slice(0, 3).map((buff, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-space-850 border border-space-700/60 text-[10px] font-mono text-gray-300"
                    title={buff.bonusText}
                  >
                    <span className="w-1 h-1 rounded-full bg-cyan-400" />
                    <strong className="text-cyan-300">{buff.trait}</strong>
                  </span>
                ))}
                {activeBuffs.length > 3 && (
                  <span className="text-[10px] font-mono text-gray-500 self-center">
                    +{activeBuffs.length - 3} 個更多詞條
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Claim Action Button */}
          <button
            onClick={handleClaim}
            disabled={isClaiming || livePending <= 0}
            className={`w-full py-3.5 rounded-xl font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 ${
              livePending > 0
                ? isCapped
                  ? "bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.5)] cursor-pointer"
                  : "bg-gradient-to-r from-neon-cyan via-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black shadow-[0_0_20px_rgba(0,240,255,0.4)] cursor-pointer"
                : "bg-space-850 text-gray-500 border border-space-800 cursor-not-allowed"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isClaiming
                ? "採集中..."
                : livePending > 0
                ? isCapped
                  ? "儲能已滿！立即收取金幣"
                  : `收取採礦收益 (+${livePending.toLocaleString()} 金幣)`
                : "採礦中，尚無可領取收益"}
            </span>
          </button>
        </div>
      )}

      {/* Ticket Exchange Station */}
      <div className="rounded-2xl bg-space-900 border border-space-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold font-mono text-gray-200">
              深空探測券補給站
            </h3>
          </div>
          <span className="text-[11px] font-mono text-purple-300 font-semibold">
            {TICKET_PRICE} 金幣 / 1 張
          </span>
        </div>

        {/* Buy Action Button - Strictly 1 Ticket */}
        <button
          onClick={() => handleBuyTicket(1)}
          disabled={!address || isBuying || coins < TICKET_PRICE}
          className={`w-full py-3 rounded-xl font-mono text-xs font-bold transition-all active:scale-95 ${
            address && coins >= TICKET_PRICE
              ? "bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] cursor-pointer"
              : "bg-space-850 text-gray-500 border border-space-800 cursor-not-allowed"
          }`}
        >
          {isBuying
            ? "兌換中..."
            : !address
            ? "請先連線錢包以兌換物資"
            : coins < TICKET_PRICE
            ? `金幣不足 (需 ${TICKET_PRICE} 金幣)`
            : `花費 ${TICKET_PRICE} 金幣購買 1 張探測券`}
        </button>

        {/* Jump Directly to Deep Space Scanner */}
        <button
          onClick={() => {
            if (!address) return;
            onNavigateToScanner();
          }}
          disabled={!address}
          className={`w-full py-2.5 rounded-xl font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            !address
              ? "bg-space-850/40 text-gray-600 border border-space-800/60 opacity-40 cursor-not-allowed select-none"
              : "bg-space-850 hover:bg-space-800 border border-purple-500/40 hover:border-purple-400 text-purple-300 hover:text-white active:scale-95 cursor-pointer shadow-sm"
          }`}
          title={!address ? "請先連線錢包以啟用深空探測" : undefined}
        >
          <Radar className={`w-3.5 h-3.5 ${!address ? "text-gray-600" : "text-purple-400"}`} />
          <span>🚀 立即前往深空探測 {address ? `(已有 ${tickets} 張券)` : ""}</span>
        </button>
      </div>
    </div>
  );
};
