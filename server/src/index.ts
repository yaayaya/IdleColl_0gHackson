import Fastify from "fastify";
import cors from "@fastify/cors";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { playerRoutes } from "./routes/player.js";
import { gachaRoutes } from "./routes/gacha.js";
import { codexRoutes } from "./routes/codex.js";
import { marketplaceRoutes } from "./routes/marketplace.js";
import { initDb } from "./db/init.js";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

// Hot-reload enabled with tsx watch
const app = Fastify({ logger: true });

async function main() {
  await app.register(cors, { origin: true });

  // Load contract addresses if available
  let contractsConfig: any = {};
  try {
    const configPath = path.resolve(__dirname, "./contracts/contracts.json");
    if (fs.existsSync(configPath)) {
      contractsConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    }
  } catch {}

  // Health & Info endpoints
  app.get("/health", async () => ({ status: "ok", timestamp: Date.now() }));
  app.get("/api/info", async () => {
    let minterBalance = "0.00";
    const minterAddress = process.env.MINTER_ADDRESS || "0x9A56E645BD53A56F8e3fa93EB6D3cDbf431Ba062";
    try {
      const p = new ethers.JsonRpcProvider(process.env.ZEROG_RPC_URL || "https://evmrpc-testnet.0g.ai");
      const b = await p.getBalance(minterAddress);
      minterBalance = ethers.formatEther(b);
    } catch {}

    return {
      network: "0G Galileo Testnet",
      chainId: Number(process.env.ZEROG_CHAIN_ID || 16602),
      rpcUrl: process.env.ZEROG_RPC_URL || "https://evmrpc-testnet.0g.ai",
      explorerUrl: process.env.ZEROG_EXPLORER_URL || "https://chainscan-galileo.0g.ai",
      minterAddress,
      minterBalance,
      nftAddress: process.env.NFT_CONTRACT_ADDRESS || contractsConfig?.nftAddress,
      marketplaceAddress: process.env.MARKETPLACE_CONTRACT_ADDRESS || contractsConfig?.marketplaceAddress,
    };
  });

  // Register game routes
  await app.register(playerRoutes);
  await app.register(gachaRoutes);
  await app.register(codexRoutes);
  await app.register(marketplaceRoutes);

  // Initialize PostgreSQL schema and seed data
  await initDb();

  const port = Number(process.env.PORT || 3001);
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`>>> IdleColl Server running at http://0.0.0.0:${port}`);
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
