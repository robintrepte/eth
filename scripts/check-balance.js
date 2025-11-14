const { ethers } = require("ethers");

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  
  // Get contract address from .env.local
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
    console.log("No contract address found in .env.local");
    process.exit(1);
  }
  
  console.log("Contract Address:", contractAddress);
  
  // WETH address (mainnet)
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  
  // Check WETH balance
  const wethContract = new ethers.Contract(
    WETH,
    ["function balanceOf(address) view returns (uint256)"],
    provider
  );
  
  try {
    const balance = await wethContract.balanceOf(contractAddress);
    console.log("Contract WETH Balance:", ethers.formatEther(balance), "WETH");
    
    // Also check if WETH contract exists
    const code = await provider.getCode(WETH);
    console.log("WETH contract code length:", code.length);
    console.log("WETH contract exists:", code !== "0x" && code.length > 2);
    
    // Check contract's ETH balance
    const ethBalance = await provider.getBalance(contractAddress);
    console.log("Contract ETH Balance:", ethers.formatEther(ethBalance), "ETH");
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);

