import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import * as path from "path";

// Load from root .env or contracts/.env
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

const MINTER_KEY = process.env.MINTER_PRIVATE_KEY || "0x3139758da2fd1d141b1b8781e15e20101c754a219f30ba5147794deed01ef4be";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun",
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
    },
    zeroG: {
      url: process.env.ZEROG_RPC_URL || "https://evmrpc-testnet.0g.ai",
      chainId: 16602,
      accounts: [MINTER_KEY],
    },
  },
};

export default config;
