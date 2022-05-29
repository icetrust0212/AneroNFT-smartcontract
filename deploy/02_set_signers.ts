import { DeployFunction } from 'hardhat-deploy/types';

const fn: DeployFunction = async function ({ deployments: { deploy, get, execute }, ethers: { getSigners, provider, utils }, network }) {
  const deployer = (await getSigners())[0];

  const preSaleSigner1 = "0x196f0822C65C7461913f500297F4A245487309e3";
  const preSaleSigner2 = "0xe29Fb7FadE1C5a15b3CE09eD1a95793F399219fa";
  const raffleSaleSigner = "0x2AA770bE1440b4Ff7845F03A19af50b39d68BD96";
  const reservedSaleSigner = "0xBF064b67385d716Cb97e2842283E4e4Be20E2b6f";

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
};
fn.skip = async (hre) => {
  return false;
  // Skip this on kovan.
  const chain = parseInt(await hre.getChainId());
  return chain != 1;
};
fn.tags = ['Anero Config Signer'];
fn.dependencies = ['Anero']
export default fn;
