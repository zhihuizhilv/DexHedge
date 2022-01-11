import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber, BigNumberish, ContractFactory, Signer, utils } from "ethers";
import { DexHedge, ERC20Mock, SwapRouterMock } from "../typechain";
import { it } from "mocha";

const ZERO_ASSRESS = "0x0000000000000000000000000000000000000000";
const ETHER1 = ethers.utils.parseEther("1");


describe("DexHedge", function () {
  let deployer: Signer;
  let candidate: Signer;
  let trader1: Signer;
  let trader2: Signer;

  let DexHedgeFactory: ContractFactory;
  let SwapRouterMockFactory: ContractFactory;
  let ERC20MockFactory: ContractFactory;

  let dexHedge: DexHedge;
  let swapRouter: SwapRouterMock;
  let swapRouter2: SwapRouterMock;
  let wbnb: ERC20Mock;
  let usdt: ERC20Mock;

  before(async () => {
    let signers = await ethers.getSigners();
    [deployer, candidate, trader1, trader2, ...signers] = signers;
    console.log('deployer：', await deployer.getAddress());
    console.log('candidate：', await candidate.getAddress());
    console.log('trader1：', await trader1.getAddress());
    console.log('trader2：', await trader2.getAddress());

    DexHedgeFactory = await ethers.getContractFactory("DexHedge");
    SwapRouterMockFactory = await ethers.getContractFactory("SwapRouterMock");
    ERC20MockFactory = await ethers.getContractFactory("ERC20Mock");
  });

  beforeEach(async () => {
    console.log('before each');
  });

  context("all right", () => {
    console.log('all right');

    before(async () => {
    });

    beforeEach(async () => {
      dexHedge = (await DexHedgeFactory.deploy()) as DexHedge;
      wbnb = (await ERC20MockFactory.deploy("wbnb", "wbnb")) as ERC20Mock;
      usdt = (await ERC20MockFactory.deploy("USDT", "USDT")) as ERC20Mock;

      await dexHedge.deployed();
      await wbnb.deployed();
      await usdt.deployed();

      swapRouter = (await SwapRouterMockFactory.deploy(wbnb.address)) as SwapRouterMock;
      swapRouter2 = (await SwapRouterMockFactory.deploy(wbnb.address)) as SwapRouterMock;
      await swapRouter.deployed();
      await swapRouter2.deployed();
    });

    it("owner manager", async function() {
      console.log('owner:', await dexHedge.owner());
      expect(await dexHedge.owner()).eq(await deployer.getAddress());
      expect(dexHedge.connect(deployer).renounceOwnership()).revertedWith("can't renounce ownership");
      expect(dexHedge.connect(candidate).transferOwnership(await candidate.getAddress())).revertedWith("Ownable: caller is not the owner");
      await dexHedge.connect(deployer).transferOwnership(await candidate.getAddress());
      expect(await dexHedge.owner()).eq(await candidate.getAddress());
    });

    it("DEX manager", async function() {
      // add dex
      expect((await dexHedge.dexPoolLen()).toString()).eq('0');
      expect(dexHedge.connect(candidate).addDex(swapRouter.address)).revertedWith("Ownable: caller is not the owner");
      await dexHedge.connect(deployer).addDex(swapRouter.address);
      expect((await dexHedge.dexPoolLen()).toString()).eq('1');
      expect(await dexHedge.swapRouterVec(0)).eq(swapRouter.address);
      expect((await dexHedge.swapRouterIdMap(swapRouter.address)).toString()).eq("0");
      await dexHedge.connect(deployer).addDex(swapRouter2.address);
      expect((await dexHedge.dexPoolLen()).toString()).eq('2');
      expect(await dexHedge.swapRouterVec(1)).eq(swapRouter2.address);
      expect((await dexHedge.swapRouterIdMap(swapRouter2.address)).toString()).eq("1");

      // remove dex
      expect(dexHedge.connect(candidate).removeDex(0)).revertedWith("Ownable: caller is not the owner");
      await dexHedge.connect(deployer).removeDex(0);
      expect((await dexHedge.dexPoolLen()).toString()).eq('2');
      expect(await dexHedge.swapRouterVec(0)).eq(ZERO_ASSRESS);
      expect((await dexHedge.swapRouterIdMap(swapRouter.address)).toString()).eq("0");

      expect(dexHedge.connect(candidate).removeDex(1)).revertedWith("Ownable: caller is not the owner");
      await dexHedge.connect(deployer).removeDex(1);
      expect((await dexHedge.dexPoolLen()).toString()).eq('2');
      expect(await dexHedge.swapRouterVec(1)).eq(ZERO_ASSRESS);
      expect((await dexHedge.swapRouterIdMap(swapRouter.address)).toString()).eq("0");
    });

    it("trader manage", async function() {
      expect(await dexHedge.traders(wbnb.address, await trader1.getAddress())).eq(false);
      expect(await dexHedge.traders(usdt.address, await trader2.getAddress())).eq(false);
      expect(dexHedge.connect(candidate).setTrader(wbnb.address, await trader1.getAddress(), true)).revertedWith("Ownable: caller is not the owner");
      await dexHedge.connect(deployer).setTrader(wbnb.address, await trader1.getAddress(), true);
      await dexHedge.connect(deployer).setTrader(usdt.address, await trader2.getAddress(), true);
      expect(await dexHedge.traders(wbnb.address, await trader1.getAddress())).eq(true);
      expect(await dexHedge.traders(usdt.address, await trader2.getAddress())).eq(true);
      await dexHedge.connect(deployer).setTrader(wbnb.address, await trader1.getAddress(), false);
      await dexHedge.connect(deployer).setTrader(usdt.address, await trader2.getAddress(), false);
      expect(await dexHedge.traders(wbnb.address, await trader1.getAddress())).eq(false);
      expect(await dexHedge.traders(usdt.address, await trader2.getAddress())).eq(false);
    })

    it("swap", async function () {
      await dexHedge.connect(deployer).addDex(swapRouter.address);
      await dexHedge.connect(deployer).setTrader(wbnb.address, await trader1.getAddress(), true);
      await dexHedge.connect(deployer).setTrader(usdt.address, await trader2.getAddress(), true);
      await wbnb.connect(deployer).transfer(swapRouter.address, ETHER1.mul(10000));
      await wbnb.connect(deployer).transfer(dexHedge.address, ETHER1.mul(10000));
      await usdt.connect(deployer).transfer(swapRouter.address, ETHER1.mul(10000));
      await usdt.connect(deployer).transfer(dexHedge.address, ETHER1.mul(10000));

      let amountIn = ETHER1.mul(100);
      expect(dexHedge.connect(trader1).swap(0, amountIn, 0, [usdt.address, wbnb.address], Math.floor(Date.now()/1000)+60)).revertedWith("trader don't match the from token");
      expect(dexHedge.connect(trader2).swap(0, amountIn, 0, [wbnb.address, usdt.address], Math.floor(Date.now()/1000)+60)).revertedWith("trader don't match the from token");

      let beginWBnbAmount = await wbnb.balanceOf(dexHedge.address);
      let beginUSDTAmount = await usdt.balanceOf(dexHedge.address);
      await dexHedge.connect(trader1).swap(0, amountIn, 0, [wbnb.address, usdt.address], Math.floor(Date.now()/1000)+60);
      let endWBnbAmount = await wbnb.balanceOf(dexHedge.address);
      let endUSDTAmount = await usdt.balanceOf(dexHedge.address);
      console.log("beginWBnbAmount:", beginWBnbAmount.toString());
      console.log("beginUSDTAmount:", beginUSDTAmount.toString());
      console.log("endWBnbAmount:", endWBnbAmount.toString());
      console.log("endUSDTAmount:", endUSDTAmount.toString());
      expect(beginWBnbAmount.sub(endWBnbAmount)).eq(amountIn);
      expect(endUSDTAmount.sub(beginUSDTAmount)).eq(amountIn.div(2));

      beginWBnbAmount = endWBnbAmount;
      beginUSDTAmount = endUSDTAmount;
      await dexHedge.connect(trader2).swap(0, amountIn, 0, [usdt.address, wbnb.address], Math.floor(Date.now()/1000)+60);
      endWBnbAmount = await wbnb.balanceOf(dexHedge.address);
      endUSDTAmount = await usdt.balanceOf(dexHedge.address);
      console.log("endWBnbAmount:", endWBnbAmount.toString());
      console.log("endUSDTAmount:", endUSDTAmount.toString());
      expect(beginUSDTAmount.sub(endUSDTAmount)).eq(amountIn);
      expect(endWBnbAmount.sub(beginWBnbAmount)).eq(amountIn.div(2));
    });

    it("withdraw", async function() {
      await dexHedge.connect(deployer).addDex(swapRouter.address);
      await dexHedge.connect(deployer).setTrader(wbnb.address, await trader1.getAddress(), true);
      await dexHedge.connect(deployer).setTrader(usdt.address, await trader2.getAddress(), true);
      await wbnb.connect(deployer).transfer(swapRouter.address, ETHER1.mul(10000));
      await wbnb.connect(deployer).transfer(dexHedge.address, ETHER1.mul(10000));
      await usdt.connect(deployer).transfer(swapRouter.address, ETHER1.mul(10000));
      await usdt.connect(deployer).transfer(dexHedge.address, ETHER1.mul(10000));
      await deployer.sendTransaction({to:dexHedge.address, value:ETHER1.mul(100)});
      console.log("dexHedge.balance:", ethers.utils.formatEther(await ethers.provider.getBalance(dexHedge.address)));

      // withdraw BNB
      expect(dexHedge.connect(candidate).withdraw(ZERO_ASSRESS, await candidate.getAddress(), ETHER1)).revertedWith("Ownable: caller is not the owner");

      let beginReceiverBnbBalance = await trader1.getBalance();
      let beginDexHedgeBnbBalance = await ethers.provider.getBalance(dexHedge.address);
      await dexHedge.connect(deployer).withdraw(ZERO_ASSRESS, await trader1.getAddress(), ETHER1);
      let endReceiverBnbBalance = await trader1.getBalance();
      let endDexHedgeBnbBalance = await ethers.provider.getBalance(dexHedge.address);
      console.log("beginReceiverBnbBalance:", ethers.utils.formatEther(beginReceiverBnbBalance));
      console.log("beginDexHedgeBnbBalance:", ethers.utils.formatEther(beginDexHedgeBnbBalance));
      console.log("endReceiverBnbBalance:", ethers.utils.formatEther(endReceiverBnbBalance));
      console.log("endDexHedgeBnbBalance:", ethers.utils.formatEther(endDexHedgeBnbBalance));
      expect(beginDexHedgeBnbBalance.sub(endDexHedgeBnbBalance)).eq(ETHER1);
      expect(endReceiverBnbBalance.sub(beginReceiverBnbBalance)).eq(ETHER1);

      // withdraw token
      expect(dexHedge.connect(candidate).withdraw(usdt.address, await trader1.getAddress(), ETHER1)).revertedWith("Ownable: caller is not the owner");
      let beginReceiverUsdtBalance = await usdt.balanceOf(await trader1.getAddress());
      let beginDexHedgeUsdtBalance = await usdt.balanceOf(dexHedge.address);
      await dexHedge.connect(deployer).withdraw(usdt.address, await trader1.getAddress(), ETHER1);
      let endReceiverUsdtBalance = await usdt.balanceOf(await trader1.getAddress());
      let endDexHedgeUsdtBalance = await usdt.balanceOf(dexHedge.address);
      console.log("beginReceiverUsdtBalance:", ethers.utils.formatEther(beginReceiverUsdtBalance));
      console.log("beginDexHedgeUsdtBalance:", ethers.utils.formatEther(beginDexHedgeUsdtBalance));
      console.log("endReceiverUsdtBalance:", ethers.utils.formatEther(endReceiverUsdtBalance));
      console.log("endDexHedgeUsdtBalance:", ethers.utils.formatEther(endDexHedgeUsdtBalance));
      expect(beginDexHedgeUsdtBalance.sub(endDexHedgeUsdtBalance)).eq(ETHER1);
      expect(endReceiverUsdtBalance.sub(beginReceiverUsdtBalance)).eq(ETHER1);
    });

  });
});
