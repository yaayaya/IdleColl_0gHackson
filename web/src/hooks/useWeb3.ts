import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import contractsData from "../contracts/contracts.json";

const ZEROG_CHAIN_ID = 16602;
const ZEROG_CHAIN_ID_HEX = "0x40da";

export function useWeb3() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance0G, setBalance0G] = useState<string>("0.00");
  const [isCorrectNetwork, setIsCorrectNetwork] = useState<boolean>(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const checkNetwork = useCallback(async (prov: ethers.BrowserProvider) => {
    try {
      const network = await prov.getNetwork();
      const is0G = Number(network.chainId) === ZEROG_CHAIN_ID;
      setIsCorrectNetwork(is0G);
      return is0G;
    } catch {
      setIsCorrectNetwork(false);
      return false;
    }
  }, []);

  const updateBalance = useCallback(async (addr: string, prov: ethers.BrowserProvider) => {
    try {
      const bal = await prov.getBalance(addr);
      setBalance0G(parseFloat(ethers.formatEther(bal)).toFixed(4));
    } catch {
      setBalance0G("0.00");
    }
  }, []);

  const switchNetwork = useCallback(async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ZEROG_CHAIN_ID_HEX }],
      });
      setIsCorrectNetwork(true);
      if (address && provider) {
        updateBalance(address, provider);
      }
    } catch (switchError: any) {
      const isNotAdded =
        switchError.code === 4902 ||
        switchError?.data?.originalError?.code === 4902 ||
        (switchError.message && switchError.message.toLowerCase().includes("unrecognized"));

      if (isNotAdded) {
        try {
          await (window as any).ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: ZEROG_CHAIN_ID_HEX,
                chainName: "0G Galileo Testnet",
                nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
                rpcUrls: ["https://evmrpc-testnet.0g.ai"],
                blockExplorerUrls: ["https://chainscan-galileo.0g.ai"],
              },
            ],
          });
          setIsCorrectNetwork(true);
          if (address && provider) {
            updateBalance(address, provider);
          }
        } catch (addError) {
          console.error("Failed to add 0G network:", addError);
        }
      } else {
        console.error("Failed to switch to 0G network:", switchError);
      }
    }
  }, [address, provider, updateBalance]);

  const connectWallet = useCallback(async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      alert("請先安裝 MetaMask 錢包擴充套件，或使用手機端 MetaMask 瀏覽器！");
      return;
    }

    try {
      setIsConnecting(true);
      const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      if (accounts.length > 0) {
        const userAddr = accounts[0].toLowerCase();
        setAddress(userAddr);
        setProvider(browserProvider);
        const s = await browserProvider.getSigner();
        setSigner(s);

        const ok = await checkNetwork(browserProvider);
        if (ok) {
          await updateBalance(userAddr, browserProvider);
        } else {
          await switchNetwork();
        }
      }
    } catch (err: any) {
      console.error("Failed to connect wallet:", err);
    } finally {
      setIsConnecting(false);
    }
  }, [checkNetwork, updateBalance, switchNetwork]);

  // Event listeners for account and network changes
  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        const newAddr = accounts[0].toLowerCase();
        setAddress(newAddr);
        if (provider) {
          provider.getSigner().then(setSigner);
          updateBalance(newAddr, provider);
        }
      } else {
        setAddress(null);
        setSigner(null);
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    (window as any).ethereum.on("accountsChanged", handleAccountsChanged);
    (window as any).ethereum.on("chainChanged", handleChainChanged);

    // Auto-connect if already authorized
    const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
    browserProvider.listAccounts().then((accs) => {
      if (accs.length > 0) {
        const first = accs[0].address.toLowerCase();
        setAddress(first);
        setProvider(browserProvider);
        browserProvider.getSigner().then(setSigner);
        checkNetwork(browserProvider).then((ok) => {
          if (ok) updateBalance(first, browserProvider);
        });
      }
    }).catch(() => {});

    return () => {
      if ((window as any).ethereum.removeListener) {
        (window as any).ethereum.removeListener("accountsChanged", handleAccountsChanged);
        (window as any).ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [checkNetwork, updateBalance]);

  // Read-only provider connected directly to 0G Galileo Testnet
  const getReadOnlyContracts = useCallback(() => {
    if (!contractsData) return null;
    try {
      const readOnlyProvider = new ethers.JsonRpcProvider("https://evmrpc-testnet.0g.ai");
      const nft = new ethers.Contract(contractsData.nftAddress, contractsData.nftAbi, readOnlyProvider);
      const marketplace = new ethers.Contract(contractsData.marketplaceAddress, contractsData.marketplaceAbi, readOnlyProvider);
      return { nft, marketplace, contractsData };
    } catch {
      return null;
    }
  }, []);

  // Contracts helpers with write signer - strictly enforces isCorrectNetwork
  const getContracts = useCallback(() => {
    if (!signer || !contractsData || !isCorrectNetwork) return null;
    const nft = new ethers.Contract(contractsData.nftAddress, contractsData.nftAbi, signer);
    const marketplace = new ethers.Contract(contractsData.marketplaceAddress, contractsData.marketplaceAbi, signer);
    return { nft, marketplace, contractsData };
  }, [signer, isCorrectNetwork]);

  const loginAsGuest = useCallback(() => {
    let guest = localStorage.getItem("idlecoll_guest_addr");
    if (!guest) {
      guest = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      localStorage.setItem("idlecoll_guest_addr", guest);
    }
    setAddress(guest.toLowerCase());
    setIsCorrectNetwork(true);
    setBalance0G("10.00 (Demo)");
  }, []);

  const disconnectWallet = useCallback(() => {
    setAddress(null);
    setSigner(null);
    localStorage.removeItem("idlecoll_guest_addr");
  }, []);

  return {
    address,
    balance0G,
    isCorrectNetwork,
    provider,
    signer,
    isConnecting,
    isGuest: !signer && !!address,
    connectWallet,
    loginAsGuest,
    disconnectWallet,
    switchNetwork,
    getContracts,
    getReadOnlyContracts,
    refreshBalance: () => {
      if (address && provider) updateBalance(address, provider);
    },
  };
}
