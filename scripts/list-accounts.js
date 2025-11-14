const { ethers } = require("ethers");

// Hardhat's default accounts (these are deterministic)
// Account #0 is the deployer/operator
const accounts = [
  {
    index: 0,
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  },
  {
    index: 1,
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
  }
];

console.log("Hardhat Test Accounts:\n");
accounts.forEach(acc => {
  console.log(`Account #${acc.index}:`);
  console.log(`  Address: ${acc.address}`);
  console.log(`  Private Key (with 0x): ${acc.privateKey}`);
  console.log(`  Private Key (without 0x): ${acc.privateKey.slice(2)}`);
  console.log("");
});

console.log("💡 Tip: Use Account #0 if you want to be the operator (contract deployer)");

