import { expect } from "chai";
import { ethers } from "hardhat";
import { FestivalToken, FestivalVault, MockUSDT } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("FestivalVault", function () {
  let usdt: MockUSDT;
  let token: FestivalToken;
  let vault: FestivalVault;
  let owner: HardhatEthersSigner;
  let user: HardhatEthersSigner;
  let otherUser: HardhatEthersSigner;

  const DECIMAL_FACTOR = 10n ** 12n; // 6 to 18 decimal conversion
  const ONE_DAY = 24 * 60 * 60;

  beforeEach(async function () {
    [owner, user, otherUser] = await ethers.getSigners();

    // Deploy MockUSDT
    const MockUSDTFactory = await ethers.getContractFactory("MockUSDT");
    usdt = await MockUSDTFactory.deploy();
    await usdt.waitForDeployment();

    // Deploy FestivalToken (owner will be vault later)
    const FestivalTokenFactory = await ethers.getContractFactory("FestivalToken");
    token = await FestivalTokenFactory.deploy("Festival Token", "FEST", owner.address);
    await token.waitForDeployment();

    // Deploy FestivalVault
    const now = await time.latest();
    const start = now;
    const end = now + ONE_DAY * 3; // 3 days from now

    const FestivalVaultFactory = await ethers.getContractFactory("FestivalVault");
    vault = await FestivalVaultFactory.deploy(
      await usdt.getAddress(),
      await token.getAddress(),
      start,
      end,
      owner.address
    );
    await vault.waitForDeployment();

    // Transfer token ownership to vault
    await token.connect(owner).transferOwnership(await vault.getAddress());

    // Mint USDT to users for testing
    await usdt.mint(user.address, ethers.parseUnits("10000", 6)); // 10,000 USDT
    await usdt.mint(otherUser.address, ethers.parseUnits("10000", 6));
  });

  /**
   * **Feature: ethereum-sepolia-wallet, Property 5: Deposit Mints Tokens at Correct Ratio**
   * **Validates: Requirements 3.1, 3.2**
   */
  describe("Property 5: Deposit Mints Tokens at Correct Ratio", function () {
    it("deposit transfers correct USDT amount to vault", async function () {
      const depositAmount = ethers.parseUnits("100", 6);
      await usdt.connect(user).approve(await vault.getAddress(), depositAmount);
      
      const vaultBalanceBefore = await usdt.balanceOf(await vault.getAddress());
      await vault.connect(user).deposit(depositAmount);
      const vaultBalanceAfter = await usdt.balanceOf(await vault.getAddress());
      
      expect(vaultBalanceAfter - vaultBalanceBefore).to.equal(depositAmount);
    });

    it("deposit mints tokens at 1:1 ratio with decimal conversion", async function () {
      const depositAmount = ethers.parseUnits("100", 6);
      const expectedTokens = depositAmount * DECIMAL_FACTOR;
      
      await usdt.connect(user).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user).deposit(depositAmount);
      
      expect(await token.balanceOf(user.address)).to.equal(expectedTokens);
    });

    it("deposit updates escrowedUSDT correctly", async function () {
      const depositAmount = ethers.parseUnits("100", 6);
      
      await usdt.connect(user).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user).deposit(depositAmount);
      
      expect(await vault.escrowedUSDT(user.address)).to.equal(depositAmount);
    });

    it("property: for any valid deposit amount, ratio is always 1:10^12", async function () {
      const testAmounts = [1n, 100n, 1_000_000n, 100_000_000n, 1_000_000_000n];

      for (const amount of testAmounts) {
        const MockUSDTFactory = await ethers.getContractFactory("MockUSDT");
        const freshUsdt = await MockUSDTFactory.deploy();
        
        const FestivalTokenFactory = await ethers.getContractFactory("FestivalToken");
        const freshToken = await FestivalTokenFactory.deploy("Test", "TST", owner.address);
        
        const now = await time.latest();
        const FestivalVaultFactory = await ethers.getContractFactory("FestivalVault");
        const freshVault = await FestivalVaultFactory.deploy(
          await freshUsdt.getAddress(),
          await freshToken.getAddress(),
          now,
          now + ONE_DAY,
          owner.address
        );
        
        await freshToken.transferOwnership(await freshVault.getAddress());
        await freshUsdt.mint(user.address, amount);
        await freshUsdt.connect(user).approve(await freshVault.getAddress(), amount);
        
        await freshVault.connect(user).deposit(amount);
        
        const tokenBalance = await freshToken.balanceOf(user.address);
        const expectedTokens = amount * DECIMAL_FACTOR;
        
        expect(tokenBalance).to.equal(expectedTokens);
      }
    });

    it("reverts on zero deposit", async function () {
      await expect(vault.connect(user).deposit(0))
        .to.be.revertedWithCustomError(vault, "InvalidAmount");
    });
  });

  /**
   * **Feature: ethereum-sepolia-wallet, Property 6: Withdrawal Burns Tokens and Returns USDT**
   * **Validates: Requirements 4.1**
   */
  describe("Property 6: Withdrawal Burns Tokens and Returns USDT", function () {
    beforeEach(async function () {
      await vault.connect(owner).setRedemptionOpen(true);
      const depositAmount = ethers.parseUnits("100", 6);
      await usdt.connect(user).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user).deposit(depositAmount);
    });

    it("withdrawal burns correct token amount", async function () {
      const tokenAmount = ethers.parseUnits("50", 18);
      
      const tokenBalanceBefore = await token.balanceOf(user.address);
      await vault.connect(user).withdraw(tokenAmount);
      const tokenBalanceAfter = await token.balanceOf(user.address);
      
      expect(tokenBalanceBefore - tokenBalanceAfter).to.equal(tokenAmount);
    });

    it("withdrawal transfers correct USDT amount", async function () {
      const tokenAmount = ethers.parseUnits("50", 18);
      const expectedUsdt = ethers.parseUnits("50", 6);
      
      const usdtBalanceBefore = await usdt.balanceOf(user.address);
      await vault.connect(user).withdraw(tokenAmount);
      const usdtBalanceAfter = await usdt.balanceOf(user.address);
      
      expect(usdtBalanceAfter - usdtBalanceBefore).to.equal(expectedUsdt);
    });

    it("withdrawal decreases escrowedUSDT correctly", async function () {
      const tokenAmount = ethers.parseUnits("50", 18);
      const expectedUsdtDecrease = ethers.parseUnits("50", 6);
      
      const escrowBefore = await vault.escrowedUSDT(user.address);
      await vault.connect(user).withdraw(tokenAmount);
      const escrowAfter = await vault.escrowedUSDT(user.address);
      
      expect(escrowBefore - escrowAfter).to.equal(expectedUsdtDecrease);
    });

    it("property: for any valid withdrawal, ratio is always 1:10^12 inverse", async function () {
      const testTokenAmounts = [
        ethers.parseUnits("1", 18),
        ethers.parseUnits("10", 18),
        ethers.parseUnits("25", 18),
        ethers.parseUnits("50", 18),
      ];

      for (const tokenAmount of testTokenAmounts) {
        const MockUSDTFactory = await ethers.getContractFactory("MockUSDT");
        const freshUsdt = await MockUSDTFactory.deploy();
        
        const FestivalTokenFactory = await ethers.getContractFactory("FestivalToken");
        const freshToken = await FestivalTokenFactory.deploy("Test", "TST", owner.address);
        
        const now = await time.latest();
        const FestivalVaultFactory = await ethers.getContractFactory("FestivalVault");
        const freshVault = await FestivalVaultFactory.deploy(
          await freshUsdt.getAddress(),
          await freshToken.getAddress(),
          now,
          now + ONE_DAY,
          owner.address
        );
        
        await freshToken.transferOwnership(await freshVault.getAddress());
        
        const depositUsdt = ethers.parseUnits("100", 6);
        await freshUsdt.mint(user.address, depositUsdt);
        await freshUsdt.connect(user).approve(await freshVault.getAddress(), depositUsdt);
        await freshVault.connect(user).deposit(depositUsdt);
        await freshVault.connect(owner).setRedemptionOpen(true);
        
        const usdtBefore = await freshUsdt.balanceOf(user.address);
        const tokenBefore = await freshToken.balanceOf(user.address);
        const escrowBefore = await freshVault.escrowedUSDT(user.address);
        
        await freshVault.connect(user).withdraw(tokenAmount);
        
        const usdtAfter = await freshUsdt.balanceOf(user.address);
        const tokenAfter = await freshToken.balanceOf(user.address);
        const escrowAfter = await freshVault.escrowedUSDT(user.address);
        
        const expectedUsdt = tokenAmount / DECIMAL_FACTOR;
        
        expect(tokenBefore - tokenAfter).to.equal(tokenAmount);
        expect(usdtAfter - usdtBefore).to.equal(expectedUsdt);
        expect(escrowBefore - escrowAfter).to.equal(expectedUsdt);
      }
    });

    it("full withdrawal returns all escrowed USDT", async function () {
      const fullTokenBalance = await token.balanceOf(user.address);
      const escrowedAmount = await vault.escrowedUSDT(user.address);
      
      const usdtBefore = await usdt.balanceOf(user.address);
      await vault.connect(user).withdraw(fullTokenBalance);
      const usdtAfter = await usdt.balanceOf(user.address);
      
      expect(await token.balanceOf(user.address)).to.equal(0);
      expect(await vault.escrowedUSDT(user.address)).to.equal(0);
      expect(usdtAfter - usdtBefore).to.equal(escrowedAmount);
    });

    it("reverts on zero withdrawal", async function () {
      await expect(vault.connect(user).withdraw(0))
        .to.be.revertedWithCustomError(vault, "InvalidAmount");
    });
  });
});


