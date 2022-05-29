import { DeployFunction } from 'hardhat-deploy/types';

const fn: DeployFunction = async function ({ deployments: { deploy, get, execute }, ethers: { getSigners, provider, utils }, network }) {
  const deployer = (await getSigners())[0];

  // Set sale enable
  await execute(
    'Anero',
    {from: deployer.address, log: true},
    'toggleSale',
    "true"
  )
};
fn.skip = async (hre) => {
  return false;
  // Skip this on kovan.
  const chain = parseInt(await hre.getChainId());
  return chain != 1;
};
fn.tags = ['Anero Config Enable'];
fn.dependencies = ['Anero']
export default fn;
