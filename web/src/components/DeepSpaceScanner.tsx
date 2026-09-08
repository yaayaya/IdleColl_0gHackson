import React, { useState } from "react";
import {
  Radar,
  Sparkles,
  Ticket,
  BookOpen,
  Layers,
  Clock,
  CheckCircle2,
  Radio,
  Cpu,
  Database,
  Link as ChainIcon,
  Loader2,
} from "lucide-react";
import { useDialog } from "../context/DialogContext.tsx";
import { useScannerQueue } from "../context/ScannerQueueContext.tsx";

interface DeepSpaceScannerProps {
  address: string | null;
  tickets: number;
  isConnecting?: boolean;
  onDrawSuccess: (newTickets: number) => void;
  onViewCodex: () => void;
  onConnectWallet?: () => void;
}

export const DeepSpaceScanner: React.FC<DeepSpaceScannerProps> = ({
  address,
  tickets,
  isConnecting = false,
  onViewCodex,
  onConnectWallet,
}) => {
  const { showError, showWarning } = useDialog();
  const { activeJobs, unrevealedJobs, enqueueScan, openJobReveal } = useScannerQueue();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isScanning = activeJobs.length > 0;
  const isQueueFull = activeJobs.length >= 2;

  const handleStartScan = async () => {
    if (!address) {
      if (onConnectWallet) onConnectWallet();
      return;
    }
    if (isQueueFull) {
      showWarning(
        "探測佇列已達上限（同時最多進行 2 個任務）！\n\n請等待當前任務處理完成，或點擊下方已完成的任務揭曉藏品。",
        "探測佇列已滿"
      );
      return;
    }
    if (tickets < 1) {
      showWarning(
        "艦隊探測券已耗盡！\n\n請前往「採礦艙」透過金幣兌換探測券，或等待採礦反應爐產出足夠金幣後再次補給。",
        "探測物資告罄"
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await enqueueScan();
      if (!res.success) {
        showError(res.error || "探測任務調度異常，請稍後再試！", "調度失敗");
      }
    } catch (err: any) {
      showError(err?.message || "網路連線異常", "通訊錯誤");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Scanner Radar Interface */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-space-850 via-space-900 to-space-950 border border-space-700/80 p-5 shadow-2xl flex flex-col items-center text-center">
        {/* Radar concentric circles */}
        <div className="relative w-56 h-56 my-3 flex items-center justify-center">
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
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0_330deg,rgba(0,240,255,0.15)_360deg)] animate-[spin_6s_linear_infinite]" />
          )}

          {/* Center radar emitter */}
          <div className="relative z-10 w-14 h-14 rounded-full bg-space-900 border-2 border-neon-cyan flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.5)]">
            <Radar
              className={`w-7 h-7 text-neon-cyan ${
                isScanning ? "animate-spin" : "animate-pulse"
              }`}
            />
          </div>
        </div>

        {/* Dynamic Scan Status Bar */}
        <div className="space-y-1 my-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-space-850 border border-space-700 text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                unrevealedJobs.length > 0
                  ? "bg-emerald-400 shadow-[0_0_8px_#34d399] animate-bounce"
                  : isScanning
                  ? "bg-neon-cyan shadow-[0_0_8px_#00f0ff] animate-ping"
                  : "bg-emerald-400"
              }`}
            />
            <span className="text-gray-300">
              {unrevealedJobs.length > 0
                ? `✨ 有 ${unrevealedJobs.length} 個探測藏品待點擊揭曉！`
                : isScanning
                ? `探測任務進行中 (${activeJobs.length}/2 個排程)`
                : "深空雷達待命中 · 隨時可啟動"}
            </span>
          </div>

          <p className="text-xs text-gray-400 font-mono">
            {unrevealedJobs.length > 0
              ? "🎁 探測已完成！請點擊下方佇列卡片以立體全像揭曉藏品"
              : isScanning
              ? "🚀 任務於背景非同步執行，您可自由切換其他頁面"
              : "探測深空星域，解鎖由 0G AI 生成並上鏈的星際藏品"}
          </p>
        </div>

        {/* Action Button: Instant Queue */}
        <div className="w-full space-y-2 mt-2">
          <button
            onClick={handleStartScan}
            disabled={isSubmitting || isConnecting || (Boolean(address) && (tickets < 1 || isQueueFull))}
            className={`w-full py-3.5 rounded-xl font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed ${
              !address
                ? "bg-gradient-to-r from-neon-cyan via-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black shadow-[0_0_20px_rgba(0,240,255,0.4)] cursor-pointer"
                : isQueueFull
                ? "bg-space-850 text-gray-500 border border-space-800 cursor-not-allowed"
                : tickets >= 1
                ? "bg-gradient-to-r from-neon-cyan via-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black shadow-[0_0_20px_rgba(0,240,255,0.4)] cursor-pointer"
                : "bg-space-850 text-gray-500 border border-space-800 cursor-not-allowed"
            }`}
          >
            {isSubmitting || isConnecting ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>
              {!address
                ? isConnecting
                  ? "錢包連線授權中..."
                  : "連線錢包以啟動探測"
                : isSubmitting
                ? "調度排程中..."
                : isQueueFull
                ? "探測佇列已達上限 (2/2 · 請等待完成)"
                : tickets >= 1
                ? `啟動深空探測 (消耗 1 張券 · 剩餘 ${tickets} 張)`
                : "探測券不足 (請至採礦艙補給)"}
            </span>
          </button>
        </div>
      </div>

      {/* Active Jobs & Unrevealed Collectibles Queue */}
      {(activeJobs.length > 0 || unrevealedJobs.length > 0) && (
        <div className="rounded-2xl bg-space-900 border border-cyan-500/40 p-4 space-y-3 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-space-800 pb-2">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-neon-cyan animate-pulse" />
              <h3 className="text-xs font-bold font-mono text-gray-100 uppercase tracking-wider">
                探測任務排程 ({activeJobs.length + unrevealedJobs.length})
              </h3>
            </div>
            <span className="text-[10px] font-mono text-cyan-400">
              {unrevealedJobs.length > 0 ? "✨ 藏品待揭曉" : "非同步運算中"}
            </span>
          </div>

          <div className="space-y-2.5">
            {/* Completed Unrevealed Jobs - Click to Reveal Modal */}
            {unrevealedJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => openJobReveal(job)}
                className="rounded-xl bg-gradient-to-r from-emerald-950/90 via-space-900 to-cyan-950/90 border-2 border-emerald-400 p-3.5 space-y-2 cursor-pointer shadow-[0_0_20px_rgba(52,211,153,0.35)] hover:border-neon-cyan hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] transition-all active:scale-[0.98] group"
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                    探測任務 #{job.id} · 探測完成！
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/50 animate-bounce">
                    ✨ 點擊揭曉藏品
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-gray-200">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  <span className="truncate">深空信號已成功捕捉！點擊此處立即揭曉立體全像</span>
                </div>
              </div>
            ))}

            {/* In-Progress / Queued Jobs */}
            {activeJobs.map((job, idx) => (
              <div
                key={job.id}
                className="rounded-xl bg-space-950/80 border border-space-800 p-3 space-y-2 text-left"
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="font-bold text-cyan-300">
                    探測任務 #{job.id} {job.status === "processing" ? "【解算中】" : "【排程佇列】"}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {job.status === "processing" ? "進行中" : "等待調度"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-gray-200">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="truncate">{job.stepMessage}</span>
                </div>

                {/* Progress bar animation */}
                <div className="w-full h-1.5 rounded-full bg-space-900 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-neon-cyan to-blue-500 rounded-full animate-pulse w-3/4" />
                </div>
              </div>
            ))}
          </div>

          <div className="p-2.5 rounded-xl bg-space-950/60 border border-space-800/80 text-[11px] font-mono text-gray-400 leading-relaxed">
            💡 同時最多進行 2 個探測任務。任務完成後請直接點擊上方完成卡片揭曉，藏品才會正式解鎖並收錄至星際圖鑑！
          </div>
        </div>
      )}

      {/* Quick Navigation Card */}
      <div className="rounded-2xl bg-space-900 border border-space-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-space-850 border border-space-750 flex items-center justify-center text-cyan-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-mono text-gray-200">查看已解鎖藏品</h4>
            <p className="text-[10px] text-gray-400 font-mono">前往星際圖鑑矩陣檢視所有 AI 變體</p>
          </div>
        </div>

        <button
          onClick={onViewCodex}
          className="px-3.5 py-2 rounded-xl bg-space-850 hover:bg-space-800 border border-space-700 text-cyan-300 font-mono text-xs font-semibold active:scale-95 transition-all"
        >
          進入圖鑑
        </button>
      </div>
    </div>
  );
};