describe("FestivalVault - Redemption Gating", function () {
  let usdt: MockUSDT;
  let token: FestivalToken;
  let vault: FestivalVault;
  let owner: HardhatEthersSigner;
  let user: HardhatEthersSigner;

  const DECIMAL_FACTOR = 10n ** 12n;
  const ONE_DAY = 24 * 60 * 60;

  /**
   * **Feature: ethereum-sepolia-wallet, Property 7: Withdrawal Requires Redemption Open or Festival Ended**
   * **Validates: Requirements 4.2**
   * 
   * *For any* withdrawal attempt where redemptionOpen is false AND block.timestamp < festivalEnd,
   * the FestivalVault.withdraw() function SHALL revert.
   */
  describe("Property 7: Withdrawal Requires Redemption Open or Festival Ended", function () {
    beforeEach(async function () {
      [owner, user] = await ethers.getSigners();

      const MockUSDTFactory = await ethers.getContractFactory("MockUSDT");
      usdt = await MockUSDTFactory.deploy();
      await usdt.waitForDeployment();

      const FestivalTokenFactory = await ethers.getContractFactory("FestivalToken");
      token = await FestivalTokenFactory.deploy("Festival Token", "FEST", owner.address);
      await token.waitForDeployment();

      const now = await time.latest();
      const start = now;
      const end = now + ONE_DAY * 3;

      const FestivalVaultFactory = await ethers.getContractFactory("FestivalVault");
      vault = await FestivalVaultFactory.deploy(
        await usdt.getAddress(),
        await token.getAddress(),
        start,
        end,
        owner.address
      );
      await vault.waitForDeployment();

      await token.connect(owner).transferOwnership(await vault.getAddress());

      // User deposits
      await usdt.mint(user.address, ethers.parseUnits("100", 6));
      await usdt.connect(user).approve(await vault.getAddress(), ethers.parseUnits("100", 6));
      await vault.connect(user).deposit(ethers.parseUnits("100", 6));
    });

    it("reverts withdrawal when redemption closed and festival not ended", async function () {
      // redemptionOpen is false by default, festival hasn't ended
      const tokenAmount = ethers.parseUnits("50", 18);
      
      await expect(vault.connect(user).withdraw(tokenAmount))
        .to.be.revertedWithCustomError(vault, "RedemptionNotOpen");
    });

    it("allows withdrawal when redemption is open", async function () {
      await vault.connect(owner).setRedemptionOpen(true);
      
      const tokenAmount = ethers.parseUnits("50", 18);
      await expect(vault.connect(user).withdraw(tokenAmount)).to.not.be.reverted;
    });

    it("allows withdrawal after festival ends even if redemption closed", async function () {
      // Fast forward past festival end
      await time.increase(ONE_DAY * 4);
      
      const tokenAmount = ethers.parseUnits("50", 18);
      await expect(vault.connect(user).withdraw(tokenAmount)).to.not.be.reverted;
    });

    it("property: for any withdrawal amount, reverts when redemption closed and before end", async function () {
      const testAmounts = [
        ethers.parseUnits("1", 18),
        ethers.parseUnits("10", 18),
        ethers.parseUnits("50", 18),
        ethers.parseUnits("100", 18),
      ];

      for (const amount of testAmounts) {
        // Fresh setup
        const MockUSDTFactory = await ethers.getContractFactory("MockUSDT");
        const freshUsdt = await MockUSDTFactory.deploy();
        
        const FestivalTokenFactory = await ethers.getContractFactory("FestivalToken");
        const freshToken = await FestivalTokenFactory.deploy("Test", "TST", owner.address);
        
        const now = await time.latest();
        const FestivalVaultFactory = await ethers.getContractFactory("FestivalVault");
        const freshVault = await FestivalVaultFactory.deploy(
          await freshUsdt.getAddress(),
          await freshToken.getAddress(),
          now,
          now + ONE_DAY * 10, // Long festival
          owner.address
        );
        
        await freshToken.transferOwnership(await freshVault.getAddress());
        
        await freshUsdt.mint(user.address, ethers.parseUnits("1000", 6));
        await freshUsdt.connect(user).approve(await freshVault.getAddress(), ethers.parseUnits("1000", 6));
        await freshVault.connect(user).deposit(ethers.parseUnits("1000", 6));
        
        // redemptionOpen is false, festival hasn't ended
        await expect(freshVault.connect(user).withdraw(amount))
          .to.be.revertedWithCustomError(freshVault, "RedemptionNotOpen");
      }
    });
  });
});


