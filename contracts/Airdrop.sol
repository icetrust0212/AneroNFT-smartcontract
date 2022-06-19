// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/access/Ownable.sol";

interface ERC721Partial {
    function transferFrom(address from, address to, uint256 tokenId) external;
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256);
}
contract Airdrop is Ownable {

    ERC721Partial public nft;
    uint16 public totalAirdropCount;

    constructor(ERC721Partial _nft, ) {
        nft = _nft;
    }

    /// @notice Tokens on the given ERC-721 contract are transferred from you to a recipient.
    ///         Don't forget to execute setApprovalForAll first to authorize this contract.
    /// @param  recipient     Who gets the tokens?
    /// @param  amount      Which token IDs are transferred?
    function batchTransfer(address recipient, uint16 amount, bytes signature) external {
        for (uint16 index; index < amount; index++) {
            uint16 tokenId = nft.tokenOfOwnerByIndex(owner, index);
            tokenContract.transferFrom(msg.sender, recipient, tokenIds[index]);
        }

    }
}
