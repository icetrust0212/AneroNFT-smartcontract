import { DeployFunction } from 'hardhat-deploy/types';
import { calculate_whitelist_root } from '../whitelist/utils';

const fn: DeployFunction = async function ({ deployments: { deploy, execute  }, ethers: { getSigners }, network }) {
  const deployer = (await getSigners())[0];
  // const treasury = "0xc09eAC15f9Ba6462e8E4612af7C431E1cfe08b87";
  const treasury = "0xC6C7e01b61C20343dC79DAB0778E980Bd08D586e";
  await execute(
    'Airdrop',
    {from: deployer.address, log: true},
    'setTreasury',
    treasury
  );
};
fn.skip = async (hre) => {
  return false;
  // Skip this on kovan.
  const chain = parseInt(await hre.getChainId());
  return chain != 1;
};
fn.tags = ['Airdrop Config'];
fn.dependencies = ['Airdrop']
export default fn;
