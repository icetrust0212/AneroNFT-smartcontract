import { DeployFunction } from 'hardhat-deploy/types';

const fn: DeployFunction = async function ({ deployments: { deploy, get, execute }, ethers: { getSigners, provider, utils }, network }) {
  const deployer = (await getSigners())[0];

  // Set sale prices - test.
  await execute(
    'Anero',
    {from: deployer.address, log: true},
    'setPreSalePrice',
    utils.parseEther('0.09')
  )

  await execute(
    'Anero',
    {from: deployer.address, log: true},
    'setRaffleSalePrice',
    utils.parseEther('0.14')
  )

  await execute(
    'Anero',
    {from: deployer.address, log: true},
    'setReservedSalePrice',
    utils.parseEther('0.14')
  )
};
fn.skip = async (hre) => {
  return true;
  // Skip this on kovan.
  const chain = parseInt(await hre.getChainId());
  return chain != 1;
};
fn.tags = ['Anero Config Price'];
fn.dependencies = ['Anero']
export default fn;
