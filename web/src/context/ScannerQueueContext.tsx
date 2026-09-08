import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Sparkles, X } from "lucide-react";

export interface GachaJob {
  id: number;
  walletAddress: string;
  status: "queued" | "processing" | "completed" | "failed";
  stepMessage: string;
  collectibleId?: number;
  archetypeId?: number;
  error?: string;
  acknowledged?: number;
  createdAt: string;
  completedAt?: string;
  collectible?: {
    id: number;
    tokenId: number;
    aiTitle: string;
    aiLore: string;
    aiStats: any;
    storageHash: string;
    txHash?: string;
    mintStatus: string;
  };
  archetype?: {
    id: number;
    name: string;
    rarity: string;
    description: string;
    baseImage: string;
  };
}

export interface RevealItemData {
  archetype: {
    name: string;
    rarity: string;
    description: string;
    baseImage: string;
  };
  collectible: {
    id?: number;
    tokenId?: number;
    aiTitle: string;
    aiLore: string;
    aiStats: any;
    storageHash: string;
    txHash?: string;
  };
}

interface ScannerQueueContextType {
  jobs: GachaJob[];
  activeJobs: GachaJob[];
  unrevealedJobs: GachaJob[];
  enqueueScan: () => Promise<{ success: boolean; error?: string }>;
  revealedItem: RevealItemData | null;
  setRevealedItem: (item: RevealItemData | null) => void;
  openJobReveal: (job: GachaJob) => void;
  refreshJobs: () => Promise<void>;
}

const ScannerQueueContext = createContext<ScannerQueueContextType | null>(null);

