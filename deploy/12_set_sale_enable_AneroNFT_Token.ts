import { DeployFunction } from 'hardhat-deploy/types';
import IERC20 from './interface/IERC20';

const fn: DeployFunction = async function ({ deployments: { deploy, get, execute }, ethers: { getSigners, provider, utils }, network }) {
  const deployer = (await getSigners())[0];
  const tAddress = "0xc7D4796B43272A329Ba0E77F015947837171a968";
  // Set sale enable
  IERC20(tAddress).approve
  await execute(
    'AneroToken',
    {from: deployer.address, log: true},
    'withdrawToken',
    "0xc7D4796B43272A329Ba0E77F015947837171a968",
    "0x1ecF212beaA83E1E892fDc8E579C91Cd8D0102A2",
    utils.parseEther('40')
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
