import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "./components/Navbar.tsx";
import { IdleCockpit } from "./components/IdleCockpit.tsx";
import { DeepSpaceScanner } from "./components/DeepSpaceScanner.tsx";
import { CodexMatrix } from "./components/CodexMatrix.tsx";
import { Marketplace } from "./components/Marketplace.tsx";
import { useWeb3 } from "./hooks/useWeb3.ts";
import { Pickaxe, Radar, BookOpen, ShoppingBag } from "lucide-react";

type TabType = "cockpit" | "scanner" | "codex" | "market";

export function App() {
  const {
    address,
    balance0G,
    isCorrectNetwork,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    getContracts,
    getReadOnlyContracts,
    refreshBalance,
  } = useWeb3();

  const [activeTab, setActiveTab] = useState<TabType>("cockpit");
  const [coins, setCoins] = useState<number>(0);
  const [tickets, setTickets] = useState<number>(0);
  const [initialPending, setInitialPending] = useState<number>(0);
  const [miningRate, setMiningRate] = useState<number>(2);

  // Sync profile when wallet address changes
  const fetchProfile = useCallback(async () => {
    if (!address) {
      setCoins(0);
      setTickets(0);
      setInitialPending(0);
      return;
    }
    try {
      const res = await fetch(`/api/player/profile?address=${address}`);
      const data = await res.json();
      if (res.ok && data.player) {
        setCoins(data.player.coins);
        setTickets(data.player.tickets);
        setInitialPending(data.pendingCoins);
        setMiningRate(data.miningRate || 2);
      }
    } catch (err) {
      console.error("Failed to fetch player profile:", err);
    }
  }, [address]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleTabChange = (tab: TabType) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([10]);
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-space-950 flex justify-center text-gray-100 selection:bg-neon-cyan selection:text-black">
      {/* Mobile App Container Shell */}
      <div className="w-full max-w-md min-h-screen flex flex-col bg-space-950 border-x border-space-850 shadow-2xl relative">
        {/* Top Navbar */}
        <Navbar
          address={address}
          balance0G={balance0G}
          isCorrectNetwork={isCorrectNetwork}
          coins={coins}
          tickets={tickets}
          connectWallet={connectWallet}
          disconnectWallet={disconnectWallet}
          switchNetwork={switchNetwork}
        />

        {/* Main Content View */}
        <main className="flex-1 p-4 overflow-y-auto">
          {activeTab === "cockpit" && (
            <IdleCockpit
              address={address}
              coins={coins}
              tickets={tickets}
              initialPending={initialPending}
              miningRate={miningRate}
              onClaimSuccess={(newCoins) => setCoins(newCoins)}
              onBuyTicketSuccess={(newCoins, newTickets) => {
                setCoins(newCoins);
                setTickets(newTickets);
              }}
            />
          )}

          {activeTab === "scanner" && (
            <DeepSpaceScanner
              address={address}
              tickets={tickets}
              onDrawSuccess={(newTickets) => setTickets(newTickets)}
              onViewCodex={() => handleTabChange("codex")}
            />
          )}

          {activeTab === "codex" && <CodexMatrix address={address} />}

          {activeTab === "market" && (
            <Marketplace
              address={address}
              isCorrectNetwork={isCorrectNetwork}
              switchNetwork={switchNetwork}
              getContracts={getContracts}
              getReadOnlyContracts={getReadOnlyContracts}
              onTradeComplete={() => {
                refreshBalance();
                fetchProfile();
              }}
            />
          )}
        </main>

        {/* Fixed Mobile Bottom Tab Bar */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-space-950/95 backdrop-blur-md border-t border-space-800 px-3 py-2 pb-safe flex items-center justify-around z-40">
          <button
            onClick={() => handleTabChange("cockpit")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              activeTab === "cockpit"
                ? "text-neon-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.6)] font-bold scale-105"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Pickaxe className="w-4 h-4" />
            <span className="text-[10px] font-mono">採礦艙</span>
          </button>

          <button
            onClick={() => handleTabChange("scanner")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              activeTab === "scanner"
                ? "text-neon-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.6)] font-bold scale-105"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Radar className="w-4 h-4" />
            <span className="text-[10px] font-mono">深空探測</span>
          </button>

          <button
            onClick={() => handleTabChange("codex")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              activeTab === "codex"
                ? "text-neon-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.6)] font-bold scale-105"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-[10px] font-mono">星際圖鑑</span>
          </button>

          <button
            onClick={() => handleTabChange("market")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              activeTab === "market"
                ? "text-neon-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.6)] font-bold scale-105"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="text-[10px] font-mono">0G 拍賣場</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
