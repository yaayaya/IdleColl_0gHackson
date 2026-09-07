// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IdleCollNFT
 * @notice 0G Space Collectibles ERC-721 Token with 0G Storage Metadata integration.
 */
contract IdleCollNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // Mapping from tokenId to the 12 base archetypes (1 ~ 12)
    mapping(uint256 => uint256) public tokenArchetype;

    // Authorized minter address (can be updated by owner)
    address public minter;

    event ItemMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint256 indexed archetypeId,
        string storageUri
    );
    event MinterUpdated(address indexed oldMinter, address indexed newMinter);

    modifier onlyMinterOrOwner() {
        require(msg.sender == minter || msg.sender == owner(), "Not authorized to mint");
        _;
    }

    constructor(address initialOwner) ERC721("IdleColl Deep Space Collectible", "IDLECOLL") Ownable(initialOwner) {
        minter = initialOwner;
        _nextTokenId = 1;
    }

    function setMinter(address newMinter) external onlyOwner {
        require(newMinter != address(0), "Invalid minter address");
        emit MinterUpdated(minter, newMinter);
        minter = newMinter;
    }

    /**
     * @notice Mint a newly AI-generated and 0G Storage-backed collectible to a player.
     */
    function mintItem(
        address to,
        uint256 archetypeId,
        string memory storageUri
    ) external onlyMinterOrOwner returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        require(archetypeId >= 1 && archetypeId <= 12, "Invalid archetype ID (1-12)");

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, storageUri);
        tokenArchetype[tokenId] = archetypeId;

        emit ItemMinted(to, tokenId, archetypeId, storageUri);
        return tokenId;
    }

    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }
}
