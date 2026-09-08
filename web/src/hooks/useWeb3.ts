import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { MetaMaskSDK } from "@metamask/sdk";
import contractsData from "../contracts/contracts.json";

const ZEROG_CHAIN_ID = 16602;
const ZEROG_CHAIN_ID_HEX = "0x40da";

const ZEROG_CONFIG = {
  chainId: ZEROG_CHAIN_ID_HEX,
  chainName: "0G Galileo Testnet",
  nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
  rpcUrls: ["https://evmrpc-testnet.0g.ai"],
  blockExplorerUrls: ["https://chainscan-galileo.0g.ai"],
};

let mmsdkInstance: MetaMaskSDK | null = null;

function getMMSDK(): MetaMaskSDK | null {
  if (typeof window === "undefined") return null;
  if (!mmsdkInstance) {
    try {
      mmsdkInstance = new MetaMaskSDK({
        dappMetadata: {
          name: "IdleColl 0G Space",
          url: window.location.origin,
        },
        checkInstallationImmediately: false,
      });
    } catch (e) {
      console.warn("MetaMaskSDK init warning:", e);
    }
  }
  return mmsdkInstance;
}

export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export function getEthereumProvider(): any {
  if (typeof window === "undefined") return null;
  // 1. If window.ethereum is already present (e.g. desktop extension or in-app browser), use it
  if ((window as any).ethereum) {
    return (window as any).ethereum;
  }
  // 2. On PC: strictly extension / plugin only! Do not load MetaMask SDK or show QR codes.
  if (!isMobileDevice()) {
    return null;
  }
  // 3. Otherwise on mobile: get provider from MetaMask SDK
  const sdk = getMMSDK();
  return sdk?.getProvider() || null;
}

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
    const eth = getEthereumProvider();
    if (!eth) return;

    try {
      // 1. Try wallet_addEthereumChain first to ensure native currency symbol is '0G'
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [ZEROG_CONFIG],
      });
      setIsCorrectNetwork(true);
      if (address && provider) {
        updateBalance(address, provider);
      }
    } catch (addError: any) {
      // 2. Fallback to switchEthereumChain if already exists or wallet rejects add
      try {
        await eth.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: ZEROG_CHAIN_ID_HEX }],
        });
        setIsCorrectNetwork(true);
        if (address && provider) {
          updateBalance(address, provider);
        }
      } catch (switchError: any) {
        console.error("Failed to switch to 0G network:", switchError);
      }
    }
  }, [address, provider, updateBalance]);

  const connectWallet = useCallback(async () => {
    const eth = getEthereumProvider();
    if (!eth) {
      const isMobile = typeof navigator !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        const host = window.location.host;
        window.location.href = `https://metamask.app.link/dapp/${host}`;
        return;
      }
      return;
    }

    try {
      localStorage.removeItem("idlecoll_disconnected");
      setIsConnecting(true);
      const browserProvider = new ethers.BrowserProvider(eth);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      if (accounts && accounts.length > 0) {
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

  // Event listeners for account and network changes with mobile async injection support
  useEffect(() => {
    if (typeof window === "undefined") return;

    let isMounted = true;

    const setupEthereum = async () => {
      let eth = getEthereumProvider();

      // In mobile MetaMask browser, ethereum is often injected asynchronously
      if (!eth) {
        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, 1500);
          window.addEventListener(
            "ethereum#initialized",
            () => {
              clearTimeout(timer);
              eth = getEthereumProvider();
              resolve();
            },
            { once: true }
          );
        });
        eth = getEthereumProvider();
      }

      if (!eth || !isMounted) return;

      const handleAccountsChanged = (accounts: string[]) => {
        if (!isMounted) return;
        if (accounts.length > 0) {
          localStorage.removeItem("idlecoll_disconnected");
          const newAddr = accounts[0].toLowerCase();
          setAddress(newAddr);
          const bp = new ethers.BrowserProvider(eth);
          setProvider(bp);
          bp.getSigner().then(setSigner);
          updateBalance(newAddr, bp);
        } else {
          setAddress(null);
          setSigner(null);
          setBalance0G("0.00");
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      eth.on("accountsChanged", handleAccountsChanged);
      eth.on("chainChanged", handleChainChanged);

      try {
        const isManuallyDisconnected = localStorage.getItem("idlecoll_disconnected") === "true";
        if (isManuallyDisconnected) {
          return;
        }

        const browserProvider = new ethers.BrowserProvider(eth);
        const accs = await browserProvider.listAccounts();
        if (accs.length > 0 && isMounted) {
          const first = accs[0].address.toLowerCase();
          setAddress(first);
          setProvider(browserProvider);
          const s = await browserProvider.getSigner();
          if (isMounted) setSigner(s);
          const ok = await checkNetwork(browserProvider);
          if (ok && isMounted) updateBalance(first, browserProvider);
        } else if (isMounted && isMobileDevice() && eth.isMetaMask) {
          // Only auto-connect inside mobile MetaMask in-app browser
          connectWallet();
        }
      } catch (err) {
        console.warn("Wallet init check:", err);
      }
    };

    setupEthereum();

    return () => {
      isMounted = false;
      const eth = getEthereumProvider();
      if (eth && eth.removeListener) {
        eth.removeListener("accountsChanged", () => {});
        eth.removeListener("chainChanged", () => {});
      }
    };
  }, [checkNetwork, updateBalance, connectWallet]);

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

  const disconnectWallet = useCallback(() => {
    localStorage.setItem("idlecoll_disconnected", "true");
    localStorage.removeItem("idlecoll_guest_addr");
    if (mmsdkInstance) {
      try {
        mmsdkInstance.terminate();
      } catch {}
      mmsdkInstance = null;
    }
    setAddress(null);
    setSigner(null);
    setProvider(null);
    setIsCorrectNetwork(false);
    setBalance0G("0.00");
  }, []);

  return {
    address,
    balance0G,
    isCorrectNetwork,
    provider,
    signer,
    isConnecting,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    getContracts,
    getReadOnlyContracts,
    refreshBalance: () => {
      if (address && provider) updateBalance(address, provider);
    },
  };
}
