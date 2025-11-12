const fs = require("fs");
const path = require("path");

// Simple script to get the last deployed contract address from artifacts
// This helps with setting up the UI environment variable

async function main() {
  console.log("Contract Address Helper");
  console.log("======================");
  console.log("\nTo get your contract address:");
  console.log("1. Deploy the contract: npm run deploy");
  console.log("2. Copy the address from the deployment output");
  console.log("3. Set it in ui/.env.local:");
  console.log("   NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourAddress\n");
  
  // Try to read from a deployment log if it exists
  const logPath = path.join(__dirname, "../deployment.log");
  if (fs.existsSync(logPath)) {
    const log = fs.readFileSync(logPath, "utf8");
    const match = log.match(/Deployed at: (0x[a-fA-F0-9]{40})/);
    if (match) {
      console.log("Last deployed address:", match[1]);
      console.log("\nAdd this to ui/.env.local:");
      console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${match[1]}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

