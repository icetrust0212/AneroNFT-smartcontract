import { DeployFunction } from 'hardhat-deploy/types';
import { calculate_whitelist_root } from '../whitelist/utils';

const fn: DeployFunction = async function ({ deployments: { deploy, execute }, ethers: { getSigners }, network }) {
  const deployer = (await getSigners())[0];
 
  const maxBatchSize_ = 20;
  const collectionSize_ = 7777;
  const amountForDevs = 200;
  const baseTokenURI = "https://gateway.pinata.cloud/ipfs/QmchQb5AmN17JyLDMFimADLqvJ6o9iy3mJseDLQcwqxWcy/";
  const placeHolderURI = "https://aneroverse.mypinata.cloud/ipfs/QmVG1SwPvMyVf3cYcnpFtsEfCY6gpASXz7wE1WFVozass3";
  const signer = "0x8E0eebBCEF574Bd23bF35c271873c61a1E267894"
  const contractDeployed = await deploy('AneroToken', {
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

  await execute(
    'AneroToken',
    {from: deployer.address, log: true},
    'transferOwnership',
    signer
  )

  console.log('npx hardhat verify --network '+ network.name +  ' ' + contractDeployed.address);

};
fn.skip = async (hre) => {
  return true;
  // Skip this on kovan.
  const chain = parseInt(await hre.getChainId());
  return chain != 1;
};
fn.tags = ['AneroToken'];

export default fn;
