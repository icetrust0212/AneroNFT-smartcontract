import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract, utils } from "ethers";
import { ethers, getNamedAccounts, network } from "hardhat";
import {calculate_whitelist_root, verifyWhitelist} from '../whitelist/utils';

let nftContract: Contract;
let _signer: SignerWithAddress;
let _minter: SignerWithAddress;
let others: SignerWithAddress[];

const collectionSize = 7777;
const maxBatchSize_ = 20;
const amountForAuction = 5000;
const amountForPresale = 1000;
const root = calculate_whitelist_root();
const baseTokenURI = "https://gateway.pinata.com/";

describe("AneroNFT", function () {
  beforeEach(async () => {
    const NFT = await ethers.getContractFactory("Anero"); 
    nftContract = await NFT.deploy(maxBatchSize_, collectionSize, amountForAuction, amountForPresale, root);

    await nftContract.deployed();
    await nftContract.setBaseURI(baseTokenURI);
    
    const {deployer, minter, ..._others} = await getNamedAccounts();
    _signer = await ethers.getSigner(deployer);
    _minter = await ethers.getSigner(minter);
    
  })

  const moveTime = async (timeInSeconds: number) => {
    await network.provider.send("evm_increaseTime", [timeInSeconds]);
    await network.provider.send("hardhat_mine", ["0x1"]);
  }

  it("Check deploy: ", async function () {
    expect(await nftContract.owner()).to.equal(_signer.address);
  });

  it("Check Dutch Auction Sale: ", async () => {
    await nftContract.connect(_signer).startAuctionSale();

    await moveTime(60 * 3); // move time 3 hour
    let price = await nftContract.getAuctionPrice();
    expect(price).to.be.equal(ethers.utils.parseEther('0.025'));

    await moveTime(60 * 5); // move time 5 hour
    price = await nftContract.getAuctionPrice();
    expect(price).to.be.equal(ethers.utils.parseEther('0.02'))

    let initialEthBalance = await ethers.provider.getBalance(_signer.address);
    let initialNFTBalance = await nftContract.numberMinted(_signer.address);

    await nftContract.connect(_signer).auctionSaleMint(1, {
      value: price
    });

    let currentEthBalance = await ethers.provider.getBalance(_signer.address);
    let currentNFTBalance = await nftContract.numberMinted(_signer.address);

    expect(currentNFTBalance.sub(initialNFTBalance)).to.be.equal(1);
    expect(initialEthBalance.sub(currentEthBalance).sub(price)).to.below(ethers.utils.parseEther('0.001')); // gas price
  });

  it("Check PreSale: ", async () => {
    await nftContract.connect(_signer).startPreSale(ethers.utils.parseEther('0.05'));
    let {proof} = verifyWhitelist(_signer.address);

    //revert with Needs more eth.
    await expect(nftContract.connect(_minter).preSaleMint(3, proof)).to.be.revertedWith("Not whitelisted");
    
    //success whitelist mint
    await nftContract.connect(_signer).preSaleMint(3, proof, {
      value: ethers.utils.parseEther("0.5")
    });

    expect(await nftContract.numberMinted(_signer.address)).to.equal(3);
    //revert with not whitelisted
    proof = verifyWhitelist(_minter.address).proof;
    await expect(nftContract.connect(_minter).preSaleMint( 1, proof)).to.be.revertedWith("Not whitelisted");
   
  });

  it("Check public mint: ", async () => {

    //revert with Public mint is not started yet.
    await expect(nftContract.publicSaleMint(3, {value: ethers.utils.parseEther('0.5')})).to.be.revertedWith("Public sale is not started yet");

    await nftContract.startPublicSale(ethers.utils.parseEther('0.05'));
    //revert with Needs more eth.
    await expect(nftContract.publicSaleMint(1)).to.be.revertedWith("Need to send more ETH.");

    //success pubilc mint
    await nftContract.publicSaleMint(1, {
      value: ethers.utils.parseEther("0.5")
    });

    expect(await nftContract.numberMinted(_signer.address)).to.equal(1);
  });

  it("withdraw test: ", async () => {
    await nftContract.startAuctionSale();
    await nftContract.connect(_minter).auctionSaleMint(3, {
      value: ethers.utils.parseEther('1')
    });

    await nftContract.connect(_signer).startPreSale(ethers.utils.parseEther('0.02'));
    let {proof} = verifyWhitelist(_minter.address);
    await nftContract.connect(_minter).preSaleMint(5, proof, {
      value: ethers.utils.parseEther('2')
    })

    await nftContract.connect(_signer).startPublicSale(ethers.utils.parseEther('0.05'));
    await nftContract.connect(_minter).publicSaleMint(5, {
      value: ethers.utils.parseEther('1')
    });

    expect(await ethers.provider.getBalance(nftContract.address)).to.be.equal(ethers.utils.parseEther('0.425'));

    const initialBalance = await ethers.provider.getBalance(_signer.address);
    await nftContract.connect(_signer).withdrawMoney();
    const currentBalance = await ethers.provider.getBalance(_signer.address);

    expect(currentBalance.sub(initialBalance).sub(ethers.utils.parseEther('0.425'))).to.be.below(ethers.utils.parseEther('0.01'));
    expect(await ethers.provider.getBalance(nftContract.address)).to.be.equal(0);
  })

});
