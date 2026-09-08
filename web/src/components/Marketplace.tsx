import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ethers } from "ethers";
import {
  ShoppingBag,
  PlusCircle,
  Tag,
  Zap,
  X,
  ShieldAlert,
  Search,
  Eye,
  Sparkles,
  Database,
  Layers,
  ArrowUpDown,
  Filter,
  Check,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useDialog } from "../context/DialogContext.tsx";

interface MarketplaceProps {
  address: string | null;
  balance0G?: string;
  isCorrectNetwork: boolean;
  isSwitchingNetwork?: boolean;
  switchNetwork: () => Promise<void> | void;
  getContracts: () => Promise<any> | any;
  getReadOnlyContracts: () => any;
  onTradeComplete: () => void;
}

export const Marketplace: React.FC<MarketplaceProps> = ({
  address,
  balance0G = "0.00",
  isCorrectNetwork,
  isSwitchingNetwork = false,
  switchNetwork,
  getContracts,
  getReadOnlyContracts,
  onTradeComplete,
}) => {
  const { showSuccess, showError, showWarning, showConfirm } = useDialog();
  const [listings, setListings] = useState<any[]>([]);
  const [userItems, setUserItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isListingModalOpen, setIsListingModalOpen] = useState<boolean>(false);
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
  const [priceInput, setPriceInput] = useState<string>("0.005");
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [isListing, setIsListing] = useState<boolean>(false);
  const [processingBuyId, setProcessingBuyId] = useState<number | null>(null);
  const [processingCancelId, setProcessingCancelId] = useState<number | null>(null);

  // Search, Filter & Inspection States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [rarityFilter, setRarityFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "mining-desc" | "luck-desc" | "token-asc">("price-asc");
  const [inspectItem, setInspectItem] = useState<any | null>(null);

  // Helper to extract parsed stats
  const parseStats = (target: any) => {
    const stats = target?.aiStats || target?.details?.aiStats || {};
    const miningBonus = stats.miningBonus || (stats.miningBonusValue ? `+${stats.miningBonusValue}/s` : "+10%");
    const miningBonusValue = Number(stats.miningBonusValue) || (parseFloat(stats.miningBonus) ? parseFloat(stats.miningBonus) / 10 : 1.0);
    const capacityBonus = Number(stats.capacityBonus) || 100;
    const luck = Number(stats.luck ?? stats.rarityScore) || 50;
    const specialTrait = stats.specialTrait || "星塵共鳴";
    const traitDescription = stats.traitDescription || `提供 ${miningBonus} 產能與 +${capacityBonus} 容量擴充`;

    return {
      miningBonus,
      miningBonusValue,
      capacityBonus,
      luck,
      specialTrait,
      traitDescription,
    };
  };

  const getRarityBadgeColor = (rarity: string) => {
    switch (rarity) {
      case "Legendary":
        return "bg-amber-500/20 text-amber-300 border-amber-500/60";
      case "Epic":
        return "bg-pink-500/20 text-pink-300 border-pink-500/50";
      case "Rare":
        return "bg-purple-500/20 text-purple-300 border-purple-500/50";
      default:
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
    }
  };

  // Fetch active listings from 0G Marketplace contract (read-only direct from 0G RPC)
  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      const contracts = getReadOnlyContracts?.() || getContracts();
      if (!contracts) {
        return;
      }
      const rawListings = await contracts.marketplace.getActiveListings();
      const enriched = await Promise.all(
        rawListings.map(async (item: any) => {
          const listingId = Number(item.listingId);
          const tokenId = Number(item.tokenId);
          const price = ethers.formatEther(item.price);
          const seller = item.seller.toLowerCase();

          // Fetch metadata from backend for rich display
          let details: any = null;
          try {
            const res = await fetch(`/api/marketplace/collectible/${tokenId}`);
            if (res.ok) {
              details = await res.json();
            }
          } catch {}

          return {
            listingId,
            tokenId,
            price,
            seller,
            details,
          };
        })
      );
      setListings(enriched);
    } catch (err) {
      console.error("Failed to load on-chain listings:", err);
    } finally {
      setLoading(false);
    }
  }, [getReadOnlyContracts, getContracts]);

  // Fetch user's own items for listing modal
  const fetchUserItems = useCallback(async () => {
    if (!address) return;
    try {
      const res = await fetch(`/api/codex?address=${address}`);
      const data = await res.json();
      if (res.ok && data.slots) {
        const all: any[] = [];
        data.slots.forEach((s: any) => {
          s.variants.forEach((v: any) => {
            all.push({ ...v, archetype: s.archetype });
          });
        });
        setUserItems(all);
        if (all.length > 0 && !selectedTokenId) {
          setSelectedTokenId(all[0].tokenId);
        }
      }
    } catch (err) {
      console.error("Failed to fetch user items:", err);
    }
  }, [address, selectedTokenId]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Handle on-chain listing
  const handleList = async () => {
    if (!selectedTokenId || !priceInput) return;
    if (!address) {
      showWarning("請先連線 0G Galileo 錢包以發布賣單！", "尚未連線錢包");
      return;
    }

    try {
      setIsListing(true);
      let contracts = await getContracts();
      if (!contracts) {
        setActionStatus("正在請求錢包切換至 0G Galileo 測試網路...");
        await switchNetwork();
        contracts = await getContracts();
        if (!contracts) {
          showWarning("請在錢包中確認已切換至 0G Galileo 測試網路 (Chain ID: 16602)！", "網路未匹配");
          setActionStatus(null);
          setIsListing(false);
          return;
        }
      }

      const priceWei = ethers.parseEther(priceInput || "0.001");

      // 1. Check if token is already approved
      let isAlreadyApproved = false;
      try {
        const approvedAddr = await contracts.nft.getApproved(selectedTokenId);
        if (approvedAddr && approvedAddr.toLowerCase() === contracts.contractsData.marketplaceAddress.toLowerCase()) {
          isAlreadyApproved = true;
        } else {
          const isApprovedAll = await contracts.nft.isApprovedForAll(address, contracts.contractsData.marketplaceAddress);
          if (isApprovedAll) {
            isAlreadyApproved = true;
          }
        }
      } catch (e) {
        console.warn("Approval pre-check notice:", e);
      }

      // 2. Approve if not yet approved
      if (!isAlreadyApproved) {
        setActionStatus("1/2: 請在 MetaMask 彈窗中授權藏品 (Approve)...");
        const approveTx = await contracts.nft.approve(contracts.contractsData.marketplaceAddress, selectedTokenId, {
          gasLimit: 180000,
        });
        setActionStatus("1/2: 正在等待 0G Galileo 區塊確認授權...");
        await approveTx.wait();
      }

      // 3. List
      setActionStatus("2/2: 請在 MetaMask 彈窗中確認發布賣單 (List)...");
      const listTx = await contracts.marketplace.listItem(
        contracts.contractsData.nftAddress,
        selectedTokenId,
        priceWei,
        { gasLimit: 350000 }
      );
      setActionStatus("2/2: 正在等待 0G 拍賣行寫入上架記錄...");
      await listTx.wait();

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([20, 40]);
      }

      setIsListingModalOpen(false);
      setActionStatus(null);
      await fetchListings();
      showSuccess("上架成功！已發布至 0G 鏈上拍賣場，買家將以 0G 原生幣向你購買。", "拍賣上架完成");
    } catch (err: any) {
      console.error("Listing error:", err);
      setActionStatus(null);
      const errMsg = err?.reason || err?.message || "";
      if (errMsg.includes("rejected") || errMsg.includes("User denied") || err?.code === 4001 || err?.code === "ACTION_REJECTED") {
        showWarning("您已在錢包中取消上架操作。", "操作已取消");
      } else if (errMsg.includes("insufficient funds")) {
        showError("0G 原生代幣不足以支付 Gas 燃料費，請先至 0G 水龍頭領取測試幣！", "燃料費不足");
      } else {
        showError(err.reason || err.message || "上架失敗，請確認 0G 錢包授權狀態！", "上架交易中斷");
      }
    } finally {
      setIsListing(false);
      setActionStatus(null);
    }
  };

  // Handle on-chain buy with native 0G
  const handleBuy = async (listing: any) => {
    if (!address) {
      showWarning("請先連線 0G Galileo 錢包以進行購買！", "尚未連線錢包");
      return;
    }

    // Guard: Prevent buying own item
    if (listing.seller.toLowerCase() === address.toLowerCase()) {
      showWarning("這是您自己上架掛售的藏品，無法向自己購買！\n若要取回藏品請直接點擊「下架」。", "無法購買自己的藏品");
      return;
    }

    // Guard: Check 0G balance
    if (balance0G && parseFloat(balance0G) < parseFloat(listing.price)) {
      showError(
        `0G 原生幣餘額不足！\n\n購買 Token #${listing.tokenId} 需要 ${listing.price} 0G，您當前錢包僅有 ${balance0G} 0G。\n請先領取 0G 測試代幣後再試！`,
        "0G 餘額不足"
      );
      return;
    }

    let contracts = await getContracts();
    if (!contracts) {
      setActionStatus("正在切換至 0G Galileo 測試網路...");
      await switchNetwork();
      contracts = await getContracts();
      if (!contracts) {
        showWarning("請確認已連接 0G Galileo 錢包並切換至 0G 測試網！", "連線異常");
        setActionStatus(null);
        return;
      }
    }

    try {
      setProcessingBuyId(listing.listingId);
      setActionStatus(`請在 MetaMask 彈窗中確認支付 ${listing.price} 0G...`);
      const priceWei = ethers.parseEther(listing.price);

      // Explicit gasLimit avoids RPC estimateGas hanging on 0G testnet
      const buyTx = await contracts.marketplace.buyItem(listing.listingId, {
        value: priceWei,
        gasLimit: 350000,
      });

      setActionStatus(`0G 交易已送出 (${buyTx.hash.slice(0, 10)}...)，等待 0G Galileo 區塊確認中...`);
      const receipt = await buyTx.wait();

      setActionStatus("交易確認成功，正在同步星際圖鑑資料...");
      // Sync backend DB ownership
      await fetch("/api/marketplace/sync-buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenId: listing.tokenId,
          buyerAddress: address,
          txHash: receipt.hash,
        }),
      });

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([50, 100]);
      }

      setActionStatus(null);
      await fetchListings();
      onTradeComplete();
      showSuccess(`購買成功！已支付 ${listing.price} 0G，Token #${listing.tokenId} 已安全轉入你的錢包與圖鑑！`, "0G 鏈上交易成功");
      if (inspectItem?.listingId === listing.listingId) {
        setInspectItem(null);
      }
    } catch (err: any) {
      console.error("Buy error:", err);
      setActionStatus(null);
      const errMsg = err?.reason || err?.message || "";
      if (
        errMsg.includes("rejected") ||
        errMsg.includes("User denied") ||
        err?.code === 4001 ||
        err?.code === "ACTION_REJECTED"
      ) {
        showWarning("您已在錢包中取消此次購買交易。", "交易已取消");
      } else if (errMsg.includes("insufficient funds")) {
        showError(`0G 原生幣餘額不足以支付購買金額 (${listing.price} 0G) 或 Gas 燃料費！`, "0G 餘額不足");
      } else if (errMsg.includes("Seller cannot buy")) {
        showWarning("無法向自己購買上架中的藏品！", "操作無效");
      } else {
        showError(err.reason || err.message || "購買失敗，請確認 0G 測試幣餘額足夠！", "購買失敗");
      }
    } finally {
      setProcessingBuyId(null);
      setActionStatus(null);
    }
  };

  // Handle cancel listing with sci-fi confirmation dialog
  const handleCancel = async (listingId: number) => {
    let contracts = await getContracts();
    if (!contracts) {
      await switchNetwork();
      contracts = await getContracts();
      if (!contracts) {
        showWarning("請先切換至 0G Galileo 測試網路！", "網路未匹配");
        return;
      }
    }

    showConfirm({
      title: "下架賣單確認",
      message: "確定要將這件藏品從 0G 拍賣行撤回嗎？\n\n◆ 智能合約不收平台手續費（免費）\n◆ 僅需極微量 0G Gas 燃料費",
      confirmText: "確認下架",
      cancelText: "保留賣單",
      onConfirm: async () => {
        try {
          setProcessingCancelId(listingId);
          setActionStatus("請在 MetaMask 彈窗中確認下架操作...");
          const tx = await contracts.marketplace.cancelListing(listingId, {
            gasLimit: 200000,
          });
          setActionStatus("正在等待 0G 鏈上下架確認...");
          await tx.wait();
          setActionStatus(null);
          await fetchListings();
          showSuccess("藏品已成功從 0G 拍賣行撤回！", "下架完成");
          if (inspectItem?.listingId === listingId) {
            setInspectItem(null);
          }
        } catch (err: any) {
          console.error("Cancel error:", err);
          setActionStatus(null);
          const errMsg = err?.reason || err?.message || "";
          if (errMsg.includes("rejected") || errMsg.includes("User denied") || err?.code === 4001 || err?.code === "ACTION_REJECTED") {
            showWarning("您已取消下架操作。", "操作已取消");
          } else {
            showError(err.reason || err.message || "下架失敗，請確認 0G 錢包簽署！", "下架失敗");
          }
        } finally {
          setProcessingCancelId(null);
          setActionStatus(null);
        }
      },
    });
  };

  // Filter & Sort listings
  const filteredListings = useMemo(() => {
    return listings
      .filter((item) => {
        // 1. Rarity filter
        const rarity = item.details?.archetype?.rarity || "Common";
        if (rarityFilter !== "ALL" && rarity.toLowerCase() !== rarityFilter.toLowerCase()) {
          return false;
        }

        // 2. Search query filter (title, archetype name, trait name, tokenId)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const title = (item.details?.aiTitle || "").toLowerCase();
          const archName = (item.details?.archetype?.name || "").toLowerCase();
          const trait = (item.details?.aiStats?.specialTrait || "").toLowerCase();
          const traitDesc = (item.details?.aiStats?.traitDescription || "").toLowerCase();
          const tokenIdStr = String(item.tokenId);
          return (
            title.includes(q) ||
            archName.includes(q) ||
            trait.includes(q) ||
            traitDesc.includes(q) ||
            tokenIdStr.includes(q)
          );
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = parseFloat(a.price) || 0;
        const priceB = parseFloat(b.price) || 0;
        const statsA = parseStats(a.details);
        const statsB = parseStats(b.details);

        switch (sortBy) {
          case "price-asc":
            return priceA - priceB;
          case "price-desc":
            return priceB - priceA;
          case "mining-desc":
            return statsB.miningBonusValue - statsA.miningBonusValue;
          case "luck-desc":
            return statsB.luck - statsA.luck;
          case "token-asc":
            return a.tokenId - b.tokenId;
          default:
            return 0;
        }
      });
  }, [listings, rarityFilter, searchQuery, sortBy]);

  return (
    <div className="space-y-4 pb-20">
      {/* Network Alert Banner */}
      {address && !isCorrectNetwork && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/90 to-red-950/80 border-2 border-amber-500/80 text-amber-200 text-xs font-mono flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-pulse">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-amber-300">⚠️ 目前錢包不在 0G Galileo 測試網路！</p>
              <p className="text-[11px] text-amber-200/90">
                本拍賣行所有合約授權與買賣皆在 <strong>0G 鏈</strong> 上以 <strong>0G 原生幣</strong> 進行。請切換網路，避免誤用主網 ETH 交易。
              </p>
            </div>
          </div>
          <button
            onClick={switchNetwork}
            disabled={isSwitchingNetwork}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold font-mono text-xs whitespace-nowrap shadow-md active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            {isSwitchingNetwork ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                <span>切換網路中...</span>
              </>
            ) : (
              <span>切換至 0G Galileo</span>
            )}
          </button>
        </div>
      )}

      {/* Header with Post Listing button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-neon-cyan" />
          <h2 className="text-xs font-bold font-mono tracking-wider text-gray-200 uppercase">
            0G 去中心化拍賣行 (Market)
          </h2>
        </div>

        <button
          onClick={() => {
            fetchUserItems();
            setIsListingModalOpen(true);
          }}
          disabled={!address}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-neon-cyan to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-mono font-bold text-xs shadow-[0_0_12px_rgba(0,240,255,0.3)] active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>上架藏品</span>
        </button>
      </div>

      {/* Action Status Pill */}
      {actionStatus && (
        <div className="p-3 rounded-xl bg-purple-950/90 border border-purple-500 text-purple-200 text-xs font-mono flex items-center justify-between gap-2 shadow-[0_0_15px_rgba(168,85,247,0.3)] animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-sm">⏳</span>
            <span>{actionStatus}</span>
          </div>
          <button
            onClick={() => setActionStatus(null)}
            className="text-[10px] px-2 py-0.5 rounded bg-space-800 hover:bg-space-700 text-gray-300 border border-space-600 active:scale-95 whitespace-nowrap"
          >
            關閉
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="rounded-2xl bg-space-900/90 border border-space-750 p-3 space-y-2.5 shadow-md">
        {/* Search Bar + Sort Select */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-500" />
            <input
              type="text"
              placeholder="搜尋名稱、特異詞條或 Token ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-1.5 pl-8 pr-7 rounded-lg bg-space-950 border border-space-800 text-xs font-mono text-gray-200 placeholder-gray-500 focus:outline-none focus:border-neon-cyan transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2 text-gray-500 hover:text-gray-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="relative shrink-0">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="py-1.5 px-2.5 rounded-lg bg-space-950 border border-space-800 text-[11px] font-mono text-cyan-300 focus:outline-none focus:border-neon-cyan cursor-pointer"
            >
              <option value="price-asc">價格：低 → 高</option>
              <option value="price-desc">價格：高 → 低</option>
              <option value="mining-desc">⚡ 產能加成最高</option>
              <option value="luck-desc">🍀 幸運共振最高</option>
              <option value="token-asc">Token ID 序</option>
            </select>
          </div>
        </div>

        {/* Rarity Pills Filter */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: "ALL", label: "全部" },
              { id: "Common", label: "普通" },
              { id: "Rare", label: "稀有" },
              { id: "Epic", label: "史詩" },
              { id: "Legendary", label: "傳奇" },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setRarityFilter(r.id)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-mono whitespace-nowrap transition-all ${
                  rarityFilter === r.id
                    ? "bg-cyan-500/20 text-neon-cyan border border-neon-cyan/80 font-bold shadow-[0_0_8px_rgba(0,240,255,0.3)]"
                    : "bg-space-950/70 text-gray-400 border border-space-800 hover:text-gray-200"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <span className="text-[10px] font-mono text-gray-500 shrink-0 pl-2">
            共 {filteredListings.length} 件
          </span>
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="py-12 text-center text-gray-400 font-mono text-xs">
          讀取 0G 拍賣行資料中...
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="rounded-2xl bg-space-900 border border-space-800 p-8 text-center space-y-2">
          <p className="text-gray-400 font-mono text-xs">
            {listings.length === 0 ? "目前拍賣行尚無掛售中的藏品" : "沒有符合篩選條件的藏品"}
          </p>
          <p className="text-[11px] text-gray-500 font-mono">
            {listings.length === 0
              ? "點擊右上角「上架藏品」成為第一個在 0G 擺攤的星際商人！"
              : "請嘗試切換稀有度或清除搜尋關鍵字"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredListings.map((item) => {
            const isSeller = address && item.seller === address.toLowerCase();
            const fallbackTitle = item.details?.aiTitle || `0G Collectible #${item.tokenId}`;
            const image = (item.details?.archetype?.baseImage || "/items/01_ramen.svg").replace(".png", ".svg");
            const rarity = item.details?.archetype?.rarity || "Common";
            const stats = parseStats(item.details);

            return (
              <div
                key={item.listingId}
                className="rounded-xl bg-space-900 border border-space-700/80 p-3 flex flex-col justify-between space-y-2 shadow-lg hover:border-neon-cyan/50 transition-all relative group"
              >
                {/* Artwork (Click to Inspect) */}
                <div
                  onClick={() => setInspectItem(item)}
                  className="w-full aspect-square rounded-lg bg-space-950 p-2 flex items-center justify-center border border-space-800 cursor-pointer relative overflow-hidden group-hover:border-cyan-500/50 transition-all"
                  title="點擊檢視 0G 特異詞條與背景"
                >
                  <img src={image} alt={fallbackTitle} className="max-w-full max-h-full object-contain transition-transform group-hover:scale-105" />
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-cyan-300 flex items-center gap-0.5 backdrop-blur-xs opacity-80 group-hover:opacity-100">
                    <Eye className="w-2.5 h-2.5" /> 檢測
                  </span>
                </div>

                {/* Details & Traits */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between text-[9px] font-mono">
                    <span className={`px-1.5 py-0.5 rounded border font-bold ${getRarityBadgeColor(rarity)}`}>
                      {rarity}
                    </span>
                    <span className="text-gray-500">#{item.tokenId}</span>
                  </div>

                  <h4
                    onClick={() => setInspectItem(item)}
                    className="text-xs font-bold font-mono text-gray-100 truncate cursor-pointer hover:text-neon-cyan transition-colors"
                    title={fallbackTitle}
                  >
                    {fallbackTitle}
                  </h4>

                  {/* Trait Chips */}
                  <div className="space-y-1 pt-0.5">
                    <div className="flex items-center gap-1 text-[9px] font-mono text-cyan-300 truncate bg-space-950/80 px-1.5 py-0.5 rounded border border-space-800">
                      <Zap className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                      <span className="truncate">產能 {stats.miningBonus}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[9px] font-mono text-purple-300 truncate bg-space-950/80 px-1.5 py-0.5 rounded border border-space-800">
                      <Sparkles className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                      <span className="truncate font-bold">{stats.specialTrait}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-400 font-mono truncate pt-0.5">
                    賣家: {item.seller.slice(0, 6)}...{item.seller.slice(-4)}
                  </p>
                </div>

                {/* Inspect Trigger Button */}
                <button
                  onClick={() => setInspectItem(item)}
                  className="w-full py-1 rounded bg-space-850 hover:bg-space-800 border border-space-700 text-cyan-300 text-[10px] font-mono flex items-center justify-center gap-1 transition-colors active:scale-95"
                >
                  <Eye className="w-3 h-3" />
                  <span>檢測特異詞條</span>
                </button>

                {/* Price & Action */}
                <div className="pt-2 border-t border-space-800 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-0.5 text-xs font-mono font-bold text-cyan-300">
                    <Zap className="w-3 h-3 text-neon-cyan" />
                    <span>{item.price} 0G</span>
                  </div>

                  {isSeller ? (
                    <button
                      onClick={() => handleCancel(item.listingId)}
                      disabled={processingCancelId === item.listingId}
                      className="px-2.5 py-1 rounded bg-space-800 hover:bg-red-950/80 border border-space-700 hover:border-red-500 text-red-300 text-[10px] font-mono flex items-center gap-1 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {processingCancelId === item.listingId ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-red-300" />
                          <span>下架中...</span>
                        </>
                      ) : (
                        <span>下架</span>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuy(item)}
                      disabled={processingBuyId === item.listingId}
                      className="px-2.5 py-1 rounded bg-gradient-to-r from-neon-cyan to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black text-[10px] font-mono font-bold shadow-[0_0_8px_rgba(0,240,255,0.3)] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                    >
                      {processingBuyId === item.listingId ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-black" />
                          <span>購買中...</span>
                        </>
                      ) : (
                        <span>購買</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Holographic Inspection Modal */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm rounded-2xl bg-space-900 border-2 border-neon-cyan p-5 shadow-[0_0_40px_rgba(0,240,255,0.4)] max-h-[90vh] flex flex-col text-left">
            <button
              onClick={() => setInspectItem(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-space-800 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="pb-3 border-b border-space-800 flex items-center gap-2">
              <Eye className="w-4 h-4 text-neon-cyan" />
              <div>
                <h3 className="text-xs font-bold font-mono tracking-wider text-gray-200 uppercase">
                  0G 藏品特異共振檢測儀
                </h3>
                <p className="text-[10px] text-gray-400 font-mono">
                  Token #{inspectItem.tokenId} · 鏈上智能合約認證
                </p>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="my-3 space-y-3.5 overflow-y-auto pr-1 flex-1">
              {/* Item Visual Card */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-space-950/80 border border-space-800">
                <div className="w-16 h-16 rounded-lg bg-space-900 p-2 flex items-center justify-center border border-space-700 shrink-0">
                  <img
                    src={(inspectItem.details?.archetype?.baseImage || "/items/01_ramen.svg").replace(".png", ".svg")}
                    alt={inspectItem.details?.aiTitle}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="space-y-1">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${getRarityBadgeColor(
                      inspectItem.details?.archetype?.rarity || "Common"
                    )}`}
                  >
                    {inspectItem.details?.archetype?.rarity || "Common"} 級原型 · {inspectItem.details?.archetype?.name || "未知"}
                  </span>
                  <h4 className="text-sm font-bold font-mono text-cyan-200 leading-snug">
                    {inspectItem.details?.aiTitle || `0G 藏品 #${inspectItem.tokenId}`}
                  </h4>
                </div>
              </div>

              {/* Unique Lore & Backstory */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-gray-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>0G AI 解算背景傳奇：</span>
                </label>
                <div className="p-3 rounded-xl bg-space-850/90 border border-space-750 text-xs text-gray-300 leading-relaxed">
                  {inspectItem.details?.aiLore || "深空考古隊尚未解讀完整的星際歷史記錄。"}
                </div>
              </div>

              {/* Personality Tag if present */}
              {inspectItem.details?.aiPersonality && (
                <div className="px-3 py-1.5 rounded-lg bg-purple-950/40 border border-purple-800/50 text-[11px] font-mono text-purple-200 flex items-center gap-1.5">
                  <span className="text-purple-400 font-bold">個性特徵：</span>
                  <span>{inspectItem.details.aiPersonality}</span>
                </div>
              )}

              {/* 4 Functional Stat Tiles */}
              {(() => {
                const stats = parseStats(inspectItem.details);
                return (
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-gray-400 font-semibold flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>特異實時增幅效能 (Fleet Bonuses)：</span>
                    </label>

                    <div className="grid grid-cols-2 gap-2 text-left">
                      {/* Tile 1: Mining Bonus */}
                      <div className="p-2.5 rounded-xl bg-space-850 border border-space-750 space-y-0.5">
                        <span className="text-[10px] font-mono text-gray-400 block">⚡ 採礦產能加成</span>
                        <span className="text-xs font-mono font-bold text-amber-300 block">
                          {stats.miningBonus}
                        </span>
                        <span className="text-[9px] font-mono text-gray-500 block">
                          +{stats.miningBonusValue} 幣/秒產率
                        </span>
                      </div>

                      {/* Tile 2: Capacity Bonus */}
                      <div className="p-2.5 rounded-xl bg-space-850 border border-space-750 space-y-0.5">
                        <span className="text-[10px] font-mono text-gray-400 block">📦 離線池容量擴充</span>
                        <span className="text-xs font-mono font-bold text-cyan-300 block">
                          +{stats.capacityBonus} 金幣
                        </span>
                        <span className="text-[9px] font-mono text-gray-500 block">
                          擴充放置儲能上限
                        </span>
                      </div>

                      {/* Tile 3: Luck */}
                      <div className="p-2.5 rounded-xl bg-space-850 border border-space-750 space-y-0.5">
                        <span className="text-[10px] font-mono text-gray-400 block">🍀 幸運共振指數</span>
                        <span className="text-xs font-mono font-bold text-emerald-300 block">
                          {stats.luck} / 100
                        </span>
                        <span className="text-[9px] font-mono text-gray-500 block">
                          提升採收 2x 爆擊機率
                        </span>
                      </div>

                      {/* Tile 4: Special Trait */}
                      <div className="p-2.5 rounded-xl bg-space-850 border border-space-750 space-y-0.5">
                        <span className="text-[10px] font-mono text-gray-400 block">🏷️ 特異共振詞條</span>
                        <span className="text-xs font-mono font-bold text-pink-300 block truncate" title={stats.specialTrait}>
                          {stats.specialTrait}
                        </span>
                        <span className="text-[9px] font-mono text-gray-500 block truncate" title={stats.traitDescription}>
                          {stats.traitDescription}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* On-Chain Provenance (0G Storage & Seller) */}
              <div className="p-2.5 rounded-xl bg-space-950 border border-space-850 space-y-1.5 text-[10px] font-mono text-gray-400">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-cyan-400">
                    <Database className="w-3 h-3" /> 0G Storage Root
                  </span>
                  <span className="text-gray-300 truncate max-w-[160px]" title={inspectItem.details?.storageHash || "鏈上存證"}>
                    {inspectItem.details?.storageHash || "0G-Decentralized-Storage"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>掛售賣家：</span>
                  <span className="text-gray-300 font-mono">
                    {inspectItem.seller}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-space-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1 text-sm font-mono font-bold text-cyan-300">
                <Zap className="w-4 h-4 text-neon-cyan" />
                <span>{inspectItem.price} 0G</span>
              </div>

              {address && inspectItem.seller === address.toLowerCase() ? (
                <button
                  onClick={() => handleCancel(inspectItem.listingId)}
                  disabled={processingCancelId === inspectItem.listingId}
                  className="px-4 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/80 text-red-200 text-xs font-mono font-bold shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                >
                  {processingCancelId === inspectItem.listingId ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-red-200" />
                      <span>{actionStatus || "下架撤回中..."}</span>
                    </>
                  ) : (
                    <span>下架藏品</span>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => handleBuy(inspectItem)}
                  disabled={processingBuyId === inspectItem.listingId}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-neon-cyan to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black text-xs font-mono font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {processingBuyId === inspectItem.listingId ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>{actionStatus || "0G 區塊確認中..."}</span>
                    </>
                  ) : (
                    <span>以 {inspectItem.price} 0G 立即購買</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upgraded Listing Modal with Full Holographic Item Inspector */}
      {isListingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain">
          <div className="relative w-full max-w-sm sm:max-w-md rounded-2xl bg-space-900 border-2 border-neon-cyan p-4 sm:p-5 shadow-[0_0_40px_rgba(0,240,255,0.4)] max-h-[92vh] flex flex-col text-left">
            {/* Modal Header */}
            <div className="pb-3 border-b border-space-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-neon-cyan shrink-0" />
                <div>
                  <h3 className="text-xs sm:text-sm font-bold font-mono text-gray-100 uppercase tracking-wider">
                    上架藏品至 0G 拍賣行
                  </h3>
                  <p className="text-[9px] text-cyan-400/80 font-mono tracking-wider uppercase">
                    0G MARKETPLACE LISTING PROTOCOL
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsListingModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-space-800 hover:bg-space-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
                title="關閉"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {userItems.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <p className="text-xs text-gray-400 font-mono">
                  您目前錢包名下尚未解鎖任何可上架的 0G 藏品！
                </p>
                <p className="text-[11px] text-cyan-400 font-mono">
                  請先至深空探測進行量子抽取，解鎖您的第一件星際遺物！
                </p>
              </div>
            ) : (
              <div className="my-3 space-y-3.5 overflow-y-auto pr-1 flex-1">
                {/* 1. Visual Horizontal Item Selector Rail */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-gray-300 font-bold">1. 選擇要掛售的藏品：</span>
                    <span className="text-[10px] text-gray-500">持有 {userItems.length} 件</span>
                  </div>

                  {/* Horizontal Scrollable Thumbnails */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar">
                    {userItems.map((item) => {
                      const isSelected = selectedTokenId === item.tokenId;
                      const itemRarity = item.archetype?.rarity || "Common";
                      const itemImg = (item.archetype?.baseImage || "/items/01_ramen.svg").replace(".png", ".svg");

                      return (
                        <button
                          key={item.tokenId}
                          type="button"
                          onClick={() => setSelectedTokenId(item.tokenId)}
                          className={`w-20 shrink-0 p-2 rounded-xl flex flex-col items-center justify-between gap-1 transition-all text-left cursor-pointer ${
                            isSelected
                              ? "bg-space-850 border-2 border-neon-cyan shadow-[0_0_15px_rgba(0,240,255,0.45)] scale-102"
                              : "bg-space-950/80 border border-space-800 hover:border-space-600 opacity-75 hover:opacity-100"
                          }`}
                        >
                          <div className="w-12 h-12 rounded-lg bg-space-900 p-1 flex items-center justify-center border border-space-700/60">
                            <img src={itemImg} alt={item.aiTitle} className="max-w-full max-h-full object-contain" />
                          </div>

                          <div className="w-full text-center">
                            <span className={`text-[8px] font-mono px-1 py-0.2 rounded border font-bold block truncate ${getRarityBadgeColor(itemRarity)}`}>
                              {itemRarity}
                            </span>
                            <span className="text-[9px] font-mono text-gray-300 font-bold block truncate mt-0.5">
                              #{item.tokenId}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Selected Item Holographic Preview Card */}
                {(() => {
                  const selectedItem = userItems.find((i) => i.tokenId === selectedTokenId) || userItems[0];
                  if (!selectedItem) return null;

                  const stats = parseStats(selectedItem);
                  const rarity = selectedItem.archetype?.rarity || "Common";
                  const image = (selectedItem.archetype?.baseImage || "/items/01_ramen.svg").replace(".png", ".svg");

                  return (
                    <div className="space-y-3 p-3 rounded-xl bg-space-950/90 border border-space-750">
                      {/* Identity Row */}
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-space-900 p-2 flex items-center justify-center border border-space-700 shrink-0">
                          <img src={image} alt={selectedItem.aiTitle} className="max-w-full max-h-full object-contain" />
                        </div>
                        <div className="space-y-1 text-left min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-[9px] font-mono">
                            <span className={`px-1.5 py-0.5 rounded border font-bold ${getRarityBadgeColor(rarity)}`}>
                              {rarity} 級原型 · {selectedItem.archetype?.name || "未知"}
                            </span>
                            <span className="text-gray-500">Token #{selectedItem.tokenId}</span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold font-mono text-cyan-200 truncate" title={selectedItem.aiTitle}>
                            {selectedItem.aiTitle}
                          </h4>
                        </div>
                      </div>

                      {/* AI Lore Narrative Box */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-gray-400 font-semibold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          <span>0G AI 解算背景：</span>
                        </label>
                        <div className="p-2.5 rounded-lg bg-space-900/80 border border-space-800 text-[11px] text-gray-300 leading-relaxed line-clamp-2">
                          {selectedItem.aiLore || "深空考古隊尚未解讀完整的星際歷史記錄。"}
                        </div>
                      </div>

                      {/* 4 Functional Stat Tiles */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-gray-400 font-semibold flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>特異實時增幅效能 (Fleet Bonuses)：</span>
                        </label>

                        <div className="grid grid-cols-2 gap-2 text-left">
                          {/* Tile 1: Mining Bonus */}
                          <div className="p-2 rounded-lg bg-space-900 border border-space-800 space-y-0.5">
                            <span className="text-[9px] font-mono text-gray-400 block">⚡ 採礦產能加成</span>
                            <span className="text-xs font-mono font-bold text-amber-300 block">
                              {stats.miningBonus}
                            </span>
                            <span className="text-[8px] font-mono text-gray-500 block">
                              +{stats.miningBonusValue} 幣/秒產率
                            </span>
                          </div>

                          {/* Tile 2: Capacity Bonus */}
                          <div className="p-2 rounded-lg bg-space-900 border border-space-800 space-y-0.5">
                            <span className="text-[9px] font-mono text-gray-400 block">📦 離線池容量擴充</span>
                            <span className="text-xs font-mono font-bold text-cyan-300 block">
                              +{stats.capacityBonus} 金幣
                            </span>
                            <span className="text-[8px] font-mono text-gray-500 block">
                              擴充放置儲能上限
                            </span>
                          </div>

                          {/* Tile 3: Luck */}
                          <div className="p-2 rounded-lg bg-space-900 border border-space-800 space-y-0.5">
                            <span className="text-[9px] font-mono text-gray-400 block">🍀 幸運共振指數</span>
                            <span className="text-xs font-mono font-bold text-emerald-300 block">
                              {stats.luck} / 100
                            </span>
                            <span className="text-[8px] font-mono text-gray-500 block">
                              提升採收 2x 爆擊機率
                            </span>
                          </div>

                          {/* Tile 4: Special Trait */}
                          <div className="p-2 rounded-lg bg-space-900 border border-space-800 space-y-0.5">
                            <span className="text-[9px] font-mono text-gray-400 block">🏷️ 特異共振詞條</span>
                            <span className="text-xs font-mono font-bold text-pink-300 block truncate" title={stats.specialTrait}>
                              {stats.specialTrait}
                            </span>
                            <span className="text-[8px] font-mono text-gray-500 block truncate" title={stats.traitDescription}>
                              {stats.traitDescription}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 0G Storage Hash */}
                      <div className="p-2 rounded-lg bg-space-900 border border-space-800 flex items-center justify-between text-[9px] font-mono text-gray-400">
                        <span className="flex items-center gap-1 text-cyan-400">
                          <Database className="w-3 h-3" /> 0G Storage Root
                        </span>
                        <span className="text-gray-300 truncate max-w-[170px]" title={selectedItem.storageHash || "鏈上存證"}>
                          {selectedItem.storageHash || "0G-Decentralized-Storage"}
                        </span>
                      </div>

                      {/* Fleet Custody Alert Banner */}
                      <div className="px-2.5 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-[10px] font-mono text-amber-300 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>⚠️ 掛售期間由合約託管，下架即恢復艦隊加成</span>
                      </div>
                    </div>
                  );
                })()}

                {/* 3. Pricing Section */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <label className="text-gray-300 font-bold">2. 設定出售價格 (0G 原生代幣)：</label>
                    <span className="text-[10px] text-cyan-400">Galileo 測試鏈結算</span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      step="0.001"
                      min="0.0001"
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      className="w-full py-2.5 pl-3 pr-12 rounded-xl bg-space-950 border border-space-700 text-sm font-mono text-cyan-300 focus:outline-none focus:border-neon-cyan shadow-inner"
                      placeholder="0.005"
                    />
                    <span className="absolute right-3.5 top-3 text-xs font-mono font-bold text-gray-400">0G</span>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                    {[
                      { val: "0.001", label: "0.001" },
                      { val: "0.005", label: "0.005" },
                      { val: "0.01", label: "0.01" },
                      { val: "0.05", label: "0.05" },
                    ].map((p) => (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => setPriceInput(p.val)}
                        className={`py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                          priceInput === p.val
                            ? "bg-cyan-500/20 text-neon-cyan border border-neon-cyan font-bold shadow-[0_0_8px_rgba(0,240,255,0.3)]"
                            : "bg-space-950 text-gray-400 border border-space-800 hover:text-gray-200"
                        }`}
                      >
                        {p.label} 0G
                      </button>
                    ))}
                  </div>

                  {/* Settlement Breakdown */}
                  <div className="px-3 py-2 rounded-xl bg-space-950 border border-space-800 text-[10px] font-mono text-gray-400 space-y-1">
                    <div className="flex items-center justify-between text-cyan-300">
                      <span>◆ 平台交易手續費：</span>
                      <span className="font-bold text-emerald-400">0% (智能合約免手續費)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>◆ 預計淨收款項：</span>
                      <span className="text-gray-200 font-bold">{priceInput || "0"} 0G 原生幣</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Bottom Actions */}
            {userItems.length > 0 && (
              <div className="pt-3 border-t border-space-800 shrink-0">
                {!isCorrectNetwork ? (
                  <button
                    onClick={switchNetwork}
                    disabled={isSwitchingNetwork}
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs shadow-[0_0_16px_rgba(245,158,11,0.4)] active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {isSwitchingNetwork ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                        <span>正在請求切換至 0G Galileo 測試網...</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4" />
                        <span>切換至 0G Galileo 測試網 (以 0G 幣交易)</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleList}
                    disabled={isListing || !selectedTokenId || !priceInput || parseFloat(priceInput) <= 0}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-neon-cyan to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-mono font-bold text-xs shadow-[0_0_16px_rgba(0,240,255,0.4)] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {isListing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                        <span>{actionStatus || "0G 智能合約簽署中..."}</span>
                      </>
                    ) : (
                      <span>確認發布賣單 (簽署 0G 智能合約)</span>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
