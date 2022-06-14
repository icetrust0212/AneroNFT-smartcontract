import { DeployFunction } from 'hardhat-deploy/types';
import { calculate_whitelist_root } from '../whitelist/utils';

const fn: DeployFunction = async function ({ deployments: { deploy }, ethers: { getSigners }, network }) {
  const deployer = (await getSigners())[0];
 
  const maxBatchSize_ = 20;
  const collectionSize_ = 7777;
  const amountForDevs = 200;
  const baseTokenURI = "https://gateway.pinata.cloud/ipfs/QmchQb5AmN17JyLDMFimADLqvJ6o9iy3mJseDLQcwqxWcy/";
  const placeHolderURI = "https://aneroverse.mypinata.cloud/ipfs/QmcY54WXsqeq3baKzXfDp2B5iARMjr2WmSrLtGoLcRVnLa";

  const contractDeployed = await deploy('Anero', {
    from: deployer.address,
    log: true,
    skipIfAlreadyDeployed: true,
    args: [
      baseTokenURI,
      placeHolderURI,
      maxBatchSize_,
      collectionSize_,
      amountForDevs
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
fn.tags = ['Anero'];

export default fn;
