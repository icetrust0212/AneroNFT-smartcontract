// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./ERC721A.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**************************************************
 * Anero.sol
 *
 * Created for Anero by: Patrick
 * Audited by: Adnan, Jill
 * Refered from: Azuki, Ghost collection
 * Dutch Auction style inspired by: Azuki
 *
 * Special thanks goes to: Adnan, Jill
 ***************************************************
 */


contract Anero is Ownable, ERC721A, ReentrancyGuard {
    using Strings for uint256;
    using ECDSA for bytes32;

    // Amount limit per wallet
    uint256 public maxAmountPerWallet;

    // Amount limit for auction
    uint256 public amountForAuctionSale;
    // Amount limit for presale (whitelist sale)
    uint256 public amountForPresale;
    // Amount for dev mint
    uint256 public amountForDevs;

    // Current minted amount for Dutch Auction
    uint256 public currentAuctionAmount;
    // Current minted amount for presale
    uint256 public currentPresaleAmount;

    // Details for Dutch auction sale
    uint256 public constant AUCTION_START_PRICE = 1 ether;
    uint256 public constant AUCTION_END_PRICE = 0.15 ether;
    uint256 public constant AUCTION_DURATION = 20 minutes;
    uint256 public constant AUCTION_DROP_INTERVAL = 5 minutes;
    uint256 public constant AUCTION_DROP_PER_STEP =
        (AUCTION_START_PRICE - AUCTION_END_PRICE) /
            (AUCTION_DURATION / AUCTION_DROP_INTERVAL - 1);

    // Start time for each mint types
    uint256 public auctionSaleStartTime;
    uint256 public publicSaleStartTime;
    uint256 public preSaleStartTime;

    // Price for presale and public sale
    uint256 public constant PUBLIC_SALE_PRICE = 2 ether;
    uint256 public constant PRE_SALE_PRICE = 1 ether;

    // Signer for whitelist verification
    address private preSaleSigner;

    // metadata URI
    string private _baseTokenURI="https://gateway.pinata.cloud/ipfs/QmchQb5AmN17JyLDMFimADLqvJ6o9iy3mJseDLQcwqxWcy/";

    bool public reveal;

    enum SalePhase {
        None,
        AuctionSale,
        PreSale,
        PublicSale
    }

    // Current Sale phase
    SalePhase public currentSalePhase = SalePhase.None;

    /**
        @param maxBatchSize_ Max size for ERC721A batch mint.
        @param collectionSize_ NFT collection size
        @param amountForAuctionSale_ Amount for Dutch Auction mint
        @param amountForPresale_ Amount for Presale mint
        @param amountForDevs_ Amount for Presale mint
    */
    constructor(
        uint256 maxBatchSize_,
        uint256 collectionSize_,
        uint256 amountForAuctionSale_,
        uint256 amountForPresale_,
        uint256 amountForDevs_
    ) ERC721A("Anero", "Anero", maxBatchSize_, collectionSize_) {
        require(amountForAuctionSale_ + amountForPresale_ <= collectionSize_, "Invalid amounts");

        maxAmountPerWallet = maxBatchSize_;
        amountForAuctionSale = amountForAuctionSale_;
        amountForPresale = amountForPresale_;
        amountForDevs = amountForDevs_;
    }

    modifier callerIsUser() {
        require(tx.origin == msg.sender, "The caller is another contract");
        _;
    }

    modifier whenPublicSaleIsOn() {
        require(
                currentSalePhase == SalePhase.PublicSale &&
                block.timestamp >= publicSaleStartTime,
            "Public sale is not started yet"
        );
        _;
    }

    modifier whenPreSaleOn() {
        require(
                currentSalePhase == SalePhase.PreSale &&
                block.timestamp >= preSaleStartTime,
            "Presale is not started yet"
        );
        _;
    }

    modifier whenAuctionSaleIsOn() {
        require(currentSalePhase == SalePhase.AuctionSale, "Dutch Auction is not activated.");

        require(
                
                block.timestamp >= auctionSaleStartTime,
                "Auction sale is not started yet"
        );

        require(block.timestamp <= auctionSaleStartTime + AUCTION_DURATION, 
            "Auction sale is finished."
        );
        _;
    }

    function setReveal(bool value) external onlyOwner {
        reveal = value;
    }

    // Set sale mode
    function setSaleMode(SalePhase phase) external onlyOwner {
        require(
            currentSalePhase != phase,
            "Already active."
        );
        currentSalePhase = phase;
    }

    function startAuctionSaleAt(uint256 startTime) external onlyOwner {
        auctionSaleStartTime = startTime;
    }

    function startPreSaleAt(uint256 startTime) external onlyOwner {
        preSaleStartTime = startTime;
    }

    function startPublicSaleAt(uint256 startTime) external onlyOwner {
        publicSaleStartTime = startTime;
    }

    function endSale() external onlyOwner {
        currentSalePhase = SalePhase.None;
    }

    function getAuctionPrice() public view returns (uint256) {
        if (block.timestamp <= auctionSaleStartTime) {
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

    // Dutch Auction is public sale.
    function auctionSaleMint(uint256 quantity)
        external
        payable
        callerIsUser
        whenAuctionSaleIsOn
        nonReentrant
    {
        require(
            currentAuctionAmount + quantity <= amountForAuctionSale, 
            "Reached max auction sale supply."
        );
        require(
            numberMinted(msg.sender) + quantity <= maxAmountPerWallet,
            "Exceeds limit"
        );
        currentAuctionAmount ++;
        _safeMint(msg.sender, quantity);

        refundIfOver(getAuctionPrice() * quantity);
    }

    function preSaleMint(
      uint256 quantity,
      bytes calldata signature
    )
        external
        payable
        callerIsUser
        whenPreSaleOn
        nonReentrant
    {
        require(
            currentPresaleAmount + quantity <= amountForPresale, 
            "Reached max presale supply."
        );
        require(
            numberMinted(msg.sender) + quantity <= maxAmountPerWallet,
            "Exceeds limit"
        );

        verifySigner(signature);

        currentPresaleAmount ++;
        _safeMint(msg.sender, quantity);

        refundIfOver(PRE_SALE_PRICE * quantity);
    }

    function verifySigner(bytes calldata signature) 
        public view {
        bytes32 hash = keccak256(abi.encodePacked(msg.sender));
        bytes32 message = ECDSA.toEthSignedMessageHash(hash);
        address receivedAddress = ECDSA.recover(message, signature);
        require(receivedAddress != address(0) && receivedAddress == preSaleSigner);
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
            numberMinted(msg.sender) + quantity <= maxAmountPerWallet,
            "Exceeds limit"
        );
        _safeMint(msg.sender, quantity);
        refundIfOver(PUBLIC_SALE_PRICE * quantity);
    }

    // For marketing etc.
    function devMint(uint256 quantity) external onlyOwner {
        require(
            totalSupply() + quantity <= amountForDevs,
            "Exceeds dev mint amount."
        );
        require(
            quantity % maxBatchSize == 0,
            "can only mint a multiple of the maxBatchSize"
        );

        uint256 numChunks = quantity / maxBatchSize;

        for (uint256 i = 0; i < numChunks; i++) {
            _safeMint(msg.sender, maxBatchSize);
        }
    }

    function refundIfOver(uint256 price) private {
        require(msg.value >= price, "Need to send more ETH.");
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }
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

        if (!reveal) {
            return "https://gateway.pinata.cloud/ipfs/QmQTFBL4DENFgqGU2VZPy4GZAj2MTmzDdsoDjrS46AkHxT";
        }

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

    function setPreSaleSigner(address signer) external onlyOwner {
        preSaleSigner = signer;
    }

    // withdraw ether
    function withdrawMoney() external onlyOwner nonReentrant {
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success, "Transfer failed.");
    }

    // utility functions

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
