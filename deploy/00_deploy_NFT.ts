import { DeployFunction } from 'hardhat-deploy/types';
import { calculate_whitelist_root } from '../whitelist/utils';

const fn: DeployFunction = async function ({ deployments: { deploy }, ethers: { getSigners }, network }) {
  const deployer = (await getSigners())[0];
 
  const maxBatchSize_ = 5;
  const collectionSize_ = 7777;
  const amountForAuctionSale = 3000;
  const amountForPresale = 2000;
  const baseTokenURI = "https://gateway.pinata.com/";
  const root = calculate_whitelist_root();

  const contractDeployed = await deploy('Anero', {
    from: deployer.address,
    log: true,
    skipIfAlreadyDeployed: true,
    args: [
      maxBatchSize_,
      collectionSize_,
      amountForAuctionSale,
      amountForPresale
    ]
  });
  console.log('npx hardhat verify --network '+ network.name +  ' ' + contractDeployed.address);

};
fn.skip = async (hre) => {
  return false;
  // Skip this on kovan.
  const chain = parseInt(await hre.getChainId());
  return chain != 1;
};
fn.tags = ['AneroNFT'];

export default fn;
