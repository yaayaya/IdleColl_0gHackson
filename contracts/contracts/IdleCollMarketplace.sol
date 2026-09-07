// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IdleCollMarketplace
 * @notice Trustless on-chain marketplace settled directly in native 0G tokens on 0G Galileo Testnet.
 */
contract IdleCollMarketplace is ReentrancyGuard, Ownable {
    struct Listing {
        uint256 listingId;
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price; // Price in native 0G (wei)
        bool active;
    }

    uint256 private _nextListingId = 1;
    mapping(uint256 => Listing) public listings;

    // Events
    event ItemListed(
        uint256 indexed listingId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 price
    );
    event ListingCancelled(uint256 indexed listingId, address indexed seller);
    event ItemBought(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        address nftContract,
        uint256 tokenId,
        uint256 price
    );

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @notice List an NFT for sale in native 0G tokens.
     */
    function listItem(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external nonReentrant returns (uint256) {
        require(price > 0, "Price must be greater than 0");
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Caller is not the owner");
        require(
            nft.isApprovedForAll(msg.sender, address(this)) || nft.getApproved(tokenId) == address(this),
            "Marketplace not approved to transfer NFT"
        );

        uint256 listingId = _nextListingId++;
        listings[listingId] = Listing({
            listingId: listingId,
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            active: true
        });

        emit ItemListed(listingId, msg.sender, nftContract, tokenId, price);
        return listingId;
    }

    /**
     * @notice Cancel an active listing.
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing is not active");
        require(listing.seller == msg.sender || msg.sender == owner(), "Not seller or owner");

        listing.active = false;
        emit ListingCancelled(listingId, listing.seller);
    }

    /**
     * @notice Buy a listed NFT by paying native 0G tokens.
     */
    function buyItem(uint256 listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing is not active");
        require(msg.value == listing.price, "Exact price in native 0G required");
        require(msg.sender != listing.seller, "Seller cannot buy own item");

        listing.active = false;

        // 1. Pay seller directly with native 0G
        (bool sent, ) = payable(listing.seller).call{value: msg.value}("");
        require(sent, "Failed to transfer 0G to seller");

        // 2. Transfer NFT from seller to buyer
        IERC721(listing.nftContract).safeTransferFrom(listing.seller, msg.sender, listing.tokenId);

        emit ItemBought(
            listingId,
            msg.sender,
            listing.seller,
            listing.nftContract,
            listing.tokenId,
            listing.price
        );
    }

    /**
     * @notice View function to get all active listings.
     */
    function getActiveListings() external view returns (Listing[] memory) {
        uint256 total = _nextListingId - 1;
        uint256 activeCount = 0;

        for (uint256 i = 1; i <= total; i++) {
            if (listings[i].active) {
                activeCount++;
            }
        }

        Listing[] memory items = new Listing[](activeCount);
        uint256 currentIndex = 0;
        for (uint256 i = 1; i <= total; i++) {
            if (listings[i].active) {
                items[currentIndex] = listings[i];
                currentIndex++;
            }
        }
        return items;
    }
}
