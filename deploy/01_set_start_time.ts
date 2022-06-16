import { DeployFunction } from 'hardhat-deploy/types';

const fn: DeployFunction = async function ({ deployments: { deploy, get, execute }, ethers: { getSigners, provider, utils }, network }) {
  const deployer = (await getSigners())[0];

  const currentTime = (await provider.getBlock('latest')).timestamp
  // 1655262000
  // 1655348400
  // 1655391600
  // const preSaleStartTime = currentTime + 600; // 5min
  // const raffleSaleStartTime = preSaleStartTime + 600; // 10 mins
  // const reservedSaleStartTime = raffleSaleStartTime + 600; // 10 mins
  const preSaleStartTime = 1655262000;
  const raffleSaleStartTime = 1655348400;
  const reservedSaleStartTime = 1655391600;

  // console.log('time: ', preSaleStartTime * 1000, raffleSaleStartTime * 1000, reservedSaleStartTime * 1000);
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
  return true;
  // Skip this on kovan.
  const chain = parseInt(await hre.getChainId());
  return chain != 1;
};
fn.tags = ['Anero Config Time'];
fn.dependencies = ['Anero']
export default fn;
