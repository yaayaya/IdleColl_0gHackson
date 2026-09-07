import React, { useState } from "react";
import { Radar, Sparkles, ExternalLink, ShieldCheck, Database, Award, X } from "lucide-react";
import { useDialog } from "../context/DialogContext.tsx";

interface DeepSpaceScannerProps {
  address: string | null;
  tickets: number;
  onDrawSuccess: (newTickets: number) => void;
  onViewCodex: () => void;
}

export const DeepSpaceScanner: React.FC<DeepSpaceScannerProps> = ({
  address,
  tickets,
  onDrawSuccess,
  onViewCodex,
}) => {
  const { showError } = useDialog();
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<string>("連接 0G 網路中...");
  const [revealedItem, setRevealedItem] = useState<any | null>(null);

  const handleScan = async () => {
    if (!address || tickets < 1 || isScanning) return;

    try {
      setIsScanning(true);
      setRevealedItem(null);

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([15, 50, 15]);
      }

      // Animated steps
      setScanStep("📡 調度 0G Serving AI 引擎...");
      const step1 = setTimeout(() => setScanStep("🧬 解算藏品專屬傳奇背景與詞條..."), 600);
      const step2 = setTimeout(() => setScanStep("📦 永久封存 Metadata 至 0G Storage..."), 1200);
      const step3 = setTimeout(() => setScanStep("⛓️ 0G Galileo 區塊鏈代付鑄造 NFT..."), 1800);

      const res = await fetch("/api/gacha/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);

      const data = await res.json();
      if (res.ok && data.success) {
        onDrawSuccess(data.remainingTickets);
        setTimeout(() => {
          setIsScanning(false);
          setRevealedItem(data);
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([40, 80, 60]);
          }
        }, 600);
      } else {
        showError(data.error || "探測雷達受干擾，請確認探測券餘額！", "深空探測異常");
        setIsScanning(false);
      }
    } catch (err) {
      console.error("Gacha draw error:", err);
      setIsScanning(false);
    }
  };

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

  return (
    <div className="space-y-4 pb-20">
      {/* Scanner Radar Interface */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-space-850 via-space-900 to-space-950 border border-space-700/80 p-5 shadow-2xl flex flex-col items-center text-center">
        {/* Radar concentric circles */}
        <div className="relative w-60 h-60 my-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-cyan-500/20" />
          <div className="absolute inset-6 rounded-full border border-cyan-500/25" />
          <div className="absolute inset-14 rounded-full border border-cyan-500/35" />
          <div className="absolute inset-22 rounded-full border border-cyan-500/50" />

          {/* Crosshairs */}
          <div className="absolute inset-x-0 top-1/2 h-[1px] bg-cyan-500/30" />
          <div className="absolute inset-y-0 left-1/2 w-[1px] bg-cyan-500/30" />

          {/* Sweep beam animation */}
          {isScanning ? (
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0_300deg,rgba(0,240,255,0.4)_360deg)] animate-[spin_1.5s_linear_infinite]" />
          ) : (
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0_320deg,rgba(0,240,255,0.15)_360deg)] animate-[spin_6s_linear_infinite]" />
          )}

          {/* Center core */}
          <div className="relative z-10 w-16 h-16 rounded-full bg-space-900 border-2 border-neon-cyan flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.5)]">
            <Radar className={`w-8 h-8 text-neon-cyan ${isScanning ? "animate-spin" : ""}`} />
          </div>
        </div>

        {/* Status text */}
        <div className="min-h-12 flex flex-col items-center justify-center mb-2">
          {isScanning ? (
            <div className="flex flex-col items-center gap-1 animate-pulse">
              <span className="text-xs font-mono font-bold text-neon-cyan">{scanStep}</span>
              <span className="text-[10px] text-gray-400 font-mono">0G Galileo Testnet 16602</span>
            </div>
          ) : (
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">
                深空探測矩陣已就緒
              </h3>
              <p className="text-[11px] text-gray-400 font-mono">
                當前可用：<span className="text-purple-300 font-bold">{tickets}</span> 張探測券
              </p>
            </div>
          )}
        </div>

        {/* Scan button */}
        <button
          onClick={handleScan}
          disabled={tickets < 1 || isScanning || !address}
          className="w-full py-3.5 rounded-xl font-bold font-mono text-sm tracking-wide transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-neon-cyan via-blue-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-black shadow-[0_0_20px_rgba(0,240,255,0.3)] flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isScanning ? "探測生成中..." : "掃描深空 (消耗 1 張探測券)"}</span>
        </button>
      </div>

      {/* Reveal Modal */}
      {revealedItem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm rounded-2xl bg-space-900 border-2 border-neon-cyan p-5 shadow-[0_0_35px_rgba(0,240,255,0.4)] animate-in fade-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={() => setRevealedItem(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-space-800 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Rarity & Title */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border uppercase ${getRarityBadge(revealedItem.archetype.rarity)}`}>
                {revealedItem.archetype.rarity}
              </span>
              <span className="text-[10px] font-mono text-gray-400">
                Token #{revealedItem.collectible.tokenId || "1"}
              </span>
            </div>

            {/* Collectible Art */}
            <div className="w-full aspect-square rounded-xl bg-space-950/80 border border-space-700/60 p-4 flex items-center justify-center mb-3 shadow-inner">
              <img
                src={revealedItem.archetype.baseImage?.replace(".png", ".svg")}
                alt={revealedItem.collectible.aiTitle}
                className="max-w-full max-h-full drop-shadow-[0_0_16px_rgba(0,240,255,0.3)] object-contain"
              />
            </div>

            {/* AI Generated Content */}
            <div className="space-y-2 text-left">
              <h3 className="text-base font-bold text-gray-100 font-mono tracking-tight leading-snug">
                {revealedItem.collectible.aiTitle}
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed bg-space-850/80 p-2.5 rounded-lg border border-space-700/50">
                {revealedItem.collectible.aiLore}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="bg-space-800/60 p-2 rounded border border-space-700">
                  <span className="text-gray-400 block text-[9px]">專屬特性</span>
                  <span className="text-purple-300 font-semibold">{revealedItem.collectible.aiStats?.specialTrait}</span>
                </div>
                <div className="bg-space-800/60 p-2 rounded border border-space-700">
                  <span className="text-gray-400 block text-[9px]">深空幸運值</span>
                  <span className="text-cyan-300 font-semibold">{revealedItem.collectible.aiStats?.luck} / 100</span>
                </div>
              </div>

              {/* 0G Storage & Chain Badges */}
              <div className="space-y-1.5 pt-2 border-t border-space-800 text-[10px] font-mono">
                <div className="flex items-center justify-between text-gray-400">
                  <span className="flex items-center gap-1">
                    <Database className="w-3 h-3 text-cyan-400" /> 0G Storage:
                  </span>
                  <span className="text-cyan-300 truncate max-w-[170px]" title={revealedItem.collectible.storageHash}>
                    {revealedItem.collectible.storageHash}
                  </span>
                </div>
                {revealedItem.collectible.txHash && (
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" /> 0G Chain Tx:
                    </span>
                    <a
                      href={`https://chainscan-galileo.0g.ai/tx/${revealedItem.collectible.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-300 hover:underline flex items-center gap-0.5"
                    >
                      <span>{revealedItem.collectible.txHash.slice(0, 10)}...</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setRevealedItem(null)}
                className="flex-1 py-2.5 rounded-xl bg-space-800 hover:bg-space-700 text-gray-200 text-xs font-mono font-bold"
              >
                收下藏品
              </button>
              <button
                onClick={() => {
                  setRevealedItem(null);
                  onViewCodex();
                }}
                className="flex-1 py-2.5 rounded-xl bg-neon-cyan hover:bg-cyan-400 text-black text-xs font-mono font-bold flex items-center justify-center gap-1"
              >
                <Award className="w-3.5 h-3.5" />
                <span>前往圖鑑</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
