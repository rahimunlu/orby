import { expect } from "chai";
import { ethers } from "hardhat";
import { FestivalToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * **Feature: ethereum-sepolia-wallet, Property 4: Token Mint/Burn Access Control**
 * **Validates: Requirements 2.2**
 * 
 * *For any* address that is not the FestivalToken owner, calling mint() or burn() 
 * SHALL revert with an access control error.
 */
describe("FestivalToken", function () {
  let token: FestivalToken;
  let owner: HardhatEthersSigner;
  let nonOwner: HardhatEthersSigner;
  let recipient: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, nonOwner, recipient] = await ethers.getSigners();
    
    const FestivalTokenFactory = await ethers.getContractFactory("FestivalToken");
    token = await FestivalTokenFactory.deploy("Festival Token", "FEST", owner.address);
    await token.waitForDeployment();
  });

  describe("Property 4: Token Mint/Burn Access Control", function () {
    it("owner can mint tokens", async function () {
      const amount = ethers.parseEther("100");
      await expect(token.connect(owner).mint(recipient.address, amount))
        .to.not.be.reverted;
      
      expect(await token.balanceOf(recipient.address)).to.equal(amount);
    });

    it("owner can burn tokens", async function () {
      const amount = ethers.parseEther("100");
      await token.connect(owner).mint(recipient.address, amount);
      
      await expect(token.connect(owner).burn(recipient.address, amount))
        .to.not.be.reverted;
      
      expect(await token.balanceOf(recipient.address)).to.equal(0);
    });

    it("non-owner cannot mint tokens", async function () {
      const amount = ethers.parseEther("100");
      
      await expect(token.connect(nonOwner).mint(recipient.address, amount))
        .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
        .withArgs(nonOwner.address);
    });

    it("non-owner cannot burn tokens", async function () {
      const amount = ethers.parseEther("100");
      // First mint some tokens as owner
      await token.connect(owner).mint(recipient.address, amount);
      
      await expect(token.connect(nonOwner).burn(recipient.address, amount))
        .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
        .withArgs(nonOwner.address);
    });

    // Property-based test: For any random non-owner address and any amount,
    // mint and burn should always revert
    it("property: any non-owner address fails to mint for any amount", async function () {
      const signers = await ethers.getSigners();
      const testCases = 10; // Run multiple iterations
      
      for (let i = 0; i < testCases; i++) {
        // Use different non-owner signers (skip index 0 which is owner)
        const signerIndex = (i % (signers.length - 1)) + 1;
        const signer = signers[signerIndex];
        
        // Generate random amounts
        const randomAmount = ethers.parseEther(String(Math.floor(Math.random() * 1000000) + 1));
        
        await expect(token.connect(signer).mint(recipient.address, randomAmount))
          .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
      }
    });

    it("property: any non-owner address fails to burn for any amount", async function () {
      const signers = await ethers.getSigners();
      const testCases = 10;
      
      // Mint some tokens first so there's something to potentially burn
      const initialMint = ethers.parseEther("1000000");
      await token.connect(owner).mint(recipient.address, initialMint);
      
      for (let i = 0; i < testCases; i++) {
        const signerIndex = (i % (signers.length - 1)) + 1;
        const signer = signers[signerIndex];
        
        const randomAmount = ethers.parseEther(String(Math.floor(Math.random() * 1000) + 1));
        
        await expect(token.connect(signer).burn(recipient.address, randomAmount))
          .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
      }
    });
  });

  describe("ERC20 Standard Functions", function () {
    it("has correct name and symbol", async function () {
      expect(await token.name()).to.equal("Festival Token");
      expect(await token.symbol()).to.equal("FEST");
    });

    it("has 18 decimals", async function () {
      expect(await token.decimals()).to.equal(18);
    });
  });
});
