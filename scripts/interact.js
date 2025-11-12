const hre = require("hardhat");

// Contract address - update this after deployment
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";

async function main() {
  if (!CONTRACT_ADDRESS) {
    console.error("Error: CONTRACT_ADDRESS not set");
    console.log("Usage: CONTRACT_ADDRESS=0x... npx hardhat run scripts/interact.js --network localhost");
    process.exit(1);
  }

  const [signer] = await hre.ethers.getSigners();
  console.log("Interacting with contract using account:", signer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(signer.address)), "ETH");

  // Connect to deployed contract
  const bot = await hre.ethers.getContractAt("TrustlessArbitrageBot", CONTRACT_ADDRESS);
  console.log("\nConnected to contract at:", CONTRACT_ADDRESS);

  try {
    // 1. Get Status
    console.log("\n=== Getting Contract Status ===");
    const status = await bot.GetStatus();
    console.log("Total Trades:", status.contractTotalTrades.toString());
    console.log("Total Volume:", hre.ethers.formatEther(status.contractTotalVolume), "ETH");
    console.log("Total Profit:", hre.ethers.formatEther(status.contractTotalProfit), "ETH");
    console.log("Contract WETH Balance:", hre.ethers.formatEther(status.contractWETHBalance), "WETH");
    console.log("User Flash Loans Today:", status.userFlashLoansToday.toString());
    console.log("Remaining Cooldown:", status.userRemainingCooldown.toString(), "seconds");
    console.log("Daily Limit:", status.userDailyLimit.toString());
    console.log("Can Trade:", status.canTrade);

    // 2. Deposit ETH (only if operator)
    console.log("\n=== Attempting to Deposit ETH ===");
    const depositAmount = hre.ethers.parseEther("1.0"); // 1 ETH
    
    try {
      const tx = await bot.depositETH({ value: depositAmount });
      console.log("Deposit transaction sent:", tx.hash);
      await tx.wait();
      console.log("✓ Successfully deposited", hre.ethers.formatEther(depositAmount), "ETH");
    } catch (error) {
      if (error.message.includes("Not operator")) {
        console.log("⚠ Not the operator - cannot deposit. The deployer is the operator.");
      } else {
        console.error("Deposit error:", error.message);
      }
    }

    // 3. Get Status again after deposit
    console.log("\n=== Status After Deposit ===");
    const statusAfter = await bot.GetStatus();
    console.log("Contract WETH Balance:", hre.ethers.formatEther(statusAfter.contractWETHBalance), "WETH");

    // 4. Try to find an opportunity
    console.log("\n=== Searching for Arbitrage Opportunities ===");
    const maxAmount = hre.ethers.parseEther("0.1"); // 0.1 ETH
    
    try {
      const opportunity = await bot.StartNative(maxAmount);
      console.log("Opportunity found:", opportunity.bestOpportunity.isValid);
      
      if (opportunity.bestOpportunity.isValid) {
        console.log("Token A:", opportunity.tokenA);
        console.log("Token B:", opportunity.tokenB);
        console.log("Amount:", hre.ethers.formatEther(opportunity.amount), "ETH");
        console.log("Expected Profit:", hre.ethers.formatEther(opportunity.bestOpportunity.expectedProfit), "ETH");
        console.log("DEX In:", opportunity.bestOpportunity.dexIn);
        console.log("DEX Out:", opportunity.bestOpportunity.dexOut);
        console.log("Gas Estimate:", opportunity.bestOpportunity.gasEstimate.toString());
      } else {
        console.log("No profitable opportunity found at this time.");
        console.log("(This is normal - arbitrage opportunities are rare and competitive)");
      }
    } catch (error) {
      console.error("Error finding opportunity:", error.message);
    }

    // 5. Withdraw ETH (only if operator and has balance)
    console.log("\n=== Attempting to Withdraw ETH ===");
    const withdrawAmount = hre.ethers.parseEther("0.5"); // 0.5 ETH
    
    try {
      const statusBefore = await bot.GetStatus();
      if (statusBefore.contractWETHBalance >= withdrawAmount) {
        const tx = await bot.withdrawETH(withdrawAmount);
        console.log("Withdraw transaction sent:", tx.hash);
        await tx.wait();
        console.log("✓ Successfully withdrew", hre.ethers.formatEther(withdrawAmount), "ETH");
      } else {
        console.log("⚠ Insufficient balance to withdraw");
      }
    } catch (error) {
      if (error.message.includes("Not operator")) {
        console.log("⚠ Not the operator - cannot withdraw");
      } else {
        console.error("Withdraw error:", error.message);
      }
    }

    // Final status
    console.log("\n=== Final Status ===");
    const finalStatus = await bot.GetStatus();
    console.log("Contract WETH Balance:", hre.ethers.formatEther(finalStatus.contractWETHBalance), "WETH");

  } catch (error) {
    console.error("Error interacting with contract:", error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

