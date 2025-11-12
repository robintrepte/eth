const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy TrustlessArbitrageBot
  console.log("\nDeploying TrustlessArbitrageBot...");
  const Bot = await hre.ethers.getContractFactory("TrustlessArbitrageBot");
  const bot = await Bot.deploy();
  await bot.waitForDeployment();

  const botAddress = await bot.getAddress();
  console.log("TrustlessArbitrageBot deployed to:", botAddress);

  // Verify deployment
  console.log("\nVerifying deployment...");
  const code = await hre.ethers.provider.getCode(botAddress);
  if (code === "0x") {
    throw new Error("Contract deployment failed - no code at address");
  }
  console.log("✓ Contract deployed successfully");

  // Display contract info
  console.log("\n=== Deployment Summary ===");
  console.log("Contract Address:", botAddress);
  console.log("Deployer Address:", deployer.address);
  console.log("Network:", hre.network.name);
  console.log("Chain ID:", (await hre.ethers.provider.getNetwork()).chainId.toString());
  
  console.log("\n=== Next Steps ===");
  console.log("1. Save the contract address above");
  console.log("2. Use it in scripts/interact.js or Hardhat console");
  console.log("3. Example console command:");
  console.log(`   const bot = await ethers.getContractAt("TrustlessArbitrageBot", "${botAddress}");`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

