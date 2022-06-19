// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface ERC721Partial {
    function transferFrom(address from, address to, uint256 tokenId) external;
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256);
}
contract Airdrop is Ownable {
    using Strings for uint256;
    using ECDSA for bytes32;

    ERC721Partial public nft;
    uint16 public totalAirdropCount;
    address signer;
    address treasury;
    mapping(address => bool) public claimed;

    constructor(ERC721Partial _nft, address _signer) {
        nft = _nft;
        signer = _signer;
        treasury = msg.sender;
    }

    /// @notice Tokens on the given ERC-721 contract are transferred from you to a recipient.
    /// @param  amount      Which token IDs are transferred?
    function claim(uint16 amount, bytes calldata signature) external {
        require(verifySigner(signature), "Invalid signature."); 
        require(totalAirdropCount + amount <= 1858, "Exceeds claim amount");
        require(!claimed[msg.sender], "Already claimed.");

        for (uint16 index = 0; index < amount; index ++) {
            uint256 tokenId = nft.tokenOfOwnerByIndex(treasury, index);
            nft.transferFrom(treasury,msg.sender, tokenId);
        }
        claimed[msg.sender] = true;
        totalAirdropCount += amount;
    }

    //
    function verifySigner(bytes calldata signature) 
        internal view returns (bool) {
        bytes32 hash = keccak256(abi.encodePacked(msg.sender));
        bytes32 message = ECDSA.toEthSignedMessageHash(hash);
        address recoveredAddress = ECDSA.recover(message, signature);
        return (recoveredAddress != address(0) && recoveredAddress == signer);
    }

    function setSigner(address _signer) external onlyOwner {
        signer = _signer;
    }

    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }
}