describe("FestivalVault - Escrow Balance Limit", function () {
  let usdt: MockUSDT;
  let token: FestivalToken;
  let vault: FestivalVault;
  let owner: HardhatEthersSigner;
  let user: HardhatEthersSigner;

  const DECIMAL_FACTOR = 10n ** 12n;
  const ONE_DAY = 24 * 60 * 60;

  /**
   * **Feature: ethereum-sepolia-wallet, Property 8: Withdrawal Limited by Escrowed Balance**
   * **Validates: Requirements 4.3**
   * 
   * *For any* withdrawal attempt where the requested USDT equivalent exceeds the user's
   * escrowedUSDT balance, the FestivalVault.withdraw() function SHALL revert.
   */
  describe("Property 8: Withdrawal Limited by Escrowed Balance", function () {
    beforeEach(async function () {
      [owner, user] = await ethers.getSigners();

      const MockUSDTFactory = await ethers.getContractFactory("MockUSDT");
      usdt = await MockUSDTFactory.deploy();
      await usdt.waitForDeployment();

      const FestivalTokenFactory = await ethers.getContractFactory("FestivalToken");
      token = await FestivalTokenFactory.deploy("Festival Token", "FEST", owner.address);
      await token.waitForDeployment();

      const now = await time.latest();
      const FestivalVaultFactory = await ethers.getContractFactory("FestivalVault");
      vault = await FestivalVaultFactory.deploy(
        await usdt.getAddress(),
        await token.getAddress(),
        now,
        now + ONE_DAY * 3,
        owner.address
      );
      await vault.waitForDeployment();

      await token.connect(owner).transferOwnership(await vault.getAddress());
      await vault.connect(owner).setRedemptionOpen(true);

      // User deposits 100 USDT
      await usdt.mint(user.address, ethers.parseUnits("100", 6));
      await usdt.connect(user).approve(await vault.getAddress(), ethers.parseUnits("100", 6));
      await vault.connect(user).deposit(ethers.parseUnits("100", 6));
    });

    it("reverts when withdrawal exceeds escrowed balance", async function () {
      // User has 100 USDT escrowed, try to withdraw 150 tokens worth
      const excessTokenAmount = ethers.parseUnits("150", 18);
      
      await expect(vault.connect(user).withdraw(excessTokenAmount))
        .to.be.revertedWithCustomError(vault, "InsufficientBalance");
    });

    it("allows withdrawal up to escrowed balance", async function () {
      const fullTokenBalance = await token.balanceOf(user.address);
      await expect(vault.connect(user).withdraw(fullTokenBalance)).to.not.be.reverted;
    });

    it("property: for any amount exceeding escrow, withdrawal reverts", async function () {
      const escrowedAmount = await vault.escrowedUSDT(user.address);
      
      // Test various amounts that exceed the escrowed balance
      const excessAmounts = [
        escrowedAmount + 1n,
        escrowedAmount * 2n,
        escrowedAmount + 1000000n,
      ];

      for (const excessUsdt of excessAmounts) {
        const excessTokens = excessUsdt * DECIMAL_FACTOR;
        
        await expect(vault.connect(user).withdraw(excessTokens))
          .to.be.revertedWithCustomError(vault, "InsufficientBalance");
      }
    });

    it("property: partial withdrawals reduce escrow correctly", async function () {
      const initialEscrow = await vault.escrowedUSDT(user.address);
      
      // Withdraw half
      const halfTokens = ethers.parseUnits("50", 18);
      await vault.connect(user).withdraw(halfTokens);
      
      const remainingEscrow = await vault.escrowedUSDT(user.address);
      expect(remainingEscrow).to.equal(initialEscrow / 2n);
      
      // Now trying to withdraw more than remaining should fail
      const excessTokens = ethers.parseUnits("60", 18);
      await expect(vault.connect(user).withdraw(excessTokens))
        .to.be.revertedWithCustomError(vault, "InsufficientBalance");
    });
  });
});


