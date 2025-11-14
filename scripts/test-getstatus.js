const { ethers } = require("ethers");

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  
  // Get contract address
  const fs = require("fs");
  const path = require("path");
  const envFile = path.join(__dirname, "../ui/.env.local");
  
  let contractAddress = null;
  if (fs.existsSync(envFile)) {
    const content = fs.readFileSync(envFile, "utf-8");
    const match = content.match(/NEXT_PUBLIC_CONTRACT_ADDRESS=(0x[a-fA-F0-9]{40})/);
    if (match) {
      contractAddress = match[1];
    }
  }
  
  if (!contractAddress) {
    console.log("No contract address found");
    process.exit(1);
  }
  
  console.log("Contract Address:", contractAddress);
  
  // Call GetStatus directly using low-level call
  const iface = new ethers.Interface([
    "function GetStatus() view returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256, bool, uint256)"
  ]);
  
  const data = iface.encodeFunctionData("GetStatus", []);
  const result = await provider.call({
    to: contractAddress,
    data: data
  });
  
  const decoded = iface.decodeFunctionResult("GetStatus", result);
  
  console.log("\nGetStatus result (V2 format - 9 values):");
  console.log("0. contractTotalTrades:", decoded[0].toString());
  console.log("1. contractTotalVolume:", ethers.formatEther(decoded[1]), "ETH");
  console.log("2. contractTotalProfit:", ethers.formatEther(decoded[2]), "ETH");
  console.log("3. contractTriangleArbs:", decoded[3].toString());
  console.log("4. userFlashLoansToday:", decoded[4].toString());
  console.log("5. userRemainingCooldown:", decoded[5].toString());
  console.log("6. userDailyLimit:", decoded[6].toString());
  console.log("7. canTrade:", decoded[7]);
  console.log("8. contractWETHBalance:", ethers.formatEther(decoded[8]), "WETH");
}

main().catch(console.error);

