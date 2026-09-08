import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "./components/Navbar.tsx";
import { IdleCockpit } from "./components/IdleCockpit.tsx";
import { DeepSpaceScanner } from "./components/DeepSpaceScanner.tsx";
import { CodexMatrix } from "./components/CodexMatrix.tsx";
import { Marketplace } from "./components/Marketplace.tsx";
import { RenameModal } from "./components/RenameModal.tsx";
import { ConnectWalletModal } from "./components/ConnectWalletModal.tsx";
import { ScannerQueueProvider } from "./context/ScannerQueueContext.tsx";
import { useWeb3 } from "./hooks/useWeb3.ts";
import { Pickaxe, Radar, BookOpen, ShoppingBag } from "lucide-react";

type TabType = "cockpit" | "scanner" | "codex" | "market";

// Hot-reload enabled with Vite HMR
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
  const [playerName, setPlayerName] = useState<string>("Captain");
  const [coins, setCoins] = useState<number>(0);
  const [tickets, setTickets] = useState<number>(0);
  const [initialPending, setInitialPending] = useState<number>(0);
  const [miningRate, setMiningRate] = useState<number>(10);
  const [isRenameOpen, setIsRenameOpen] = useState<boolean>(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);

  const handleConnectClick = () => {
    const eth = typeof window !== "undefined" ? (window as any).ethereum : null;
    const hasAuthenticExtension = Boolean(
      eth && eth.isMetaMask && !eth._log
    );

    if (hasAuthenticExtension) {
      connectWallet();
    } else {
      setIsConnectModalOpen(true);
    }
  };

  // Sync profile when wallet address changes
  const fetchProfile = useCallback(async () => {
    if (!address) {
      setPlayerName("Captain");
      setCoins(0);
      setTickets(0);
      setInitialPending(0);
      return;
    }
    try {
      const res = await fetch(`/api/player/profile?address=${address}`);
      const data = await res.json();
      if (res.ok && data.player) {
        setPlayerName(data.player.name || `Captain_${address.slice(2, 6)}`);
        setCoins(data.player.coins);
        setTickets(data.player.tickets);
        setInitialPending(data.pendingCoins);
        setMiningRate(data.miningRate || 10);
      }
    } catch (err) {
      console.error("Failed to fetch player profile:", err);
    }
  }, [address]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleRename = async (newName: string): Promise<boolean> => {
    if (!address) return false;
    try {
      const res = await fetch("/api/player/nickname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, name: newName }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPlayerName(data.player.name);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Rename error:", e);
      return false;
    }
  };

  const handleTabChange = (tab: TabType) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([10]);
    }
    setActiveTab(tab);
  };

  return (
    <ScannerQueueProvider
      address={address}
      tickets={tickets}
      onTicketsChange={(newTickets) => setTickets(newTickets)}
      onCollectiblesUpdated={() => fetchProfile()}
    >
      <div className="min-h-screen bg-space-950 flex justify-center text-gray-100 selection:bg-neon-cyan selection:text-black">
        {/* Mobile App Container Shell */}
        <div className="w-full max-w-md min-h-screen flex flex-col bg-space-950 border-x border-space-850 shadow-2xl relative">
          {/* Top Navbar */}
          <Navbar
            address={address}
            playerName={playerName}
            balance0G={balance0G}
            isCorrectNetwork={isCorrectNetwork}
            coins={coins}
            tickets={tickets}
            connectWallet={handleConnectClick}
            disconnectWallet={disconnectWallet}
            switchNetwork={switchNetwork}
            onOpenRenameModal={() => setIsRenameOpen(true)}
          />

          {/* Main Content View */}
          <main className="flex-1 p-4 overflow-y-auto">
            {activeTab === "cockpit" && (
              <IdleCockpit
                address={address}
                playerName={playerName}
                coins={coins}
                tickets={tickets}
                initialPending={initialPending}
                miningRate={miningRate}
                onClaimSuccess={(newCoins) => setCoins(newCoins)}
                onBuyTicketSuccess={(newCoins, newTickets) => {
                  setCoins(newCoins);
                  setTickets(newTickets);
                }}
                onConnectWallet={handleConnectClick}
                onRename={handleRename}
              />
            )}

            {activeTab === "scanner" && (
              <DeepSpaceScanner
                address={address}
                tickets={tickets}
                onDrawSuccess={(newTickets) => setTickets(newTickets)}
                onViewCodex={() => handleTabChange("codex")}
                onConnectWallet={handleConnectClick}
              />
            )}

            {activeTab === "codex" && <CodexMatrix address={address} />}

            {activeTab === "market" && (
              <Marketplace
                address={address}
                balance0G={balance0G}
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
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
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
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
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
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
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
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
                activeTab === "market"
                  ? "text-neon-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.6)] font-bold scale-105"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="text-[10px] font-mono">0G 拍賣場</span>
            </button>
          </nav>

          {/* Root Rename Modal */}
          <RenameModal
            isOpen={isRenameOpen}
            currentName={playerName}
            onClose={() => setIsRenameOpen(false)}
            onSave={handleRename}
          />

          {/* Root Connect Wallet Modal */}
          <ConnectWalletModal
            isOpen={isConnectModalOpen}
            onClose={() => setIsConnectModalOpen(false)}
            onConnectMetaMask={connectWallet}
          />
        </div>
      </div>
    </ScannerQueueProvider>
  );
}
