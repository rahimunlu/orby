import { expect } from "chai";
import { ethers } from "hardhat";
import { FestivalFactory, FestivalToken, FestivalVault, MockUSDT } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

/**
 * **Feature: ethereum-sepolia-wallet, Property 3: Factory Deployment Creates Valid Contract Pair**
 * **Validates: Requirements 2.1, 2.3, 2.4**
 * 
 * *For any* valid festival parameters (name, symbol, startTime, endTime), calling
 * FestivalFactory.createFestival() SHALL:
 * - Deploy a FestivalToken contract with the specified name and symbol
 * - Deploy a FestivalVault contract linked to the token
 * - Transfer token ownership to the vault
 * - Emit a FestivalCreated event with the correct addresses
 */
describe("FestivalFactory", function () {
  let usdt: MockUSDT;
  let factory: FestivalFactory;
  let owner: HardhatEthersSigner;

  const ONE_DAY = 24 * 60 * 60;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    const MockUSDTFactory = await ethers.getContractFactory("MockUSDT");
    usdt = await MockUSDTFactory.deploy();
    await usdt.waitForDeployment();

    const FestivalFactoryFactory = await ethers.getContractFactory("FestivalFactory");
    factory = await FestivalFactoryFactory.deploy(await usdt.getAddress());
    await factory.waitForDeployment();
  });

  describe("Property 3: Factory Deployment Creates Valid Contract Pair", function () {
    it("creates token with correct name and symbol", async function () {
      const now = await time.latest();
      const tx = await factory.createFestival("Test Festival", "TFEST", now, now + ONE_DAY);
      const receipt = await tx.wait();
      
      // Get token address from event
      const event = receipt?.logs.find(
        (log) => factory.interface.parseLog(log as any)?.name === "FestivalCreated"
      );
      const parsedEvent = factory.interface.parseLog(event as any);
      const tokenAddress = parsedEvent?.args.token;
      
      const token = await ethers.getContractAt("FestivalToken", tokenAddress);
      expect(await token.name()).to.equal("Test Festival");
      expect(await token.symbol()).to.equal("TFEST");
    });

    it("creates vault linked to token", async function () {
      const now = await time.latest();
      const tx = await factory.createFestival("Test Festival", "TFEST", now, now + ONE_DAY);
      const receipt = await tx.wait();
      
      const event = receipt?.logs.find(
        (log) => factory.interface.parseLog(log as any)?.name === "FestivalCreated"
      );
      const parsedEvent = factory.interface.parseLog(event as any);
      const tokenAddress = parsedEvent?.args.token;
      const vaultAddress = parsedEvent?.args.vault;
      
      const vault = await ethers.getContractAt("FestivalVault", vaultAddress);
      expect(await vault.token()).to.equal(tokenAddress);
      expect(await vault.usdt()).to.equal(await usdt.getAddress());
    });

    it("transfers token ownership to vault", async function () {
      const now = await time.latest();
      const tx = await factory.createFestival("Test Festival", "TFEST", now, now + ONE_DAY);
      const receipt = await tx.wait();
      
      const event = receipt?.logs.find(
        (log) => factory.interface.parseLog(log as any)?.name === "FestivalCreated"
      );
      const parsedEvent = factory.interface.parseLog(event as any);
      const tokenAddress = parsedEvent?.args.token;
      const vaultAddress = parsedEvent?.args.vault;
      
      const token = await ethers.getContractAt("FestivalToken", tokenAddress);
      expect(await token.owner()).to.equal(vaultAddress);
    });

    it("emits FestivalCreated event with correct data", async function () {
      const now = await time.latest();
      
      await expect(factory.createFestival("Test Festival", "TFEST", now, now + ONE_DAY))
        .to.emit(factory, "FestivalCreated")
        .withArgs(
          (tokenAddr: string) => ethers.isAddress(tokenAddr),
          (vaultAddr: string) => ethers.isAddress(vaultAddr),
          "Test Festival",
          "TFEST"
        );
    });

    it("property: for any valid parameters, creates valid contract pair", async function () {
      const testCases = [
        { name: "Festival A", symbol: "FA", durationDays: 1 },
        { name: "Summer Fest 2024", symbol: "SF24", durationDays: 3 },
        { name: "Music Festival", symbol: "MF", durationDays: 7 },
        { name: "Weekend Party", symbol: "WP", durationDays: 2 },
        { name: "Annual Event", symbol: "AE", durationDays: 14 },
      ];

      for (const testCase of testCases) {
        // Deploy fresh factory for each test
        const FestivalFactoryFactory = await ethers.getContractFactory("FestivalFactory");
        const freshFactory = await FestivalFactoryFactory.deploy(await usdt.getAddress());
        
        const now = await time.latest();
        const startTime = now;
        const endTime = now + ONE_DAY * testCase.durationDays;
        
        const tx = await freshFactory.createFestival(
          testCase.name,
          testCase.symbol,
          startTime,
          endTime
        );
        const receipt = await tx.wait();
        
        const event = receipt?.logs.find(
          (log) => freshFactory.interface.parseLog(log as any)?.name === "FestivalCreated"
        );
        const parsedEvent = freshFactory.interface.parseLog(event as any);
        const tokenAddress = parsedEvent?.args.token;
        const vaultAddress = parsedEvent?.args.vault;
        
        // Verify token
        const token = await ethers.getContractAt("FestivalToken", tokenAddress);
        expect(await token.name()).to.equal(testCase.name);
        expect(await token.symbol()).to.equal(testCase.symbol);
        expect(await token.owner()).to.equal(vaultAddress);
        
        // Verify vault
        const vault = await ethers.getContractAt("FestivalVault", vaultAddress);
        expect(await vault.token()).to.equal(tokenAddress);
        expect(await vault.usdt()).to.equal(await usdt.getAddress());
        expect(await vault.festivalStart()).to.equal(startTime);
        expect(await vault.festivalEnd()).to.equal(endTime);
      }
    });

    it("vault can mint and burn tokens after ownership transfer", async function () {
      const now = await time.latest();
      const tx = await factory.createFestival("Test Festival", "TFEST", now, now + ONE_DAY * 3);
      const receipt = await tx.wait();
      
      const event = receipt?.logs.find(
        (log) => factory.interface.parseLog(log as any)?.name === "FestivalCreated"
      );
      const parsedEvent = factory.interface.parseLog(event as any);
      const tokenAddress = parsedEvent?.args.token;
      const vaultAddress = parsedEvent?.args.vault;
      
      const vault = await ethers.getContractAt("FestivalVault", vaultAddress) as FestivalVault;
      const token = await ethers.getContractAt("FestivalToken", tokenAddress) as FestivalToken;
      
      // Mint USDT to user and approve vault
      await usdt.mint(owner.address, ethers.parseUnits("100", 6));
      await usdt.approve(vaultAddress, ethers.parseUnits("100", 6));
      
      // Deposit should work (vault mints tokens)
      await vault.deposit(ethers.parseUnits("100", 6));
      expect(await token.balanceOf(owner.address)).to.equal(ethers.parseUnits("100", 18));
      
      // Enable redemption and withdraw (vault burns tokens)
      await vault.setRedemptionOpen(true);
      await vault.withdraw(ethers.parseUnits("100", 18));
      expect(await token.balanceOf(owner.address)).to.equal(0);
    });
  });

  describe("Factory Configuration", function () {
    it("stores correct USDT address", async function () {
      expect(await factory.usdt()).to.equal(await usdt.getAddress());
    });
  });
});