describe("FestivalVault - Redemption Toggle", function () {
  let vault: FestivalVault;
  let owner: HardhatEthersSigner;
  let nonOwner: HardhatEthersSigner;

  const ONE_DAY = 24 * 60 * 60;

  /**
   * **Feature: ethereum-sepolia-wallet, Property 10: Redemption Status Toggle**
   * **Validates: Requirements 4.5**
   * 
   * *For any* boolean value passed to setRedemptionOpen(), the vault's redemptionOpen
   * state SHALL equal that value after the transaction.
   */
  describe("Property 10: Redemption Status Toggle", function () {
    beforeEach(async function () {
      [owner, nonOwner] = await ethers.getSigners();

      const MockUSDTFactory = await ethers.getContractFactory("MockUSDT");
      const usdt = await MockUSDTFactory.deploy();

      const FestivalTokenFactory = await ethers.getContractFactory("FestivalToken");
      const token = await FestivalTokenFactory.deploy("Festival Token", "FEST", owner.address);

      const now = await time.latest();
      const FestivalVaultFactory = await ethers.getContractFactory("FestivalVault");
      vault = await FestivalVaultFactory.deploy(
        await usdt.getAddress(),
        await token.getAddress(),
        now,
        now + ONE_DAY * 3,
        owner.address
      );
      await vault.waitForDeployment();
    });

    it("redemption starts as false", async function () {
      expect(await vault.redemptionOpen()).to.equal(false);
    });

    it("owner can set redemption to true", async function () {
      await vault.connect(owner).setRedemptionOpen(true);
      expect(await vault.redemptionOpen()).to.equal(true);
    });

    it("owner can set redemption back to false", async function () {
      await vault.connect(owner).setRedemptionOpen(true);
      await vault.connect(owner).setRedemptionOpen(false);
      expect(await vault.redemptionOpen()).to.equal(false);
    });

    it("non-owner cannot toggle redemption", async function () {
      await expect(vault.connect(nonOwner).setRedemptionOpen(true))
        .to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
    });

    it("property: for any boolean value, state equals that value after toggle", async function () {
      const testValues = [true, false, true, true, false, false, true];
      
      for (const value of testValues) {
        await vault.connect(owner).setRedemptionOpen(value);
        expect(await vault.redemptionOpen()).to.equal(value);
      }
    });

    it("emits RedemptionStatusChanged event", async function () {
      await expect(vault.connect(owner).setRedemptionOpen(true))
        .to.emit(vault, "RedemptionStatusChanged")
        .withArgs(true);
      
      await expect(vault.connect(owner).setRedemptionOpen(false))
        .to.emit(vault, "RedemptionStatusChanged")
        .withArgs(false);
    });
  });
});


