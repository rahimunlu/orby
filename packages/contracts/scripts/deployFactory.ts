import { ethers } from "hardhat";

/**
 * Deploy FestivalFactory to Sepolia
 * 
 * Requirements: 7.1, 7.4
 * - Deploy FestivalFactory to Sepolia and log the contract address
 * - Use the official Sepolia USDT address
 */
async function main() {
  // Sepolia USDT address (as per Requirements 7.4)
  const SEPOLIA_USDT_ADDRESS = "0xaa8e23fb1079ea71e0a56f48a2aa51851d8433d0";

  console.log("Deploying FestivalFactory to Sepolia...");
  console.log("Using USDT address:", SEPOLIA_USDT_ADDRESS);

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH");

  // Deploy FestivalFactory
  const FestivalFactory = await ethers.getContractFactory("FestivalFactory");
  const factory = await FestivalFactory.deploy(SEPOLIA_USDT_ADDRESS);

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
