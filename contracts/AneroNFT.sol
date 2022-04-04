// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC721A.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract AneroNFT is Ownable, ERC721A, ReentrancyGuard {
    using Strings for uint256;

    uint8 private constant WHITELIST_SALE_MODE = 0;
    uint8 private constant PUBLIC_SALE_MODE = 1;

    uint8 private currentSaleMode = WHITELIST_SALE_MODE;

    bytes32 private _root;

    uint256 private presalePrice = 25 * 10**16; // 0.25 eth
    uint256 private publicSalePrice = 3 * 10**17; // 0.3 eth

    string private _strBaseTokenURI;
    bool private enableSale;

    uint256 private LIMIT_PER_WALLET;

    modifier SaleEnabled() {
        require(enableSale, "Sale is not started yet");
        _;
    }

    event SaleModeChanged(uint8 saleMode);
    event MintNFT(address indexed _to, uint256 _number);
    event LimitPerWalletChanged(uint256 _limit);
    event EnableSaleChanged(bool enableSale);

    constructor(
        uint256 maxBatchSize_,
        uint256 collectionSize_,
        string memory baseTokenURI,
        bytes32 root
    ) ERC721A("Anero NFT", "Anero", maxBatchSize_, collectionSize_) {
        _root = root;
        _strBaseTokenURI = baseTokenURI;
        enableSale = false;
        LIMIT_PER_WALLET = maxBatchSize_;
    }

    function _baseURI() internal view override returns (string memory) {
        return _strBaseTokenURI;
    }

    function tokenURI(uint256 tokenId)
        public
        view
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

    function isEnableSale() external view returns (bool) {
        return enableSale;
    }

     function numberMinted(address owner) public view returns (uint256) {
        return _numberMinted(owner);
    }

    function setEnableSale(bool _enableSale) external onlyOwner {
        enableSale = _enableSale;
        emit EnableSaleChanged(enableSale);
    }

    function price() public view returns (uint256) {
        if (currentSaleMode == WHITELIST_SALE_MODE) {
            return presalePrice;
        }

        return publicSalePrice;
    }

    function mintAdmin(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= collectionSize, "Exceed max supply.");
        require(
            numberMinted(to) + amount <= LIMIT_PER_WALLET,
            "You exceed limit holding amount."
        );

        _safeMint(to, amount);
    }

    function mintPublicSale(address recipiant, uint256 amount)
        public
        payable
        SaleEnabled
    {
        require(currentSaleMode == PUBLIC_SALE_MODE , "Public mint is not started yet!");
        require(totalSupply() + amount <= collectionSize, "Exceed max supply");
        require(
            numberMinted(recipiant) + amount <= LIMIT_PER_WALLET,
            "You exceed limit."
        );
        _safeMint(recipiant, amount);
        refundIfOver(price() * amount);
    }

    function mintWhitelistSale(
        address recipiant,
        bytes32[] memory proof,
        uint256 amount
    ) public payable SaleEnabled {
        require(currentSaleMode == WHITELIST_SALE_MODE, "Presale is not suppoted!");

        bool isWhitelisted = verifyWhitelist(_leaf(recipiant), proof);

        require(isWhitelisted, "Not whitelisted");
        require(totalSupply() + amount <= collectionSize, "Exceed max supply");
        require(
            numberMinted(recipiant) + amount <= LIMIT_PER_WALLET,
            "You exceed limit."
        );
        _safeMint(recipiant, amount);
        refundIfOver(price() * amount);

    }

    function refundIfOver(uint256 amount) private {
        require(msg.value >= amount, "Need to send more ETH.");
        if (msg.value > amount) {
            payable(msg.sender).transfer(msg.value - amount);
        }
    }

    function withdraw() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function _leaf(address account) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(account));
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
        return computedHash == _root;
    }

    function whitelistRoot() external view returns (bytes32) {
        return _root;
    }

    function setWhitelistRoot(bytes32 root) external onlyOwner {
        _root = root;
    }

    function saleMode() external view returns (uint8) {
        return currentSaleMode;
    }

    function setSaleMode(uint8 mode) external onlyOwner {
        currentSaleMode = mode;

        emit SaleModeChanged(mode);
    }

    function setPresalePrice(uint256 _presalePrice) external onlyOwner {
        presalePrice = _presalePrice;
    }

    function setPublicsalePrice(uint256 _publicsalePrice) external onlyOwner {
        publicSalePrice = _publicsalePrice;
    }

}
