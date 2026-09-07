import React, { useState, useEffect } from "react";
import { BookOpen, Lock, Sparkles, X, Database, ExternalLink, ShieldCheck } from "lucide-react";

interface CodexSlot {
  archetype: {
    id: number;
    name: string;
    rarity: string;
    description: string;
    baseImage: string;
  };
  isUnlocked: boolean;
  count: number;
  variants: any[];
}

interface CodexMatrixProps {
  address: string | null;
}

export const CodexMatrix: React.FC<CodexMatrixProps> = ({ address }) => {
  const [slots, setSlots] = useState<CodexSlot[]>([]);
  const [unlockedCount, setUnlockedCount] = useState<number>(0);
  const [totalSlots, setTotalSlots] = useState<number>(12);
  const [percent, setPercent] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSlot, setSelectedSlot] = useState<CodexSlot | null>(null);

  const fetchCodex = async () => {
    if (!address) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/codex?address=${address}`);
      const data = await res.json();
      if (res.ok) {
        setSlots(data.slots || []);
        setUnlockedCount(data.unlockedCount || 0);
        setTotalSlots(data.totalSlots || 12);
        setPercent(data.percent || 0);
      }
    } catch (err) {
      console.error("Failed to fetch codex:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodex();
  }, [address]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Legendary": return "border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.35)] text-amber-300";
      case "Epic": return "border-pink-500/70 shadow-[0_0_12px_rgba(236,72,153,0.3)] text-pink-300";
      case "Rare": return "border-purple-500/60 shadow-[0_0_10px_rgba(168,85,247,0.25)] text-purple-300";
      default: return "border-cyan-500/40 text-cyan-300";
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header with Completion Progress */}
      <div className="rounded-2xl bg-gradient-to-r from-space-900 to-space-850 border border-space-700/80 p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-neon-cyan" />
            <h2 className="text-xs font-bold font-mono tracking-wider text-gray-200 uppercase">
              星際全域圖鑑 (Codex Matrix)
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-neon-cyan">
            {unlockedCount} / {totalSlots} ({percent}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-space-950 overflow-hidden border border-space-700">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 transition-all duration-500 shadow-[0_0_10px_rgba(0,240,255,0.5)]"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* 3x4 Matrix Grid */}
      {loading ? (
        <div className="py-12 text-center text-gray-400 font-mono text-xs">
          讀取星際圖鑑資料中...
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5">
          {slots.map((slot) => {
            const { archetype, isUnlocked, count } = slot;
            return (
              <div
                key={archetype.id}
                onClick={() => isUnlocked && setSelectedSlot(slot)}
                className={`relative rounded-xl border p-2 flex flex-col items-center justify-between transition-all aspect-[4/5] ${
                  isUnlocked
                    ? `bg-space-900/90 cursor-pointer hover:scale-105 active:scale-95 ${getRarityColor(archetype.rarity)}`
                    : "bg-space-950/60 border-space-800/80 opacity-50 cursor-not-allowed"
                }`}
              >
                {/* Archetype Number & Badge */}
                <div className="w-full flex items-center justify-between text-[9px] font-mono leading-none">
                  <span className="text-gray-400">#{archetype.id.toString().padStart(2, "0")}</span>
                  {isUnlocked && (
                    <span className="px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-500/50 text-purple-300 font-bold">
                      x{count}
                    </span>
                  )}
                </div>

                {/* Center Image or Lock Icon */}
                <div className="my-auto flex items-center justify-center w-14 h-14">
                  {isUnlocked ? (
                    <img
                      src={archetype.baseImage?.replace(".png", ".svg")}
                      alt={archetype.name}
                      className="max-w-full max-h-full object-contain drop-shadow-[0_0_8px_rgba(0,240,255,0.2)]"
                    />
                  ) : (
                    <Lock className="w-6 h-6 text-gray-600" />
                  )}
                </div>

                {/* Item Name */}
                <div className="w-full text-center truncate">
                  <p className="text-[10px] font-bold font-mono text-gray-200 truncate">
                    {isUnlocked ? archetype.name : "未知藏品"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inspect Slot Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm rounded-2xl bg-space-900 border-2 border-neon-cyan p-5 shadow-[0_0_35px_rgba(0,240,255,0.4)] max-h-[85vh] flex flex-col">
            <button
              onClick={() => setSelectedSlot(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-space-800 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-space-800">
              <img
                src={selectedSlot.archetype.baseImage?.replace(".png", ".svg")}
                alt={selectedSlot.archetype.name}
                className="w-12 h-12 rounded-lg bg-space-950 p-1 border border-space-700"
              />
              <div>
                <h3 className="text-sm font-bold font-mono text-gray-100">
                  {selectedSlot.archetype.name}
                </h3>
                <p className="text-[10px] text-gray-400 font-mono">
                  {selectedSlot.archetype.rarity} · 共解鎖 {selectedSlot.variants.length} 個 AI 變體
                </p>
              </div>
            </div>

            {/* Variants Scrollable List */}
            <div className="my-3 space-y-3 overflow-y-auto pr-1 flex-1">
              {selectedSlot.variants.map((variant, idx) => (
                <div
                  key={variant.id || idx}
                  className="rounded-xl bg-space-850/80 border border-space-700/70 p-3 space-y-2 text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-neon-cyan truncate max-w-[200px]">
                      {variant.aiTitle}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-space-800 text-gray-300">
                      Token #{variant.tokenId || "—"}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-300 leading-relaxed bg-space-900/60 p-2 rounded border border-space-800">
                    {variant.aiLore}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                    <span>特性: <span className="text-purple-300">{variant.aiStats?.specialTrait}</span></span>
                    <span>幸運: <span className="text-cyan-300">{variant.aiStats?.luck}</span></span>
                  </div>

                  <div className="pt-1.5 border-t border-space-800 flex items-center justify-between text-[9px] font-mono text-gray-400">
                    <span className="flex items-center gap-1">
                      <Database className="w-3 h-3 text-cyan-400" /> 0G Storage
                    </span>
                    <span className="text-cyan-300 truncate max-w-[150px]">
                      {variant.storageHash}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedSlot(null)}
              className="w-full py-2.5 rounded-xl bg-space-800 hover:bg-space-700 text-gray-200 text-xs font-mono font-bold"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
