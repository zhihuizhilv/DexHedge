// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// import {ethers} from "hardhat";
// import {ZERO_ADDRESS} from "../test/utils/helpers";

const hre = require("hardhat");
const ethers = hre.ethers;
const BigNumber = ethers.BigNumber;
const deployResult = require('./deploy_result');
const deployConfig = require("./deploy_config")[hre.network.name];


async function getDexHedge() {
  return await ethers.getContractAt(deployResult.getData().deployedContract.dexHedge.contractName, deployResult.getData().deployedContract.dexHedge.address);
}

async function addTrader(trader) {
  let dexHedge = await getDexHedge();
  // await (await dexHedge.setTrader(deployResult.getData().deployedContract.usdt.address, trader, true)).wait();
  // await (await dexHedge.setTrader(deployResult.getData().deployedContract.ttoken.address, trader, true)).wait();
  console.log(trader, "is usdt trader:", await dexHedge.traders(deployResult.getData().deployedContract.usdt.address, trader));
  console.log(trader, "is ttoken trader:", await dexHedge.traders(deployResult.getData().deployedContract.ttoken.address, trader));
}


async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("network:", hre.network.name);
  console.log("deployer:", deployer.address);
  console.log("deployer.balance:", ethers.utils.formatEther((await deployer.getBalance())));

  await deployResult.load();

  console.log("begin addTrader");
  await addTrader("0xa81E18D3b44f6B23f08C90FFA80932c61059cc79");

  console.log("done.");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
























