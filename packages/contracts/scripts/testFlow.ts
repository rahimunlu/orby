import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Test the complete deposit and withdrawal flow on Sepolia
 * 
 * Requirements: 7.3
 * - Execute deposit and withdrawal cycle
 * - Verify balances after each operation
 */
async function main() {
  // Load config from file or environment
  let tokenAddress = process.env.FESTIVAL_TOKEN_ADDRESS;
  let vaultAddress = process.env.FESTIVAL_VAULT_ADDRESS;

  // Try to load from config file if env vars not set
  const configPath = path.join(__dirname, "..", "festival-config.json");
  if ((!tokenAddress || !vaultAddress) && fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    tokenAddress = tokenAddress || config.tokenAddress;
    vaultAddress = vaultAddress || config.vaultAddress;
  }

  if (!tokenAddress || !vaultAddress) {
    throw new Error(
      "FESTIVAL_TOKEN_ADDRESS and FESTIVAL_VAULT_ADDRESS must be set. Run createFestival first."
    );
  }

  // TestUSDT address from environment or config
  let SEPOLIA_USDT_ADDRESS = process.env.TESTUSDT_ADDRESS;
  if (!SEPOLIA_USDT_ADDRESS && fs.existsSync(configPath)) {
    // Fallback: try testusdt-address.json
    const testusdtPath = path.join(__dirname, "..", "testusdt-address.json");
    if (fs.existsSync(testusdtPath)) {
      const testusdtConfig = JSON.parse(fs.readFileSync(testusdtPath, "utf-8"));
      SEPOLIA_USDT_ADDRESS = testusdtConfig.address;
    }
  }
  if (!SEPOLIA_USDT_ADDRESS) {
    throw new Error("TESTUSDT_ADDRESS must be set in environment or testusdt-address.json must exist.");
  }

  console.log("Testing deposit and withdrawal flow...");
  console.log("Token address:", tokenAddress);
  console.log("Vault address:", vaultAddress);
  console.log("USDT address:", SEPOLIA_USDT_ADDRESS);

  const [user] = await ethers.getSigners();
  console.log("\nUser address:", user.address);

  // Connect to contracts
  const usdt = await ethers.getContractAt("IERC20", SEPOLIA_USDT_ADDRESS);
  const token = await ethers.getContractAt("FestivalToken", tokenAddress);
  const vault = await ethers.getContractAt("FestivalVault", vaultAddress);

  // Test amount: 10 USDT (6 decimals)
  const depositAmount = ethers.parseUnits("10", 6);
  const expectedTokens = ethers.parseUnits("10", 18); // 1:1 ratio with decimal conversion

  console.log("\n📊 Initial Balances:");
  const initialUsdtBalance = await usdt.balanceOf(user.address);
  const initialTokenBalance = await token.balanceOf(user.address);
  const initialEscrowed = await vault.escrowedUSDT(user.address);
  console.log("  USDT:", ethers.formatUnits(initialUsdtBalance, 6));
  console.log("  Festival Tokens:", ethers.formatUnits(initialTokenBalance, 18));
  console.log("  Escrowed USDT:", ethers.formatUnits(initialEscrowed, 6));

  // Check if user has enough USDT
  if (initialUsdtBalance < depositAmount) {
    console.log("\n⚠️  Insufficient USDT balance for test.");
    console.log(`   Need ${ethers.formatUnits(depositAmount, 6)} USDT`);
    console.log(`   Have ${ethers.formatUnits(initialUsdtBalance, 6)} USDT`);
    console.log("\n   Get Sepolia USDT from a faucet or transfer from another account.");
    return;
  }

  // Step 1: Approve USDT spending
  console.log("\n🔐 Step 1: Approving USDT...");
  const approveTx = await usdt.approve(vaultAddress, depositAmount);
  await approveTx.wait();
  console.log("  Approval tx:", approveTx.hash);

  // Step 2: Deposit USDT
  console.log("\n💰 Step 2: Depositing USDT...");
  const depositTx = await vault.deposit(depositAmount);
  await depositTx.wait();
  console.log("  Deposit tx:", depositTx.hash);

  // Verify balances after deposit
  console.log("\n📊 Balances After Deposit:");
  const postDepositUsdtBalance = await usdt.balanceOf(user.address);
  const postDepositTokenBalance = await token.balanceOf(user.address);
  const postDepositEscrowed = await vault.escrowedUSDT(user.address);
  console.log("  USDT:", ethers.formatUnits(postDepositUsdtBalance, 6));
  console.log("  Festival Tokens:", ethers.formatUnits(postDepositTokenBalance, 18));
  console.log("  Escrowed USDT:", ethers.formatUnits(postDepositEscrowed, 6));

  // Verify deposit worked correctly
  const usdtDecrease = initialUsdtBalance - postDepositUsdtBalance;
  const tokenIncrease = postDepositTokenBalance - initialTokenBalance;
  const escrowIncrease = postDepositEscrowed - initialEscrowed;

  console.log("\n✅ Deposit Verification:");
  console.log(`  USDT decreased by: ${ethers.formatUnits(usdtDecrease, 6)} (expected: 10)`);
  console.log(`  Tokens increased by: ${ethers.formatUnits(tokenIncrease, 18)} (expected: 10)`);
  console.log(`  Escrow increased by: ${ethers.formatUnits(escrowIncrease, 6)} (expected: 10)`);

  // Step 3: Enable redemption (as owner)
  console.log("\n🔓 Step 3: Enabling redemption...");
  try {
    const redemptionTx = await vault.setRedemptionOpen(true);
    await redemptionTx.wait();
    console.log("  Redemption enabled tx:", redemptionTx.hash);
  } catch (error) {
    console.log("  Note: Could not enable redemption (may not be owner or already enabled)");
  }

  // Step 4: Withdraw tokens
  console.log("\n💸 Step 4: Withdrawing tokens...");
  const withdrawTx = await vault.withdraw(expectedTokens);
  await withdrawTx.wait();
  console.log("  Withdraw tx:", withdrawTx.hash);

  // Verify balances after withdrawal
  console.log("\n📊 Final Balances:");
  const finalUsdtBalance = await usdt.balanceOf(user.address);
  const finalTokenBalance = await token.balanceOf(user.address);
  const finalEscrowed = await vault.escrowedUSDT(user.address);
  console.log("  USDT:", ethers.formatUnits(finalUsdtBalance, 6));
  console.log("  Festival Tokens:", ethers.formatUnits(finalTokenBalance, 18));
  console.log("  Escrowed USDT:", ethers.formatUnits(finalEscrowed, 6));

  // Verify withdrawal worked correctly
  const usdtRecovered = finalUsdtBalance - postDepositUsdtBalance;
  const tokensBurned = postDepositTokenBalance - finalTokenBalance;
  const escrowDecrease = postDepositEscrowed - finalEscrowed;

  console.log("\n✅ Withdrawal Verification:");
  console.log(`  USDT recovered: ${ethers.formatUnits(usdtRecovered, 6)} (expected: 10)`);
  console.log(`  Tokens burned: ${ethers.formatUnits(tokensBurned, 18)} (expected: 10)`);
  console.log(`  Escrow decreased by: ${ethers.formatUnits(escrowDecrease, 6)} (expected: 10)`);

  // Final summary
  console.log("\n🎉 Test Flow Complete!");
  console.log("  Net USDT change:", ethers.formatUnits(finalUsdtBalance - initialUsdtBalance, 6));
  console.log("  Net Token change:", ethers.formatUnits(finalTokenBalance - initialTokenBalance, 18));

  // Verify escrow invariant
  const vaultUsdtBalance = await usdt.balanceOf(vaultAddress);
  const tokenTotalSupply = await token.totalSupply();
  const expectedSupply = vaultUsdtBalance * BigInt(1e12);
  
  console.log("\n🔒 Escrow Invariant Check:");
  console.log(`  Vault USDT balance: ${ethers.formatUnits(vaultUsdtBalance, 6)}`);
  console.log(`  Token total supply: ${ethers.formatUnits(tokenTotalSupply, 18)}`);
  console.log(`  Invariant holds: ${tokenTotalSupply === expectedSupply ? "✅ YES" : "❌ NO"}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Test flow failed:", error);
    process.exit(1);
  });
