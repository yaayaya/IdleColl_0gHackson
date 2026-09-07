import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("=========================================");
  console.log("Deploying IdleColl contracts with account:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "0G");
  console.log("=========================================");

  // 1. Deploy IdleCollNFT
  console.log("Deploying IdleCollNFT...");
  const IdleCollNFT = await ethers.getContractFactory("IdleCollNFT");
  const nft = await IdleCollNFT.deploy(deployer.address);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log(">>> IdleCollNFT deployed to:", nftAddress);

  // 2. Deploy IdleCollMarketplace
  console.log("Deploying IdleCollMarketplace...");
  const IdleCollMarketplace = await ethers.getContractFactory("IdleCollMarketplace");
  const marketplace = await IdleCollMarketplace.deploy(deployer.address);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log(">>> IdleCollMarketplace deployed to:", marketplaceAddress);

  // 3. Export ABIs and addresses to web and server
  const contractData = {
    network: "zeroG",
    chainId: 16602,
    nftAddress,
    marketplaceAddress,
    deployerAddress: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  const nftArtifact = await import("../artifacts/contracts/IdleCollNFT.sol/IdleCollNFT.json");
  const marketplaceArtifact = await import("../artifacts/contracts/IdleCollMarketplace.sol/IdleCollMarketplace.json");

  const exportPayload = {
    ...contractData,
    nftAbi: nftArtifact.abi,
    marketplaceAbi: marketplaceArtifact.abi,
  };

  // Directories to write contract exports
  const targets = [
    path.resolve(__dirname, "../../server/src/contracts"),
    path.resolve(__dirname, "../../web/src/contracts"),
  ];

  for (const targetDir of targets) {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(targetDir, "contracts.json"),
      JSON.stringify(exportPayload, null, 2)
    );
    console.log("Contract metadata exported to:", targetDir);
  }

  // Also update root .env if it exists
  const envPath = path.resolve(__dirname, "../../.env");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf-8");
    envContent = envContent.replace(/NFT_CONTRACT_ADDRESS=.*/g, `NFT_CONTRACT_ADDRESS=${nftAddress}`);
    envContent = envContent.replace(/MARKETPLACE_CONTRACT_ADDRESS=.*/g, `MARKETPLACE_CONTRACT_ADDRESS=${marketplaceAddress}`);
    fs.writeFileSync(envPath, envContent);
    console.log("Updated root .env with deployed contract addresses.");
  }

  console.log("=========================================");
  console.log("Deployment and synchronization complete!");
  console.log("=========================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
