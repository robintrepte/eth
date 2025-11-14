const hre = require("hardhat");

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS || "0x2bc0484B5b0FAfFf0a14B858D85E8830621fE0CA";
  
  if (!contractAddress) {
    console.error("Please set CONTRACT_ADDRESS environment variable");
    process.exit(1);
  }

  const contract = await hre.ethers.getContractAt("TrustlessArbitrageBotV2", contractAddress);
  
  console.log("Measuring gas usage for StartNative...");
  console.log("Contract:", contractAddress);
  console.log("");

  const amounts = [
    hre.ethers.parseEther("0.1"),
    hre.ethers.parseEther("0.5"),
    hre.ethers.parseEther("1.0"),
  ];

  for (const amount of amounts) {
    try {
      console.log(`Testing with ${hre.ethers.formatEther(amount)} ETH...`);
      
      // Try to estimate gas
      const gasEstimate = await contract.StartNative.estimateGas(amount);
      console.log(`  Gas estimate: ${gasEstimate.toString()} gas (${(Number(gasEstimate) / 1e6).toFixed(2)}M gas)`);
      
      // Try to call it and measure
      const startTime = Date.now();
      const result = await contract.StartNative(amount);
      const endTime = Date.now();
      
      console.log(`  Success! Took ${endTime - startTime}ms`);
      console.log(`  Found opportunity: ${result.bestOpportunity.isValid}`);
      console.log("");
      
    } catch (error) {
      if (error.message.includes("out of gas")) {
        console.log(`  ❌ Ran out of gas`);
        console.log(`  Error: ${error.message}`);
      } else {
        console.log(`  ❌ Error: ${error.message}`);
      }
      console.log("");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

