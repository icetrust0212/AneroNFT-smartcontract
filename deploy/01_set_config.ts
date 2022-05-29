import { DeployFunction } from 'hardhat-deploy/types';

const fn: DeployFunction = async function ({ deployments: { deploy, get, execute }, ethers: { getSigners, provider, utils }, network }) {
  const deployer = (await getSigners())[0];

  const preSaleSigner1 = "0x196f0822C65C7461913f500297F4A245487309e3";
  const preSaleSigner2 = "0xe29Fb7FadE1C5a15b3CE09eD1a95793F399219fa";
  const raffleSaleSigner = "0x2AA770bE1440b4Ff7845F03A19af50b39d68BD96";
  const reservedSaleSigner = "0xBF064b67385d716Cb97e2842283E4e4Be20E2b6f";

  const currentTime = (await provider.getBlock('latest')).timestamp

  const preSaleStartTime = currentTime + 10;
  const raffleSaleStartTime = currentTime + 610;
  const reservedSaleStartTime = currentTime + 1210;

  //set Signers
  await execute(
    'Anero',
    {from: deployer.address, log: true},
    'setSigners',
    preSaleSigner1,
    preSaleSigner2,
    raffleSaleSigner,
    reservedSaleSigner
  );

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

  // Set sale enable
  await execute(
    'Anero',
    {from: deployer.address, log: true},
    'toggleSale',
    "true"
  )
  // Set sale prices
  await execute(
    'Anero',
    {from: deployer.address, log: true},
    'setReservedSalePrice',
    utils.parseEther('0.35')
  )
};
fn.skip = async (hre) => {
  return false;
  // Skip this on kovan.
  const chain = parseInt(await hre.getChainId());
  return chain != 1;
};
fn.tags = ['Anero config'];
fn.dependencies = ['Anero']
export default fn;
