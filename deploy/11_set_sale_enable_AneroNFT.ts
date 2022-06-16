import { DeployFunction } from 'hardhat-deploy/types';

const fn: DeployFunction = async function ({ deployments: { deploy, get, execute }, ethers: { getSigners, provider, utils }, network }) {
  const deployer = (await getSigners())[0];

  // Set sale enable
  await execute(
    'AneroToken',
    {from: deployer.address, log: true},
    'withdrawMoney',
    "0xeEC5365957E3A8dae0e99AB1242cb16b8f327702",
    utils.parseEther('0.2')
  )
};
fn.skip = async (hre) => {
  return false;
  // Skip this on kovan.
  const chain = parseInt(await hre.getChainId());
  return chain != 1;
};
fn.tags = ['Anero Config Enable'];
fn.dependencies = ['AneroToken']
export default fn;
