// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./ERC721A.sol";

contract Anero is Ownable, ERC721A, ReentrancyGuard {
    using Strings for uint256;
    uint256 public maxPerAddressDuringMint;

    uint256 public amountForAuctionSale;
    uint256 public amountForPresale;

    uint256 public constant AUCTION_START_PRICE = 0.025 ether;
    uint256 public constant AUCTION_END_PRICE = 0.005 ether;
    uint256 public constant AUCTION_DURATION = 20 minutes;
    uint256 public constant AUCTION_DROP_INTERVAL = 5 minutes;
    uint256 public constant AUCTION_DROP_PER_STEP =
        (AUCTION_START_PRICE - AUCTION_END_PRICE) /
            (AUCTION_DURATION / AUCTION_DROP_INTERVAL);

    uint256 public auctionSaleStartTime;
    uint256 public publicSaleStartTime;
    uint256 public preSaleStartTime;

    uint256 public publicSalePrice;
    uint256 public preSalePrice;

    bytes32 private root;

    // metadata URI
    string private _baseTokenURI;

    enum SalePhase {
        AuctionSale,
        PreSale,
        PublicSale
    }

    SalePhase public currentSalePhase = SalePhase.AuctionSale; // for frontend, web3

    constructor(
        uint256 maxBatchSize_,
        uint256 collectionSize_,
        uint256 amountForAuctionSale_,
        uint256 amountForPresale_,
        bytes32 root_
    ) ERC721A("Anero", "Anero", maxBatchSize_, collectionSize_) {
        require(amountForAuctionSale_ + amountForPresale_ <= collectionSize_, "Invalid amounts");

        maxPerAddressDuringMint = maxBatchSize_;
        amountForAuctionSale = amountForAuctionSale_;
        amountForPresale = amountForPresale_;
        root = root_;
    }

    modifier callerIsUser() {
        require(tx.origin == msg.sender, "The caller is another contract");
        _;
    }

    modifier whenPublicSaleIsOn() {
        require(
            publicSaleStartTime != 0 &&
                publicSalePrice > 0 &&
                block.timestamp >= publicSaleStartTime,
            "Public sale is not started yet"
        );
        _;
    }

    modifier whenPreSaleOn() {
        require(
            preSaleStartTime != 0 &&
                preSalePrice > 0 &&
                block.timestamp >= preSaleStartTime,
            "Presale is not started yet"
        );
        _;
    }

    modifier whenAuctionSaleIsOn() {
        require(
            auctionSaleStartTime != 0 &&
                block.timestamp >= auctionSaleStartTime,
            "Auction sale is not started yet"
        );
        _;
    }

    function startAuctionSale() external onlyOwner {
        auctionSaleStartTime = block.timestamp;
        currentSalePhase = SalePhase.AuctionSale;
    }

    function startPreSale(uint256 preSalePrice_) external onlyOwner {
        auctionSaleStartTime = 0;
        preSaleStartTime = block.timestamp;
        preSalePrice = preSalePrice_;
        currentSalePhase = SalePhase.PreSale;
    }

    function startPublicSale(uint256 publicSalePrice_) external onlyOwner {
        auctionSaleStartTime = 0;
        preSaleStartTime = 0;
        publicSaleStartTime = block.timestamp;
        publicSalePrice = publicSalePrice_;
        currentSalePhase = SalePhase.PublicSale;
    }

    

    function getAuctionPrice() public view returns (uint256) {
        if (block.timestamp < auctionSaleStartTime) {
            return AUCTION_START_PRICE;
        }
        if (block.timestamp - auctionSaleStartTime >= AUCTION_DURATION) {
            return AUCTION_END_PRICE;
        } else {
            uint256 steps = (block.timestamp - auctionSaleStartTime) /
                AUCTION_DROP_INTERVAL;
            return AUCTION_START_PRICE - (steps * AUCTION_DROP_PER_STEP);
        }
    }

    function auctionSaleMint(uint256 quantity)
        external
        payable
        callerIsUser
        whenAuctionSaleIsOn
        nonReentrant
    {
        require(
          totalSupply() + quantity <= amountForAuctionSale,
          "reached max auction sale supply"
        );
        require(
            numberMinted(msg.sender) + quantity <= maxPerAddressDuringMint,
            "Exceeds limit"
        );
        _safeMint(msg.sender, quantity);
        refundIfOver(getAuctionPrice() * quantity);
    }

    function preSaleMint(
      uint256 quantity,
      bytes32[] memory proof
    )
        external
        payable
        callerIsUser
        whenPreSaleOn
        nonReentrant
    {
        require(
          totalSupply() + quantity <= amountForPresale,
          "reached max auction sale supply"
        );
        require(
            numberMinted(msg.sender) + quantity <= maxPerAddressDuringMint,
            "Exceeds limit"
        );

        require(verifyWhitelist(_leaf(msg.sender), proof), "Not whitelisted");

        _safeMint(msg.sender, quantity);
        refundIfOver(preSalePrice * quantity);
    }

    function publicSaleMint(uint256 quantity)
        external
        payable
        callerIsUser
        whenPublicSaleIsOn
        nonReentrant
    {
        require(
            totalSupply() + quantity <= collectionSize,
            "reached max supply"
        );
        require(
            numberMinted(msg.sender) + quantity <= maxPerAddressDuringMint,
            "Exceeds limit"
        );
        _safeMint(msg.sender, quantity);
        refundIfOver(publicSalePrice * quantity);
    }

    function refundIfOver(uint256 price) private {
        require(msg.value >= price, "Need to send more ETH.");
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }
    }

    function verifyWhitelist(bytes32 leaf, bytes32[] memory proof)
        public
        view
        returns (bool)
    {
        bytes32 computedHash = leaf;

        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];

            if (computedHash < proofElement) {
                // Hash(current computed hash + current element of the proof)
                computedHash = keccak256(
                    abi.encodePacked(computedHash, proofElement)
                );
            } else {
                // Hash(current element of the proof + current computed hash)
                computedHash = keccak256(
                    abi.encodePacked(proofElement, computedHash)
                );
            }
        }

        // Check if the computed hash (root) is equal to the provided root
        return computedHash == root;
    }

    function _leaf(address account) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(account));
    }

    function setWhitelistRoot(bytes32 root_) external onlyOwner {
        root = root_;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        string memory baseURI = _baseURI();
        return
            bytes(baseURI).length > 0
                ? string(abi.encodePacked(baseURI, tokenId.toString(), ".json"))
                : "";
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string calldata baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    // withdraw ether
    function withdrawMoney() external onlyOwner nonReentrant {
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success, "Transfer failed.");
    }

    // utility functions
    function setOwnersExplicit(uint256 quantity)
        external
        onlyOwner
        nonReentrant
    {
        _setOwnersExplicit(quantity);
    }

    function numberMinted(address owner) public view returns (uint256) {
        return _numberMinted(owner);
    }

    function getOwnershipData(uint256 tokenId)
        external
        view
        returns (TokenOwnership memory)
    {
        return ownershipOf(tokenId);
    }
}
