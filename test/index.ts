import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers, getNamedAccounts } from "hardhat";
import {calculate_whitelist_root, verifyWhitelist} from '../whitelist/utils';

let nftContract: Contract;
let _signer: SignerWithAddress;
let _minter: SignerWithAddress;
let others: SignerWithAddress[];

const collectionSize = 10000;
const maxBatchSize_ = 20;
const root = calculate_whitelist_root();
const baseTokenURI = "https://gateway.pinata.com/";

describe("AneroNFT", function () {
  beforeEach(async () => {
    const NFT = await ethers.getContractFactory("AneroNFT"); 
    nftContract = await NFT.deploy(maxBatchSize_, collectionSize, baseTokenURI, root);
    await nftContract.deployed();
    
    const {deployer, minter, ..._others} = await getNamedAccounts();
    _signer = await ethers.getSigner(deployer);
    _minter = await ethers.getSigner(minter);
    
    console.log('signers: ', _signer.address, _minter.address);
  })

  it("Check deploy: ", async function () {
    expect(await nftContract.owner()).to.equal(_signer.address);
  });

  it("Check contract states: ", async () => {
    expect(await nftContract.saleMode()).to.equal(0);
    expect(await nftContract.isEnableSale()).to.equal(false);
    await nftContract.setEnableSale(true);
    expect(await nftContract.isEnableSale()).to.equal(true);
  });

  it("Check whitelist mint: ", async () => {
    await nftContract.setEnableSale(true);
    let {proof} = verifyWhitelist(_signer.address);

    //revert with Needs more eth.
    await expect(nftContract.mintWhitelistSale(_signer.address, proof, 1)).to.be.revertedWith("Need to send more ETH.");
    
    //success whitelist mint
    await nftContract.mintWhitelistSale(_signer.address, proof, 1, {
      value: ethers.utils.parseEther("0.5")
    });

    expect(await nftContract.numberMinted(_signer.address)).to.equal(1);
    //revert with not whitelisted
    nftContract.connect(_minter);
    proof = verifyWhitelist(_minter.address).proof;
    await expect(nftContract.mintWhitelistSale(_signer.address, proof, 1)).to.be.revertedWith("Not whitelisted");
    
   
  });

  it("Check public mint: ", async () => {
    await nftContract.setEnableSale(true);
    nftContract.connect(_minter);

    //revert with Public mint is not started yet.
    await expect(nftContract.mintPublicSale(_minter.address, 1)).to.be.revertedWith("Public mint is not started yet!");

    await nftContract.setSaleMode(1);
    //revert with Needs more eth.
    await expect(nftContract.mintPublicSale(_minter.address, 1)).to.be.revertedWith("Need to send more ETH.");

    //success pubilc mint
    await nftContract.mintPublicSale(_minter.address, 1, {
      value: ethers.utils.parseEther("0.5")
    });

    expect(await nftContract.numberMinted(_minter.address)).to.equal(1);
  });

  it("Check batch mint: ", async () => {
    await nftContract.setEnableSale(true);
    nftContract.connect(_minter);

    await nftContract.setSaleMode(1);
    
    //rever pubilc mint with Need more money
    await expect(nftContract.mintPublicSale(_minter.address, 5, {
      value: ethers.utils.parseEther("1")
    })).to.be.revertedWith("Need to send more ETH.");

    //success
    await nftContract.mintPublicSale(_minter.address, 5, {
      value: ethers.utils.parseEther((0.3 * 5).toString())
    });

    expect(await nftContract.numberMinted(_minter.address)).to.equal(5);
  });
});