export const ScannerQueueProvider: React.FC<{
  children: ReactNode;
  address: string | null;
  tickets: number;
  onTicketsChange: (newTickets: number) => void;
  onCollectiblesUpdated?: () => void;
}> = ({ children, address, tickets, onTicketsChange, onCollectiblesUpdated }) => {
  const [jobs, setJobs] = useState<GachaJob[]>([]);
  const [revealedItem, setRevealedItem] = useState<RevealItemData | null>(null);

  // Fetch jobs from server
  const refreshJobs = useCallback(async () => {
    if (!address) {
      setJobs([]);
      return;
    }
    try {
      const res = await fetch(`/api/gacha/jobs?address=${address}`);
      const data = await res.json();
      if (res.ok && data.jobs) {
        setJobs(data.jobs);
      }
    } catch (err) {
      console.error("[ScannerQueue] Failed to fetch jobs:", err);
    }
  }, [address]);

  // Polling while jobs are active
  useEffect(() => {
    if (!address) return;
    refreshJobs();

    const hasPending = jobs.some((j) => j.status === "queued" || j.status === "processing");
    const intervalTime = hasPending ? 2000 : 8000;

    const interval = setInterval(() => {
      refreshJobs();
    }, intervalTime);

    return () => clearInterval(interval);
  }, [address, jobs, refreshJobs]);

  // Enqueue new draw task
  const enqueueScan = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!address) {
      return { success: false, error: "請先連線 0G 錢包！" };
    }
    if (tickets < 1) {
      return { success: false, error: "探測券不足！請至採礦艙使用金幣補給。" };
    }

    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([20]);
      }

      const res = await fetch("/api/gacha/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onTicketsChange(data.remainingTickets);
        refreshJobs();
        return { success: true };
      } else {
        return { success: false, error: data.error || "加入探測佇列失敗" };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || "網路通訊異常" };
    }
  }, [address, tickets, onTicketsChange, refreshJobs]);

  // Open reveal modal and acknowledge job
  const openJobReveal = useCallback(
    async (job: GachaJob) => {
      if (!job.archetype || !job.collectible) return;

      setRevealedItem({
        archetype: job.archetype,
        collectible: job.collectible,
      });

      // Acknowledge on server and convert mintStatus to "minted"
      if (address) {
        try {
          await fetch("/api/gacha/ack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address, jobId: job.id }),
          });
          await refreshJobs();
          if (onCollectiblesUpdated) {
            onCollectiblesUpdated();
          }
        } catch (e) {
          console.error("Failed to ack job:", e);
        }
      }
    },
    [address, refreshJobs, onCollectiblesUpdated]
  );

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case "Legendary":
        return "bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.4)]";
      case "Epic":
        return "bg-pink-500/20 text-pink-300 border-pink-500/60 shadow-[0_0_12px_rgba(236,72,153,0.4)]";
      case "Rare":
        return "bg-purple-500/20 text-purple-300 border-purple-500/60 shadow-[0_0_10px_rgba(168,85,247,0.3)]";
      default:
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
    }
  };

  const activeJobs = jobs.filter((j) => j.status === "queued" || j.status === "processing");
  const unrevealedJobs = jobs.filter(
    (j) => j.status === "completed" && j.acknowledged === 0 && j.collectible && j.archetype
  );

  return (
    <ScannerQueueContext.Provider
      value={{
        jobs,
        activeJobs,
        unrevealedJobs,
        enqueueScan,
        revealedItem,
        setRevealedItem,
        openJobReveal,
        refreshJobs,
      }}
    >
      {children}

      {/* Global Holographic Reveal Modal */}
      {revealedItem &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) setRevealedItem(null);
            }}
          >
            <div className="relative w-full max-w-sm sm:max-w-md my-auto max-h-[calc(100dvh-2rem)] flex flex-col rounded-2xl bg-space-900/98 border-2 border-neon-cyan shadow-[0_0_45px_rgba(0,240,255,0.35)] backdrop-blur-xl animate-in zoom-in-95 duration-200 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 pb-2.5 border-b border-space-800 shrink-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold border uppercase ${getRarityBadge(
                      revealedItem.archetype.rarity
                    )}`}
                  >
                    {revealedItem.archetype.rarity}
                  </span>
                  <span className="text-[11px] font-mono text-gray-400">
                    Token #{revealedItem.collectible.tokenId || "—"}
                  </span>
                </div>

                <button
                  onClick={() => setRevealedItem(null)}
                  className="w-8 h-8 rounded-lg bg-space-850 hover:bg-space-800 border border-space-700/60 text-gray-400 hover:text-white transition-all active:scale-95 flex items-center justify-center touch-manipulation cursor-pointer"
                  title="收回圖鑑"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Content Body */}
              <div className="overflow-y-auto overscroll-contain p-4 space-y-3 flex-1 text-left">
                {/* Collectible Art Display */}
                <div className="w-32 h-32 sm:w-36 sm:h-36 mx-auto rounded-2xl bg-space-950/80 border border-space-700/60 p-3 flex items-center justify-center shadow-inner relative overflow-hidden shrink-0">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.15)_0,transparent_70%)]" />
                  <img
                    src={revealedItem.archetype.baseImage?.replace(".png", ".svg")}
                    alt={revealedItem.collectible.aiTitle}
                    className="max-w-full max-h-full drop-shadow-[0_0_20px_rgba(0,240,255,0.4)] object-contain z-10"
                  />
                </div>

                {/* AI Generated Content */}
                <div className="space-y-2 text-left">
                  <h3 className="text-sm sm:text-base font-bold text-gray-100 font-mono tracking-tight leading-snug">
                    {revealedItem.collectible.aiTitle}
                  </h3>
                  <div className="text-xs text-gray-300 leading-relaxed bg-space-950/70 p-3 rounded-xl border border-space-800/80">
                    {revealedItem.collectible.aiLore}
                  </div>

                  {/* AI Stats Tags */}
                  {revealedItem.collectible.aiStats && (
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1">
                      <div className="p-2 rounded-lg bg-space-850/80 border border-space-800 text-gray-300">
                        <span className="text-gray-500 block">特異詞條</span>
                        <span className="text-cyan-300 font-bold truncate block">
                          {revealedItem.collectible.aiStats.specialTrait || "星塵共鳴"}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-space-850/80 border border-space-800 text-gray-300">
                        <span className="text-gray-500 block">採礦產能加成</span>
                        <span className="text-emerald-400 font-bold block">
                          {revealedItem.collectible.aiStats.miningBonus || "+15%"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="p-4 pt-2.5 border-t border-space-800 shrink-0 space-y-2.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                  <span className="text-neon-cyan flex items-center gap-1 font-bold">
                    <Sparkles className="w-3 h-3" />
                    0G Serving + 0G Storage
                  </span>
                  <span className="truncate max-w-[140px] text-gray-500">
                    Hash: {revealedItem.collectible.storageHash?.slice(0, 10)}...
                  </span>
                </div>

                <button
                  onClick={() => setRevealedItem(null)}
                  className="w-full min-h-[44px] py-2.5 rounded-xl bg-space-850 hover:bg-space-800 border border-space-700 text-gray-200 font-mono font-bold text-xs active:scale-95 transition-all cursor-pointer touch-manipulation flex items-center justify-center"
                >
                  收錄至星際圖鑑
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </ScannerQueueContext.Provider>
  );
};

export const useScannerQueue = () => {
  const context = useContext(ScannerQueueContext);
  if (!context) {
    throw new Error("useScannerQueue must be used within a ScannerQueueProvider");
  }
  return context;
};
