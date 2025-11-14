const { ethers } = require("ethers");

// The private key you're trying to import
const privateKey = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

console.log("Verifying private key...");
console.log("Private Key:", privateKey);
console.log("Length:", privateKey.length);
console.log("Starts with 0x:", privateKey.startsWith("0x"));

try {
  // Try to create a wallet from it
  const wallet = new ethers.Wallet(privateKey);
  console.log("\n✓ Private key is valid!");
  console.log("Address:", wallet.address);
  console.log("\nTry importing WITHOUT the 0x prefix:");
  console.log(privateKey.slice(2));
} catch (error) {
  console.error("\n✗ Error:", error.message);
}

