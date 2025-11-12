require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // Enable IR-based code generation to handle stack too deep
    },
  },
  networks: {
    hardhat: {
      forking: {
        url: process.env.ALCHEMY_MAINNET_URL || "",
        // Only enable forking if we have a valid API key (not placeholder)
        enabled: !!process.env.ALCHEMY_MAINNET_URL && 
                 !process.env.ALCHEMY_MAINNET_URL.includes("YOUR_API_KEY") &&
                 process.env.ALCHEMY_MAINNET_URL.length > 50, // Basic validation
        // Optional: fork from a specific block for consistency
        // blockNumber: 18500000,
      },
      chainId: 31337,
      // Gas settings for better testing
      gas: 12000000,
      blockGasLimit: 12000000,
      // Allow unlimited contract size for complex contracts
      allowUnlimitedContractSize: true,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      // Gas settings
      gas: 12000000,
      blockGasLimit: 12000000,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  // Gas reporter (optional, for gas optimization analysis)
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};

