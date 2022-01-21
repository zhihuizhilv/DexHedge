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

const ETHER1 = ethers.utils.parseEther("1");

// Factories
let DexHedgeFactory;
let BatPairReservesFactory;
let ERC20MockFactory;
let WBNBFactory;


// contract object
let dexHedge;
let batPairReserves;
let usdt;
let ttoken;
let wbnb;


async function getContractFactories() {
  ERC20MockFactory = await ethers.getContractFactory("ERC20Mock");
  DexHedgeFactory = await ethers.getContractFactory("DexHedge");
  BatPairReservesFactory = await ethers.getContractFactory("BatPairReserves");
  WBNBFactory = await ethers.getContractFactory("WBNB");
}

async function deployMockContract(deployer) {
  // usdt = await ERC20MockFactory.deploy("USDT", "USDT");
  // await usdt.deployed();
  // deployResult.writeDeployedContract(
  //   "usdt",
  //   usdt.address,
  //   "ERC20Mock",
  //   {
  //     name: "USDT",
  //     symbol: "USDT"
  //   }
  // );
  //
  // deployResult.save();
  //
  // ttoken = await ERC20MockFactory.deploy("Test Token", "TToken");
  // await ttoken.deployed();
  // deployResult.writeDeployedContract(
  //   "ttoken",
  //   ttoken.address,
  //   "ERC20Mock",
  //   {
  //     name: "Test Token",
  //     symbol: "TToken"
  //   }
  // );
  //
  // deployResult.save();


  wbnb = await WBNBFactory.deploy();
  await wbnb.deployed();
  deployResult.writeDeployedContract(
    "wbnb",
    wbnb.address,
    "WBNB",
  );

  deployResult.save();

}

async function deployContract() {
  dexHedge = await DexHedgeFactory.deploy();
  await dexHedge.deployed();
  deployResult.writeDeployedContract(
      "dexHedge",
    dexHedge.address,
      "DexHedge"
  );

  deployResult.save();

  batPairReserves = await BatPairReservesFactory.deploy(deployConfig.factory);
  await batPairReserves.deployed();
  deployResult.writeDeployedContract(
    "batPairReserves",
    batPairReserves.address,
    "BatPairReserves"
  );

  deployResult.save();
}

async function config(deployer) {
  console.log("begin addDex");
  await (await dexHedge.addDex(deployConfig.swapRouter)).wait();
  console.log("dex len:", await dexHedge.dexPoolLen());

  console.log("begin setTrader");
  await (await dexHedge.setTrader(usdt.address, await deployer.getAddress(), true)).wait();
  await (await dexHedge.setTrader(ttoken.address, await deployer.getAddress(), true)).wait();
  console.log("deployer is usdt trader:", await dexHedge.traders(usdt.address, await deployer.getAddress()));
  console.log("deployer is ttoken trader:", await dexHedge.traders(ttoken.address, await deployer.getAddress()));

  console.log("begin transfer token");
  await (await usdt.transfer(dexHedge.address, ETHER1.mul(10000))).wait();
  await (await ttoken.transfer(dexHedge.address, ETHER1.mul(30000))).wait();
  console.log("dexHedge.USDT balance:", ethers.utils.formatEther(await usdt.balanceOf(dexHedge.address)));
  console.log("dexHedge.TToken balance:", ethers.utils.formatEther(await ttoken.balanceOf(dexHedge.address)));
}


async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("network:", hre.network.name);
  console.log("deployer:", deployer.address);
  console.log("deployer.balance:", ethers.utils.formatEther((await deployer.getBalance())));

  //
  await deployResult.load();

  console.log("begin getContractFactories");
  await getContractFactories();

  console.log("begin deployMockContract");
  await deployMockContract(deployer);

  // console.log("begin deployContract");
  // await deployContract(deployer);

  // console.log("begin config");
  // await config(deployer);

  console.log("deploy done.");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
























