import { expect } from "chai";
import { ethers } from "hardhat";

describe("IdleColl Smart Contracts", function () {
  it("should deploy NFT and Marketplace, mint, list, and buy with native tokens", async function () {
    const [owner, seller, buyer] = await ethers.getSigners();

    // 1. Deploy NFT
    const IdleCollNFT = await ethers.getContractFactory("IdleCollNFT");
    const nft = await IdleCollNFT.deploy(owner.address);
    await nft.waitForDeployment();

    // 2. Deploy Marketplace
    const IdleCollMarketplace = await ethers.getContractFactory("IdleCollMarketplace");
    const marketplace = await IdleCollMarketplace.deploy(owner.address);
    await marketplace.waitForDeployment();

    // 3. Owner/Server mints NFT to seller
    const archetypeId = 2; // Moon Rabbit
    const storageUri = "0g://QmTestStorageHash123456";
    const tx = await nft.mintItem(seller.address, archetypeId, storageUri);
    await tx.wait();

    expect(await nft.ownerOf(1)).to.equal(seller.address);
    expect(await nft.tokenURI(1)).to.equal(storageUri);
    expect(await nft.tokenArchetype(1)).to.equal(archetypeId);

    // 4. Seller approves Marketplace
    await nft.connect(seller).approve(await marketplace.getAddress(), 1);

    // 5. Seller lists item for 0.005 ETH/0G
    const price = ethers.parseEther("0.005");
    const listTx = await marketplace.connect(seller).listItem(await nft.getAddress(), 1, price);
    await listTx.wait();

    const activeListings = await marketplace.getActiveListings();
    expect(activeListings.length).to.equal(1);
    expect(activeListings[0].tokenId).to.equal(1);
    expect(activeListings[0].seller).to.equal(seller.address);
    expect(activeListings[0].price).to.equal(price);

    // 6. Buyer purchases item
    const initialSellerBalance = await ethers.provider.getBalance(seller.address);
    const buyTx = await marketplace.connect(buyer).buyItem(1, { value: price });
    await buyTx.wait();

    // Verify ownership transferred to buyer
    expect(await nft.ownerOf(1)).to.equal(buyer.address);

    // Verify seller received 0G
    const finalSellerBalance = await ethers.provider.getBalance(seller.address);
    expect(finalSellerBalance - initialSellerBalance).to.equal(price);

    // Verify listing is no longer active
    const remainingListings = await marketplace.getActiveListings();
    expect(remainingListings.length).to.equal(0);
  });
});
