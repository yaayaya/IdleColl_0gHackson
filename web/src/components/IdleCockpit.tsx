import React, { useState, useEffect } from "react";
import { Pickaxe, Ticket, Sparkles, TrendingUp, Clock } from "lucide-react";
import { useDialog } from "../context/DialogContext.tsx";

interface IdleCockpitProps {
  address: string | null;
  coins: number;
  tickets: number;
  initialPending: number;
  miningRate: number;
  onClaimSuccess: (newCoins: number, claimed: number) => void;
  onBuyTicketSuccess: (newCoins: number, newTickets: number) => void;
}

export const IdleCockpit: React.FC<IdleCockpitProps> = ({
  address,
  coins,
  initialPending,
  miningRate,
  onClaimSuccess,
  onBuyTicketSuccess,
}) => {
  const { showWarning } = useDialog();
  const [livePending, setLivePending] = useState<number>(initialPending);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [isBuying, setIsBuying] = useState<boolean>(false);
  const [ticketCount, setTicketCount] = useState<number>(1);
  const [claimToast, setClaimToast] = useState<string | null>(null);

  // Synchronize livePending when initialPending changes
  useEffect(() => {
    setLivePending(initialPending);
  }, [initialPending]);

  // Live ticking counter
  useEffect(() => {
    const timer = setInterval(() => {
      setLivePending((prev) => prev + miningRate);
    }, 1000);
    return () => clearInterval(timer);
  }, [miningRate]);

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
      if (res.ok) {
        setLivePending(0);
        onClaimSuccess(data.player.coins, data.claimed);
        setClaimToast(`+${data.claimed} 金幣已入帳！`);
        setTimeout(() => setClaimToast(null), 2500);
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
        setClaimToast(`兌換成功！已獲得 ${count} 張深空探測券`);
        setTimeout(() => setClaimToast(null), 2500);
      }
    } catch (err) {
      console.error("Buy ticket error:", err);
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Toast Notification */}
      {claimToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-neon-cyan/20 border border-neon-cyan text-neon-cyan text-xs font-mono font-bold tracking-wide shadow-[0_0_16px_rgba(0,240,255,0.4)] animate-bounce">
          ✨ {claimToast}
        </div>
      )}

      {/* Main Reactor / Cockpit Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-space-850 to-space-900 border border-space-700/80 p-5 shadow-2xl">
        {/* Ambient neon backdrop glow */}
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-neon-cyan/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse" />
            <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">
              深空採礦反應爐 (Reactor)
            </h2>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full">
            <TrendingUp className="w-3 h-3" />
            <span>+{miningRate} 幣/秒</span>
          </div>
        </div>

        {/* Reactor Core Animation */}
        <div className="my-6 flex flex-col items-center justify-center relative">
          <div className="w-36 h-36 rounded-full border-2 border-dashed border-neon-cyan/40 flex items-center justify-center animate-[spin_16s_linear_infinite]">
            <div className="w-28 h-28 rounded-full border border-purple-500/50 flex items-center justify-center animate-[spin_8s_linear_infinite_reverse]">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500/20 via-purple-500/30 to-pink-500/20 backdrop-blur-sm border border-neon-cyan/60 flex items-center justify-center shadow-[0_0_24px_rgba(0,240,255,0.3)]">
                <Pickaxe className="w-8 h-8 text-neon-cyan animate-pulse" />
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400 font-mono flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" /> 待採集星際金幣
            </p>
            <div className="text-3xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]">
              +{livePending.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Claim Button */}
        <button
          onClick={handleClaim}
          disabled={livePending <= 0 || isClaiming || !address}
          className="w-full py-3.5 rounded-xl font-bold font-mono text-sm tracking-wide transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-black shadow-amber-500/20 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isClaiming ? "採集入帳中..." : "收取採礦收益 (Claim)"}</span>
        </button>
      </div>

      {/* Ticket Exchange Station */}
      <div className="rounded-2xl bg-space-900 border border-space-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
              深空探測券補給站
            </h3>
          </div>
          <span className="text-[11px] font-mono text-gray-400">500 金幣 / 張</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[1, 5, 10].map((num) => (
            <button
              key={num}
              onClick={() => setTicketCount(num)}
              className={`py-2 px-3 rounded-lg text-xs font-mono font-bold border transition-all ${
                ticketCount === num
                  ? "bg-purple-950/80 border-purple-500 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                  : "bg-space-850 border-space-700 text-gray-400 hover:bg-space-800"
              }`}
            >
              {num} 張
            </button>
          ))}
        </div>

        <button
          onClick={() => handleBuyTicket(ticketCount)}
          disabled={coins < ticketCount * TICKET_PRICE || isBuying || !address}
          className="w-full py-3 rounded-xl font-bold font-mono text-xs tracking-wide transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_14px_rgba(147,51,234,0.3)] flex items-center justify-center gap-2"
        >
          <Ticket className="w-4 h-4" />
          <span>{isBuying ? "處理中..." : `花費 ${(ticketCount * TICKET_PRICE).toLocaleString()} 金幣購買 ${ticketCount} 張探測券`}</span>
        </button>
      </div>
    </div>
  );
};
