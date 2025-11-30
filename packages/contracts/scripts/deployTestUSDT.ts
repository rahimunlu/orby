import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Deploying TestUSDT to Sepolia...");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH");

  // Deploy TestUSDT
  const TestUSDT = await ethers.getContractFactory("TestUSDT");
  const testUsdt = await TestUSDT.deploy();
  await testUsdt.waitForDeployment();

  const address = await testUsdt.getAddress();
  console.log("\n✅ TestUSDT deployed to:", address);

  // Verify deployment
  const name = await testUsdt.name();
  const symbol = await testUsdt.symbol();
  const decimals = await testUsdt.decimals();
  const totalSupply = await testUsdt.totalSupply();

  console.log("\nToken Info:");
  console.log("  Name:", name);
  console.log("  Symbol:", symbol);
  console.log("  Decimals:", decimals);
  console.log("  Total Supply:", ethers.formatUnits(totalSupply, 6), "USDT");

  // Save address to file
  const outputPath = path.join(__dirname, "..", "testusdt-address.json");
  fs.writeFileSync(
    outputPath,
    JSON.stringify({ address, deployedAt: new Date().toISOString() }, null, 2)
  );
  console.log("\nAddress saved to:", outputPath);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
