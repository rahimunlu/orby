import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Deploy FestivalFactory to Sepolia
 * 
 * Requirements: 7.1, 7.4
 * - Deploy FestivalFactory to Sepolia and log the contract address
 * - Use TestUSDT address from testusdt-address.json or env
 */
async function main() {
  // Load TestUSDT address from file or env
  let usdtAddress = process.env.TESTUSDT_ADDRESS;
  
  const testusdtPath = path.join(__dirname, "..", "testusdt-address.json");
  if (!usdtAddress && fs.existsSync(testusdtPath)) {
    const config = JSON.parse(fs.readFileSync(testusdtPath, "utf-8"));
    usdtAddress = config.address;
  }

  if (!usdtAddress) {
    throw new Error("TESTUSDT_ADDRESS not found. Run deploy:testusdt first.");
  }

  console.log("Deploying FestivalFactory to Sepolia...");
  console.log("Using USDT address:", usdtAddress);

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH");

  // Deploy FestivalFactory
  const FestivalFactory = await ethers.getContractFactory("FestivalFactory");
  const factory = await FestivalFactory.deploy(usdtAddress);

  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("\n✅ FestivalFactory deployed successfully!");
  console.log("Factory address:", factoryAddress);
  console.log("\nVerify on Etherscan:");
  console.log(`https://sepolia.etherscan.io/address/${factoryAddress}`);

  // Output for easy copy-paste to environment
  console.log("\n📋 Add to your .env file:");
  console.log(`FESTIVAL_FACTORY_ADDRESS=${factoryAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
