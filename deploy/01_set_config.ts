import { DeployFunction } from 'hardhat-deploy/types';
import { calculate_whitelist_root } from '../whitelist/utils';

const fn: DeployFunction = async function ({ deployments: { deploy, get, execute }, ethers: { getSigners, provider }, network }) {
  const deployer = (await getSigners())[0];
  const AneroNFT = await get('Anero');
  const signerAddress = "0xeA860Ae1b9aEB06b674664c5496D2F8Ee7C4BBFA";
  const baseTokenURI = "https://gateway.pinata.com/";
  const root = calculate_whitelist_root();
  const currentTime = (await provider.getBlock('latest')).timestamp

  const auctionStartTIme = currentTime + 10;
  const preSaleStartTime = currentTime + 10;
  const publicSaleStartTime = currentTime + 300;

  //Activate auction
  // try {
  //   await execute(
  //     'Anero',
  //     {from: deployer.address, log: true},
  //     'setAuctionSaleActive'
  //   );
  // } catch(e) {
  //   console.log(e);
  // }
  

  // set auction start time
  // await execute(
  //   'Anero',
  //   {from: deployer.address, log: true},
  //   'startAuctionSaleAt',
  //   currentTime
  // )

  // set presale start time
  // await execute(
  //   'Anero',
  //   {from: deployer.address, log: true},
  //   'startPreSaleAt',
  //   preSaleStartTime
  // )

  // set public sale start time
  // await execute(
  //   'Anero',
  //   {from: deployer.address, log: true},
  //   'startPublicSaleAt',
  //   publicSaleStartTime
  // )

  //set presale signer
  await execute(
    'Anero',
    {from: deployer.address, log: true},
    'setPreSaleSigner',
    signerAddress
  );
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
