import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Verify system integrity on Sepolia
 * 
 * Requirements: 8.1, 8.2, 8.3
 * - Check Factory deployment on Sepolia
 * - Check active Festival config
 * - Check Vault USDT balance (Total Escrow)
 * - Check User Token balance
 * - Verify escrow invariant: Vault.usdtBalance == Token.totalSupply / 10^12
 */

interface FestivalConfig {
  name: string;
  symbol: string;
  tokenAddress: string;
  vaultAddress: string;
  factoryAddress: string;
  ownerAddress: string;
  startTime: number;
  endTime: number;
  createdAt: string;
  network: string;
  chainId: number;
}

const DECIMAL_FACTOR = 10n ** 12n;

async function main() {
  console.log("🔍 Orby System Verification Script");
  console.log("===================================\n");

  const [signer] = await ethers.getSigners();
  console.log("Verifier address:", signer.address);

  // Load festival config
  const configPath = path.join(__dirname, "..", "festival-config.json");
  if (!fs.existsSync(configPath)) {
    console.error("❌ Festival config not found at:", configPath);
    console.error("   Run createFestival script first.");
    process.exit(1);
  }

  const config: FestivalConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  console.log("\n📋 Active Festival Configuration:");
  console.log("  Name:", config.name);
  console.log("  Symbol:", config.symbol);
  console.log("  Network:", config.network);
  console.log("  Chain ID:", config.chainId);

  console.log("  Start:", new Date(config.startTime * 1000).toISOString());
  console.log("  End:", new Date(config.endTime * 1000).toISOString());

  let allChecksPass = true;

  // ============================================
  // Check 1: Factory Deployment (Requirement 8.1)
  // ============================================
  console.log("\n🏭 Check 1: Factory Deployment");
  console.log("  Factory address:", config.factoryAddress);
  
  try {
    const factoryCode = await ethers.provider.getCode(config.factoryAddress);
    if (factoryCode === "0x") {
      console.log("  ❌ Factory contract NOT deployed at this address");
      allChecksPass = false;
    } else {
      const factory = await ethers.getContractAt("FestivalFactory", config.factoryAddress);
      const usdtAddress = await factory.usdt();
      console.log("  ✅ Factory deployed");
      console.log("  USDT address:", usdtAddress);
      console.log("  Etherscan: https://sepolia.etherscan.io/address/" + config.factoryAddress);
    }
  } catch (error) {
    console.log("  ❌ Failed to verify factory:", (error as Error).message);
    allChecksPass = false;
  }

  // ============================================
  // Check 2: Token Contract
  // ============================================
  console.log("\n🪙 Check 2: Festival Token Contract");
  console.log("  Token address:", config.tokenAddress);
  
  let tokenTotalSupply = 0n;
  try {
    const tokenCode = await ethers.provider.getCode(config.tokenAddress);
    if (tokenCode === "0x") {
      console.log("  ❌ Token contract NOT deployed at this address");
      allChecksPass = false;
    } else {
      const token = await ethers.getContractAt("FestivalToken", config.tokenAddress);
      const name = await token.name();
      const symbol = await token.symbol();
      tokenTotalSupply = await token.totalSupply();
      const owner = await token.owner();
      
      console.log("  ✅ Token deployed");
      console.log("  Name:", name);
      console.log("  Symbol:", symbol);
      console.log("  Total Supply:", ethers.formatUnits(tokenTotalSupply, 18), "tokens");
      console.log("  Owner (should be Vault):", owner);
      console.log("  Etherscan: https://sepolia.etherscan.io/address/" + config.tokenAddress);
      
      // Verify token owner is the vault
      if (owner.toLowerCase() !== config.vaultAddress.toLowerCase()) {
        console.log("  ⚠️  WARNING: Token owner is NOT the Vault address!");
        allChecksPass = false;
      }
    }
  } catch (error) {
    console.log("  ❌ Failed to verify token:", (error as Error).message);
    allChecksPass = false;
  }


  // ============================================
  // Check 3: Vault Contract & USDT Balance (Requirement 8.2, 8.3)
  // ============================================
  console.log("\n🏦 Check 3: Festival Vault Contract");
  console.log("  Vault address:", config.vaultAddress);
  
  let vaultUsdtBalance = 0n;
  try {
    const vaultCode = await ethers.provider.getCode(config.vaultAddress);
    if (vaultCode === "0x") {
      console.log("  ❌ Vault contract NOT deployed at this address");
      allChecksPass = false;
    } else {
      const vault = await ethers.getContractAt("FestivalVault", config.vaultAddress);
      const usdtAddress = await vault.usdt();
      const tokenAddress = await vault.token();
      const festivalStart = await vault.festivalStart();
      const festivalEnd = await vault.festivalEnd();
      const redemptionOpen = await vault.redemptionOpen();
      const owner = await vault.owner();
      
      console.log("  ✅ Vault deployed");
      console.log("  USDT address:", usdtAddress);
      console.log("  Token address:", tokenAddress);
      console.log("  Festival Start:", new Date(Number(festivalStart) * 1000).toISOString());
      console.log("  Festival End:", new Date(Number(festivalEnd) * 1000).toISOString());
      console.log("  Redemption Open:", redemptionOpen);
      console.log("  Owner:", owner);
      console.log("  Etherscan: https://sepolia.etherscan.io/address/" + config.vaultAddress);
      
      // Get USDT balance of vault (Total Escrow)
      const usdt = await ethers.getContractAt("IERC20", usdtAddress);
      vaultUsdtBalance = await usdt.balanceOf(config.vaultAddress);
      console.log("\n  💰 Total Escrow (Vault USDT Balance):", ethers.formatUnits(vaultUsdtBalance, 6), "USDT");
    }
  } catch (error) {
    console.log("  ❌ Failed to verify vault:", (error as Error).message);
    allChecksPass = false;
  }

  // ============================================
  // Check 4: User Token Balance (Requirement 8.3)
  // ============================================
  console.log("\n👤 Check 4: User Balances");
  
  try {
    const token = await ethers.getContractAt("FestivalToken", config.tokenAddress);
    const vault = await ethers.getContractAt("FestivalVault", config.vaultAddress);
    const usdtAddress = await vault.usdt();
    const usdt = await ethers.getContractAt("IERC20", usdtAddress);
    
    // Check signer's balances
    const userTokenBalance = await token.balanceOf(signer.address);
    const userUsdtBalance = await usdt.balanceOf(signer.address);
    const userEscrowedUSDT = await vault.escrowedUSDT(signer.address);
    
    console.log("  User address:", signer.address);
    console.log("  Festival Token Balance:", ethers.formatUnits(userTokenBalance, 18), config.symbol);
    console.log("  USDT Balance:", ethers.formatUnits(userUsdtBalance, 6), "USDT");
    console.log("  Escrowed USDT in Vault:", ethers.formatUnits(userEscrowedUSDT, 6), "USDT");
    
    // Also check owner balances if different from signer
    if (config.ownerAddress.toLowerCase() !== signer.address.toLowerCase()) {
      const ownerTokenBalance = await token.balanceOf(config.ownerAddress);
      const ownerUsdtBalance = await usdt.balanceOf(config.ownerAddress);
      const ownerEscrowedUSDT = await vault.escrowedUSDT(config.ownerAddress);
      
      console.log("\n  Owner address:", config.ownerAddress);
      console.log("  Festival Token Balance:", ethers.formatUnits(ownerTokenBalance, 18), config.symbol);
      console.log("  USDT Balance:", ethers.formatUnits(ownerUsdtBalance, 6), "USDT");
      console.log("  Escrowed USDT in Vault:", ethers.formatUnits(ownerEscrowedUSDT, 6), "USDT");
    }
  } catch (error) {
    console.log("  ❌ Failed to check user balances:", (error as Error).message);
    allChecksPass = false;
  }


  // ============================================
  // Check 5: Escrow Invariant (Requirement 8.2)
  // Vault.usdtBalance == Token.totalSupply / 10^12
  // ============================================
  console.log("\n🔐 Check 5: Escrow Invariant (1:1 Backing)");
  console.log("  Invariant: Vault USDT Balance * 10^12 == Token Total Supply");
  
  const expectedTokenSupply = vaultUsdtBalance * DECIMAL_FACTOR;
  const invariantHolds = expectedTokenSupply === tokenTotalSupply;
  
  console.log("  Vault USDT Balance:", ethers.formatUnits(vaultUsdtBalance, 6), "USDT");
  console.log("  Token Total Supply:", ethers.formatUnits(tokenTotalSupply, 18), "tokens");
  console.log("  Expected Token Supply (USDT * 10^12):", ethers.formatUnits(expectedTokenSupply, 18), "tokens");
  
  if (invariantHolds) {
    console.log("  ✅ ESCROW INVARIANT HOLDS - All tokens are 1:1 backed by USDT");
  } else {
    console.log("  ❌ ESCROW INVARIANT VIOLATED!");
    console.log("     Difference:", ethers.formatUnits(tokenTotalSupply - expectedTokenSupply, 18), "tokens");
    allChecksPass = false;
  }

  // ============================================
  // Summary
  // ============================================
  console.log("\n===================================");
  console.log("📊 VERIFICATION SUMMARY");
  console.log("===================================");
  
  if (allChecksPass) {
    console.log("✅ All system checks PASSED");
    console.log("\nSystem is operating correctly with:");
    console.log("  - Factory deployed and functional");
    console.log("  - Token and Vault contracts properly linked");
    console.log("  - Escrow invariant maintained (1:1 USDT backing)");
  } else {
    console.log("❌ Some system checks FAILED");
    console.log("\nPlease review the errors above and take corrective action.");
  }

  console.log("\n🔗 Quick Links:");
  console.log("  Factory: https://sepolia.etherscan.io/address/" + config.factoryAddress);
  console.log("  Token:   https://sepolia.etherscan.io/address/" + config.tokenAddress);
  console.log("  Vault:   https://sepolia.etherscan.io/address/" + config.vaultAddress);

  process.exit(allChecksPass ? 0 : 1);
}

main()
  .then(() => {})
  .catch((error) => {
    console.error("Verification failed with error:", error);
    process.exit(1);
  });
