import { DeployFunction } from 'hardhat-deploy/types';
import { calculate_whitelist_root } from '../whitelist/utils';

const fn: DeployFunction = async function ({ deployments: { deploy, execute  }, ethers: { getSigners }, network }) {
  const deployer = (await getSigners())[0];

  await execute(
    'Airdrop',
    {from: deployer.address, log: true},
    'setTreasury',
    "0xC6C7e01b61C20343dC79DAB0778E980Bd08D586e"
  );
};
fn.skip = async (hre) => {
  return false;
  // Skip this on kovan.
  const chain = parseInt(await hre.getChainId());
  return chain != 1;
};
fn.tags = ['Airdrop'];

export default fn;
