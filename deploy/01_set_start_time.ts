import { DeployFunction } from 'hardhat-deploy/types';

const fn: DeployFunction = async function ({ deployments: { deploy, get, execute }, ethers: { getSigners, provider, utils }, network }) {
  const deployer = (await getSigners())[0];

  const currentTime = (await provider.getBlock('latest')).timestamp

  const preSaleStartTime = currentTime + 300; // 5min
  const raffleSaleStartTime = preSaleStartTime + 600; // 10 mins
  const reservedSaleStartTime = raffleSaleStartTime + 600; // 10 mins

  // Set sale start times
  await execute(
    'Anero',
    {from: deployer.address, log: true},
    'startPreSaleAt',
    preSaleStartTime
  );

  await execute(
    'Anero',
    {from: deployer.address, log: true},
    'startRaffleSaleAt',
    raffleSaleStartTime
  );

  await execute(
    'Anero',
    {from: deployer.address, log: true},
    'startReservedSaleAt',
    reservedSaleStartTime
  );
};
fn.skip = async (hre) => {
  return false;
  // Skip this on kovan.
  const chain = parseInt(await hre.getChainId());
  return chain != 1;
};
fn.tags = ['Anero Config Time'];
fn.dependencies = ['Anero']
export default fn;
