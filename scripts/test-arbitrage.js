const hre = require("hardhat");

// Contract address - update this after deployment
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";

async function monitorArbitrage() {
  if (!CONTRACT_ADDRESS) {
    console.error("Error: CONTRACT_ADDRESS not set");
    console.log("Usage: CONTRACT_ADDRESS=0x... npx hardhat run scripts/test-arbitrage.js --network localhost");
    process.exit(1);
  }

  const [signer] = await hre.ethers.getSigners();
  const bot = await hre.ethers.getContractAt("TrustlessArbitrageBot", CONTRACT_ADDRESS);
  
  console.log("=== Arbitrage Bot Monitor ===");
  console.log("Contract:", CONTRACT_ADDRESS);
  console.log("Account:", signer.address);
  console.log("Monitoring for opportunities...\n");

  const maxAmount = hre.ethers.parseEther("1.0");
  const checkInterval = 30; // seconds
  let checkCount = 0;
  const maxChecks = 10; // Stop after 10 checks

  async function checkOpportunities() {
    checkCount++;
    console.log(`\n[Check ${checkCount}/${maxChecks}] ${new Date().toLocaleTimeString()}`);
    console.log("─".repeat(50));

    try {
      // Get status
      const status = await bot.GetStatus();
      console.log("Contract WETH Balance:", hre.ethers.formatEther(status.contractWETHBalance), "WETH");
      console.log("Total Trades:", status.contractTotalTrades.toString());
      console.log("Total Profit:", hre.ethers.formatEther(status.contractTotalProfit), "ETH");
      console.log("Can Trade:", status.canTrade);

      // Search for opportunities
      console.log("\nSearching for opportunities...");
      const opportunity = await bot.StartNative(maxAmount);

      if (opportunity.bestOpportunity.isValid) {
        console.log("\n✓ OPPORTUNITY FOUND!");
        console.log("Token Pair:", opportunity.tokenA, "→", opportunity.tokenB);
        console.log("Amount:", hre.ethers.formatEther(opportunity.amount), "ETH");
        console.log("Expected Profit:", hre.ethers.formatEther(opportunity.bestOpportunity.expectedProfit), "ETH");
        console.log("DEX Route:", opportunity.bestOpportunity.dexIn, "→", opportunity.bestOpportunity.dexOut);
        console.log("Gas Estimate:", opportunity.bestOpportunity.gasEstimate.toString());

        // Calculate net profit
        const gasPrice = await hre.ethers.provider.getFeeData();
        const gasCost = gasPrice.gasPrice * opportunity.bestOpportunity.gasEstimate;
        const netProfit = opportunity.bestOpportunity.expectedProfit - gasCost;
        
        console.log("Estimated Gas Cost:", hre.ethers.formatEther(gasCost), "ETH");
        console.log("Net Profit (after gas):", hre.ethers.formatEther(netProfit), "ETH");

        if (netProfit > 0) {
          console.log("\n⚠️  Note: To execute this trade, you would need to:");
          console.log("   1. Be the operator (deployer)");
          console.log("   2. Call AutoArbitrage() with appropriate gas limit");
          console.log("   3. Have sufficient WETH balance or use flash loans");
        }
      } else {
        console.log("✗ No profitable opportunity found");
        console.log("(This is normal - arbitrage opportunities are rare)");
      }

    } catch (error) {
      console.error("Error during check:", error.message);
    }

    if (checkCount < maxChecks) {
      console.log(`\nWaiting ${checkInterval} seconds before next check...`);
      await new Promise(resolve => setTimeout(resolve, checkInterval * 1000));
      return checkOpportunities();
    } else {
      console.log("\n=== Monitoring Complete ===");
      console.log(`Completed ${checkCount} checks`);
    }
  }

  await checkOpportunities();
}

async function main() {
  try {
    await monitorArbitrage();
  } catch (error) {
    console.error("Fatal error:", error);
    process.exitCode = 1;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

