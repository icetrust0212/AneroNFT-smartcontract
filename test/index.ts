import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract, utils } from "ethers";
import { ethers, getNamedAccounts, network } from "hardhat";
import {calculate_whitelist_root, signMessage, verifyWhitelist} from '../whitelist/utils';

let airdropContract: Contract;
let _signer: SignerWithAddress;
let _minter: SignerWithAddress;
let others: SignerWithAddress[];
const nftAddress = "0x926baa7445d56d5e8632046409cdc7d5844ce344";

describe("Airdrop", function () {
  beforeEach(async () => {
    const {deployer, minter, ..._others} = await getNamedAccounts();
    _signer = await ethers.getSigner(deployer);
    _minter = await ethers.getSigner(minter);

    const airdrop = await ethers.getContractFactory("Airdrop"); 
    airdropContract = await airdrop.deploy(nftAddress, deployer);

    await airdropContract.deployed();
    
  })

  const moveTime = async (timeInSeconds: number) => {
    await network.provider.send("evm_increaseTime", [timeInSeconds]);
    await network.provider.send("hardhat_mine", ["0x1"]);
  }

  it("Check deploy: ", async function () {
    expect(await airdropContract.owner()).to.equal(_signer.address);
  });

  it("Check airdrop: ", async () => {
    const signature = await signMessage(_minter.address, 2, "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
    expect(await airdropContract.connect(_minter).verifySigner(signature, 2)).to.be.equal(true);
  });
});
