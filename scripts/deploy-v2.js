const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy TrustlessArbitrageBotV2
  console.log("\nDeploying TrustlessArbitrageBotV2...");
  const BotV2 = await hre.ethers.getContractFactory("TrustlessArbitrageBotV2");
  const botV2 = await BotV2.deploy();
  await botV2.waitForDeployment();

  const botV2Address = await botV2.getAddress();
  console.log("TrustlessArbitrageBotV2 deployed to:", botV2Address);

  // Verify deployment
  console.log("\nVerifying deployment...");
  const code = await hre.ethers.provider.getCode(botV2Address);
  if (code === "0x") {
    throw new Error("Contract deployment failed - no code at address");
  }
  console.log("✓ Contract deployed successfully");

  // Display contract info
  console.log("\n=== Deployment Summary ===");
  console.log("Contract Address:", botV2Address);
  console.log("Deployer Address:", deployer.address);
  console.log("Network:", hre.network.name);
  console.log("Chain ID:", (await hre.ethers.provider.getNetwork()).chainId.toString());
  
  // Display V2 features
  console.log("\n=== V2 Features ===");
  console.log("✓ Triangle arbitrage support (3-leg routes)");
  console.log("✓ Expanded token support (LINK, UNI, AAVE)");
  console.log("✓ Optimized gas costs");
  console.log("✓ Lower profit threshold");
  console.log("✓ Increased trade limits");
  console.log("✓ Enhanced opportunity finding");
  
  console.log("\n=== Next Steps ===");
  console.log("1. Save the contract address above");
  console.log("2. Use it in scripts/interact.js or Hardhat console");
  console.log("3. Example console command:");
  console.log(`   const bot = await ethers.getContractAt("TrustlessArbitrageBotV2", "${botV2Address}");`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

