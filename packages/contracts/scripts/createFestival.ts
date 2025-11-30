import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Create a new festival using the deployed FestivalFactory
 * 
 * Requirements: 7.2
 * - Connect to deployed Factory
 * - Call createFestival with test parameters
 * - Save Token and Vault addresses to config
 */
async function main() {
  // Get factory address from environment
  const factoryAddress = process.env.FESTIVAL_FACTORY_ADDRESS;
  if (!factoryAddress) {
    throw new Error("FESTIVAL_FACTORY_ADDRESS environment variable not set. Run deployFactory first.");
  }

  console.log("Creating festival via FestivalFactory...");
  console.log("Factory address:", factoryAddress);

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  // Connect to deployed factory
  const factory = await ethers.getContractAt("FestivalFactory", factoryAddress);

  // Festival parameters
  const festivalName = process.env.FESTIVAL_NAME || "Orby Festival Token";
  const festivalSymbol = process.env.FESTIVAL_SYMBOL || "OFT";
  const now = Math.floor(Date.now() / 1000);
  const startTime = process.env.FESTIVAL_START_TIME 
    ? parseInt(process.env.FESTIVAL_START_TIME) 
    : now;
  const endTime = process.env.FESTIVAL_END_TIME 
    ? parseInt(process.env.FESTIVAL_END_TIME) 
    : now + (3 * 24 * 60 * 60); // 3 days from now

  console.log("\nFestival parameters:");
  console.log("  Name:", festivalName);
  console.log("  Symbol:", festivalSymbol);
  console.log("  Start:", new Date(startTime * 1000).toISOString());
  console.log("  End:", new Date(endTime * 1000).toISOString());

  // Create festival
  console.log("\nCreating festival...");
  const tx = await factory.createFestival(festivalName, festivalSymbol, startTime, endTime);
  const receipt = await tx.wait();

  // Parse FestivalCreated event
  const festivalCreatedEvent = receipt?.logs.find((log: { topics: readonly string[]; data: string }) => {
    try {
      const parsed = factory.interface.parseLog({ topics: log.topics as string[], data: log.data });
      return parsed?.name === "FestivalCreated";
    } catch {
      return false;
    }
  });

  if (!festivalCreatedEvent) {
    throw new Error("FestivalCreated event not found in transaction receipt");
  }

  const parsedEvent = factory.interface.parseLog({
    topics: festivalCreatedEvent.topics as string[],
    data: festivalCreatedEvent.data,
  });

  const tokenAddress = parsedEvent?.args[0];
  const vaultAddress = parsedEvent?.args[1];

  console.log("\n✅ Festival created successfully!");
  console.log("Token address:", tokenAddress);
  console.log("Vault address:", vaultAddress);
  console.log("Transaction hash:", receipt?.hash);

  // Save config to file
  const config = {
    name: festivalName,
    symbol: festivalSymbol,
    tokenAddress,
    vaultAddress,
    factoryAddress,
    ownerAddress: deployer.address,
    startTime,
    endTime,
    createdAt: new Date().toISOString(),
    network: "sepolia",
    chainId: 11155111,
  };

  const configPath = path.join(__dirname, "..", "festival-config.json");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("\n📁 Config saved to:", configPath);

  // Output for easy copy-paste
  console.log("\n📋 Add to your .env file:");
  console.log(`FESTIVAL_TOKEN_ADDRESS=${tokenAddress}`);
  console.log(`FESTIVAL_VAULT_ADDRESS=${vaultAddress}`);

  console.log("\n🔗 Verify on Etherscan:");
  console.log(`Token: https://sepolia.etherscan.io/address/${tokenAddress}`);
  console.log(`Vault: https://sepolia.etherscan.io/address/${vaultAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Festival creation failed:", error);
    process.exit(1);
  });
