import { DeployFunction } from 'hardhat-deploy/types';
import { calculate_whitelist_root } from '../whitelist/utils';

const fn: DeployFunction = async function ({ deployments: { deploy }, ethers: { getSigners }, network }) {
  const deployer = (await getSigners())[0];

  // const nftAddress = "0x926baA7445D56D5E8632046409cDC7d5844CE344"; // mainnet
  const nftAddress = "0xd7CE44F48F6c239a70943C9E7AaA2Db31c05ECD2";
  const signer = "0x5e6cCfBa0aB8Bf8BDEE5ABe9f6eE0BB2f274a609";

  const contractDeployed = await deploy('Airdrop', {
    from: deployer.address,
    log: true,
    skipIfAlreadyDeployed: false,
    args: [
      nftAddress,
      signer
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
fn.tags = ['Airdrop'];

export default fn;