describe("FestivalVault - Escrow Invariant", function () {
  let usdt: MockUSDT;
  let token: FestivalToken;
  let vault: FestivalVault;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  const DECIMAL_FACTOR = 10n ** 12n;
  const ONE_DAY = 24 * 60 * 60;

  /**
   * **Feature: ethereum-sepolia-wallet, Property 11: Escrow Invariant (1:1 Backing)**
   * **Validates: Requirements 8.2**
   * 
   * *For any* state of the system, the Vault's USDT balance multiplied by 10^12 SHALL
   * equal the FestivalToken's total supply. This ensures every token is backed 1:1 by USDT.
   */
  describe("Property 11: Escrow Invariant (1:1 Backing)", function () {
    beforeEach(async function () {
      [owner, user1, user2] = await ethers.getSigners();

      const MockUSDTFactory = await ethers.getContractFactory("MockUSDT");
      usdt = await MockUSDTFactory.deploy();
      await usdt.waitForDeployment();

      const FestivalTokenFactory = await ethers.getContractFactory("FestivalToken");
      token = await FestivalTokenFactory.deploy("Festival Token", "FEST", owner.address);
      await token.waitForDeployment();

      const now = await time.latest();
      const FestivalVaultFactory = await ethers.getContractFactory("FestivalVault");
      vault = await FestivalVaultFactory.deploy(
        await usdt.getAddress(),
        await token.getAddress(),
        now,
        now + ONE_DAY * 3,
        owner.address
      );
      await vault.waitForDeployment();

      await token.connect(owner).transferOwnership(await vault.getAddress());
      await vault.connect(owner).setRedemptionOpen(true);

      // Mint USDT to users
      await usdt.mint(user1.address, ethers.parseUnits("10000", 6));
      await usdt.mint(user2.address, ethers.parseUnits("10000", 6));
    });

    async function checkInvariant() {
      const vaultUsdtBalance = await usdt.balanceOf(await vault.getAddress());
      const tokenTotalSupply = await token.totalSupply();
      
      // Invariant: vaultUsdtBalance * 10^12 == tokenTotalSupply
      expect(vaultUsdtBalance * DECIMAL_FACTOR).to.equal(tokenTotalSupply);
    }

    it("invariant holds at initial state (zero balances)", async function () {
      await checkInvariant();
    });

    it("invariant holds after single deposit", async function () {
      const depositAmount = ethers.parseUnits("100", 6);
      await usdt.connect(user1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount);
      
      await checkInvariant();
    });

    it("invariant holds after multiple deposits", async function () {
      // User1 deposits
      await usdt.connect(user1).approve(await vault.getAddress(), ethers.parseUnits("500", 6));
      await vault.connect(user1).deposit(ethers.parseUnits("100", 6));
      await checkInvariant();
      
      await vault.connect(user1).deposit(ethers.parseUnits("200", 6));
      await checkInvariant();
      
      // User2 deposits
      await usdt.connect(user2).approve(await vault.getAddress(), ethers.parseUnits("300", 6));
      await vault.connect(user2).deposit(ethers.parseUnits("300", 6));
      await checkInvariant();
    });

    it("invariant holds after withdrawal", async function () {
      // Deposit first
      await usdt.connect(user1).approve(await vault.getAddress(), ethers.parseUnits("100", 6));
      await vault.connect(user1).deposit(ethers.parseUnits("100", 6));
      await checkInvariant();
      
      // Withdraw
      await vault.connect(user1).withdraw(ethers.parseUnits("50", 18));
      await checkInvariant();
    });

    it("invariant holds after full withdrawal", async function () {
      await usdt.connect(user1).approve(await vault.getAddress(), ethers.parseUnits("100", 6));
      await vault.connect(user1).deposit(ethers.parseUnits("100", 6));
      
      const fullBalance = await token.balanceOf(user1.address);
      await vault.connect(user1).withdraw(fullBalance);
      
      await checkInvariant();
      expect(await token.totalSupply()).to.equal(0);
      expect(await usdt.balanceOf(await vault.getAddress())).to.equal(0);
    });

    it("property: invariant holds through any sequence of deposits and withdrawals", async function () {
      // Simulate random sequence of operations
      const operations = [
        { type: "deposit", user: user1, amount: ethers.parseUnits("100", 6) },
        { type: "deposit", user: user2, amount: ethers.parseUnits("250", 6) },
        { type: "deposit", user: user1, amount: ethers.parseUnits("50", 6) },
        { type: "withdraw", user: user1, amount: ethers.parseUnits("75", 18) },
        { type: "deposit", user: user2, amount: ethers.parseUnits("100", 6) },
        { type: "withdraw", user: user2, amount: ethers.parseUnits("200", 18) },
        { type: "withdraw", user: user1, amount: ethers.parseUnits("50", 18) },
      ];

      // Approve enough for all deposits
      await usdt.connect(user1).approve(await vault.getAddress(), ethers.parseUnits("1000", 6));
      await usdt.connect(user2).approve(await vault.getAddress(), ethers.parseUnits("1000", 6));

      for (const op of operations) {
        if (op.type === "deposit") {
          await vault.connect(op.user).deposit(op.amount);
        } else {
          await vault.connect(op.user).withdraw(op.amount);
        }
        
        // Check invariant after each operation
        await checkInvariant();
      }
    });

    it("property: invariant holds with multiple users interleaved", async function () {
      await usdt.connect(user1).approve(await vault.getAddress(), ethers.parseUnits("1000", 6));
      await usdt.connect(user2).approve(await vault.getAddress(), ethers.parseUnits("1000", 6));

      // Interleaved operations
      await vault.connect(user1).deposit(ethers.parseUnits("100", 6));
      await checkInvariant();
      
      await vault.connect(user2).deposit(ethers.parseUnits("200", 6));
      await checkInvariant();
      
      await vault.connect(user1).withdraw(ethers.parseUnits("50", 18));
      await checkInvariant();
      
      await vault.connect(user2).withdraw(ethers.parseUnits("100", 18));
      await checkInvariant();
      
      await vault.connect(user1).deposit(ethers.parseUnits("75", 6));
      await checkInvariant();
    });
  });
});
