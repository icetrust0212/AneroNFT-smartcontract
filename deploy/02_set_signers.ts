import { DeployFunction } from 'hardhat-deploy/types';

const fn: DeployFunction = async function ({ deployments: { deploy, get, execute }, ethers: { getSigners, provider, utils }, network }) {
  const deployer = (await getSigners())[0];

  const preSaleSigner1 = "0x5e6cCfBa0aB8Bf8BDEE5ABe9f6eE0BB2f274a609";
  const preSaleSigner2 = "0x6756d75ba11740483EC9d309e2c091a028d0915d";
  const raffleSaleSigner = "0xe2e831828bba4b77193D2E4587cb71e6BA64712b";
  const reservedSaleSigner = "0xd04A914B3EFae9721EcBbB7E8A9E5B5E11b3087E";

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
