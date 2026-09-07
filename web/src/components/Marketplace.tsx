import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { ShoppingBag, PlusCircle, Tag, Check, ExternalLink, Zap, X, ShieldAlert } from "lucide-react";
import { useDialog } from "../context/DialogContext.tsx";

interface MarketplaceProps {
  address: string | null;
  balance0G?: string;
  isCorrectNetwork: boolean;
  switchNetwork: () => void;
  getContracts: () => any;
  getReadOnlyContracts: () => any;
  onTradeComplete: () => void;
}

export const Marketplace: React.FC<MarketplaceProps> = ({
  address,
  balance0G = "0.00",
  isCorrectNetwork,
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
    if (!isCorrectNetwork) {
      showWarning("請先切換至 0G Galileo 測試網路！所有合約交易均使用 0G 原生代幣。", "網路未匹配");
      await switchNetwork();
      return;
    }

    const contracts = getContracts();
    if (!contracts) {
      showWarning("請先連線至 0G Galileo 錢包！", "尚未連線");
      return;
    }

    try {
      setActionStatus("1/2: 請在 MetaMask 彈窗中授權藏品 (Approve)...");
      const priceWei = ethers.parseEther(priceInput || "0.001");

      // 1. Approve
      const approveTx = await contracts.nft.approve(contracts.contractsData.marketplaceAddress, selectedTokenId, {
        gasLimit: 120000,
      });
      setActionStatus("1/2: 正在等待 0G Galileo 區塊確認授權...");
      await approveTx.wait();

      // 2. List
      setActionStatus("2/2: 請在 MetaMask 彈窗中確認發布賣單 (List)...");
      const listTx = await contracts.marketplace.listItem(
        contracts.contractsData.nftAddress,
        selectedTokenId,
        priceWei,
        { gasLimit: 250000 }
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
      } else {
        showError(err.reason || err.message || "上架失敗，請確認 0G 錢包授權！", "上架交易中斷");
      }
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

    // Guard: Network must be 0G Galileo
    if (!isCorrectNetwork) {
      showWarning("請先將錢包切換至 0G Galileo 測試網路！拍賣行結算皆使用 0G 原生代幣。", "網路未匹配");
      await switchNetwork();
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

    const contracts = getContracts();
    if (!contracts) {
      showWarning("請確認已連接 0G Galileo 錢包！", "連線異常");
      return;
    }

    try {
      setActionStatus(`請在 MetaMask 彈窗中確認支付 ${listing.price} 0G...`);
      const priceWei = ethers.parseEther(listing.price);

      // Explicit gasLimit avoids RPC estimateGas hanging on 0G testnet
      const buyTx = await contracts.marketplace.buyItem(listing.listingId, {
        value: priceWei,
        gasLimit: 300000,
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
    }
  };

  // Handle cancel listing with sci-fi confirmation dialog
  const handleCancel = async (listingId: number) => {
    if (!isCorrectNetwork) {
      showWarning("請先切換至 0G Galileo 測試網路！", "網路未匹配");
      await switchNetwork();
      return;
    }
    const contracts = getContracts();
    if (!contracts) return;

    showConfirm({
      title: "下架賣單確認",
      message: "確定要將這件藏品從 0G 拍賣行撤回嗎？\n\n◆ 智能合約不收平台手續費（免費）\n◆ 僅需極微量 0G Gas 燃料費",
      confirmText: "確認下架",
      cancelText: "保留賣單",
      onConfirm: async () => {
        try {
          setActionStatus("請在 MetaMask 彈窗中確認下架操作...");
          const tx = await contracts.marketplace.cancelListing(listingId, {
            gasLimit: 150000,
          });
          setActionStatus("正在等待 0G 鏈上下架確認...");
          await tx.wait();
          setActionStatus(null);
          await fetchListings();
          showSuccess("藏品已成功從 0G 拍賣行撤回！", "下架完成");
        } catch (err: any) {
          console.error("Cancel error:", err);
          setActionStatus(null);
          const errMsg = err?.reason || err?.message || "";
          if (errMsg.includes("rejected") || errMsg.includes("User denied") || err?.code === 4001 || err?.code === "ACTION_REJECTED") {
            showWarning("您已取消下架操作。", "操作已取消");
          } else {
            showError(err.reason || err.message || "下架失敗，請確認 0G 錢包簽署！", "下架失敗");
          }
        }
      },
    });
  };

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
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold font-mono text-xs whitespace-nowrap shadow-md active:scale-95 transition-all"
          >
            切換至 0G Galileo
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
            if (!isCorrectNetwork) {
              switchNetwork();
              return;
            }
            fetchUserItems();
            setIsListingModalOpen(true);
          }}
          disabled={!address}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-neon-cyan to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-mono font-bold text-xs shadow-[0_0_12px_rgba(0,240,255,0.3)] active:scale-95 disabled:opacity-50"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>上架藏品</span>
        </button>
      </div>

      {/* 0G Settlement & Network Update Notice */}
      <div className="px-3 py-2 rounded-xl bg-space-900/60 border border-space-800 text-[11px] font-mono text-gray-400 flex items-center justify-between gap-2">
        <span className="text-cyan-400 truncate">◆ 拍賣行結算：0G 原生幣 (Galileo 測試鏈)</span>
        <button
          onClick={switchNetwork}
          className="text-[10px] text-cyan-300 hover:text-cyan-200 underline whitespace-nowrap active:scale-95 transition-all"
          title="若 MetaMask 貨幣符號非 0G，點此可更新網路配置"
        >
          切換/更新 0G 網路
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

      {/* Listings Grid */}
      {loading ? (
        <div className="py-12 text-center text-gray-400 font-mono text-xs">
          讀取 0G 拍賣行資料中...
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-2xl bg-space-900 border border-space-800 p-8 text-center space-y-2">
          <p className="text-gray-400 font-mono text-xs">目前拍賣行尚無掛售中的藏品</p>
          <p className="text-[11px] text-gray-500 font-mono">點擊右上角「上架藏品」成為第一個在 0G 擺攤的星際商人！</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {listings.map((item) => {
            const isSeller = address && item.seller === address.toLowerCase();
            const fallbackTitle = item.details?.aiTitle || `0G Collectible #${item.tokenId}`;
            const image = (item.details?.archetype?.baseImage || "/items/01_ramen.svg").replace(".png", ".svg");
            const rarity = item.details?.archetype?.rarity || "Common";

            return (
              <div
                key={item.listingId}
                className="rounded-xl bg-space-900 border border-space-700/80 p-3 flex flex-col justify-between space-y-2 shadow-lg hover:border-neon-cyan/50 transition-all"
              >
                {/* Artwork */}
                <div className="w-full aspect-square rounded-lg bg-space-950 p-2 flex items-center justify-center border border-space-800">
                  <img src={image} alt={fallbackTitle} className="max-w-full max-h-full object-contain" />
                </div>

                {/* Details */}
                <div className="space-y-1 text-left">
                  <div className="flex items-center justify-between text-[9px] font-mono">
                    <span className="text-purple-300 font-bold">{rarity}</span>
                    <span className="text-gray-500">#{item.tokenId}</span>
                  </div>
                  <h4 className="text-xs font-bold font-mono text-gray-100 truncate" title={fallbackTitle}>
                    {fallbackTitle}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-mono truncate">
                    賣家: {item.seller.slice(0, 6)}...{item.seller.slice(-4)}
                  </p>
                </div>

                {/* Price & Action */}
                <div className="pt-2 border-t border-space-800 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-0.5 text-xs font-mono font-bold text-cyan-300">
                    <Zap className="w-3 h-3 text-neon-cyan" />
                    <span>{item.price} 0G</span>
                  </div>

                  {isSeller ? (
                    <button
                      onClick={() => handleCancel(item.listingId)}
                      className="px-2 py-1 rounded bg-space-800 hover:bg-red-950/80 border border-space-700 hover:border-red-500 text-red-300 text-[10px] font-mono"
                    >
                      下架
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuy(item)}
                      className="px-2.5 py-1 rounded bg-gradient-to-r from-neon-cyan to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black text-[10px] font-mono font-bold shadow-[0_0_8px_rgba(0,240,255,0.3)] active:scale-95"
                    >
                      購買
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Listing Modal */}
      {isListingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm rounded-2xl bg-space-900 border-2 border-neon-cyan p-5 shadow-[0_0_35px_rgba(0,240,255,0.4)] space-y-4">
            <button
              onClick={() => setIsListingModalOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-space-800 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold font-mono text-gray-100 flex items-center gap-2">
              <Tag className="w-4 h-4 text-neon-cyan" />
              <span>上架藏品至 0G 拍賣行</span>
            </h3>

            {userItems.length === 0 ? (
              <p className="text-xs text-gray-400 font-mono py-4 text-center">
                你目前沒有可上架的藏品，請先至深空探測進行抽卡！
              </p>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-mono text-gray-400 mb-1">選擇要出售的藏品：</label>
                  <select
                    value={selectedTokenId || ""}
                    onChange={(e) => setSelectedTokenId(Number(e.target.value))}
                    className="w-full py-2 px-3 rounded-lg bg-space-850 border border-space-700 text-xs font-mono text-gray-200 focus:outline-none focus:border-neon-cyan"
                  >
                    {userItems.map((item) => (
                      <option key={item.tokenId} value={item.tokenId}>
                        Token #{item.tokenId} - {item.aiTitle}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-gray-400 mb-1">
                    定價 (0G 測試幣)：
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.001"
                      min="0.0001"
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      className="w-full py-2 pl-3 pr-10 rounded-lg bg-space-850 border border-space-700 text-xs font-mono text-cyan-300 focus:outline-none focus:border-neon-cyan"
                    />
                    <span className="absolute right-3 top-2 text-xs font-mono text-gray-500">0G</span>
                  </div>
                  <p className="text-[9px] text-gray-500 font-mono mt-1">買家支付的 0G 原生幣將直接由智能合約即時撥付至你的錢包。</p>
                </div>

                {!isCorrectNetwork ? (
                  <button
                    onClick={switchNetwork}
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs shadow-[0_0_16px_rgba(245,158,11,0.4)] active:scale-95 flex items-center justify-center gap-2"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>切換至 0G Galileo 測試網 (以 0G 幣交易)</span>
                  </button>
                ) : (
                  <button
                    onClick={handleList}
                    disabled={!selectedTokenId || !priceInput}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-neon-cyan to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-mono font-bold text-xs shadow-[0_0_16px_rgba(0,240,255,0.4)] active:scale-95 disabled:opacity-50"
                  >
                    確認上架 (簽署 0G 智能合約)
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
