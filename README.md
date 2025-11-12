# TrustlessArbitrageBot - Hardhat Mainnet Fork Testing Environment

A complete local testing environment for the `TrustlessArbitrageBot` smart contract using Hardhat with mainnet fork capabilities. Test and interact with the contract safely using fake ETH without spending real money.

## Prerequisites

- **Node.js** LTS (>=18) - [Download](https://nodejs.org/)
- **Alchemy API Key** - [Get one free](https://www.alchemy.com/) (for mainnet fork)

## Quick Start (One Command!)

### 🚀 Single Command Startup

**Just run one command and everything starts automatically:**

```bash
npm start
```

This single command will:
1. ✅ Compile your contracts
2. ✅ Start the Hardhat node (mainnet fork)
3. ✅ Deploy the contract automatically
4. ✅ Start the Next.js UI dashboard
5. ✅ Open everything at http://localhost:3010

**That's it!** No manual steps needed. The app handles everything.

---

### Manual Setup (Optional)

If you prefer to run things manually or need to configure the environment:

#### 1. Install Dependencies

```bash
npm install
cd ui && npm install && cd ..
```

#### 2. Configure Environment

Create a `.env` file in the project root:

```bash
# .env
ALCHEMY_MAINNET_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY_HERE
```

Replace `YOUR_API_KEY_HERE` with your actual Alchemy API key.

#### 3. Compile Contracts

```bash
npm run compile
```

#### 4. Start Mainnet Fork

In one terminal, start the local Hardhat node with mainnet fork:

```bash
npm run node
```

This will:
- Fork the Ethereum mainnet at the latest block
- Create 20 test accounts, each with 10,000 fake ETH
- Run on `http://127.0.0.1:8545`
- Keep running until you stop it (Ctrl+C)

**Keep this terminal running** - it's your local blockchain!

#### 5. Deploy Contract

In a **new terminal**, deploy the contract:

```bash
npm run deploy
```

This will output the deployed contract address. **Save this address** - you'll need it for interactions.

Example output:
```
TrustlessArbitrageBot deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

#### 6. Interact with Contract

#### Option A: Using the Interaction Script

Set the contract address and run:

```bash
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3 npm run interact
```

#### Option B: Using Hardhat Console

```bash
npm run console
```

Then in the console:

```javascript
const [owner] = await ethers.getSigners();
const bot = await ethers.getContractAt("TrustlessArbitrageBot", "YOUR_CONTRACT_ADDRESS");

// Deposit ETH
await bot.depositETH({ value: ethers.parseEther("10") });

// Check status
const status = await bot.GetStatus();
console.log("WETH Balance:", ethers.formatEther(status.contractWETHBalance));

// Search for opportunities
const opp = await bot.StartNative(ethers.parseEther("1"));
console.log("Opportunity found:", opp.bestOpportunity.isValid);

// Withdraw ETH
await bot.withdrawETH(ethers.parseEther("5"));
```

## Available Scripts

- `npm run compile` - Compile Solidity contracts
- `npm run node` - Start local Hardhat node with mainnet fork
- `npm run deploy` - Deploy contract to localhost
- `npm run interact` - Run interaction examples (requires CONTRACT_ADDRESS)
- `npm run test-arb` - Monitor for arbitrage opportunities (requires CONTRACT_ADDRESS)
- `npm run console` - Open Hardhat console for manual interactions

## Web UI Dashboard

A beautiful Next.js dashboard is available for managing the contract visually!

### 🎯 Using the Dashboard

When you run `npm start`, the dashboard automatically:
- ✅ Detects if Hardhat node is running
- ✅ Shows deployment status
- ✅ Allows one-click contract deployment
- ✅ Auto-configures contract address
- ✅ Provides full contract management

### UI Features

- 🎨 **Modern Dashboard** - Beautiful shadcn/ui interface
- 🚀 **One-Click Deployment** - Deploy contracts directly from the UI
- 🔌 **Wallet Integration** - Connect MetaMask to localhost
- 📊 **Real-time Status** - Live contract metrics
- 💰 **Fund Management** - Easy deposit/withdraw
- 🔍 **Opportunity Search** - Find arbitrage opportunities
- ⚡ **Execute Trades** - One-click arbitrage execution

### Dashboard Tabs

1. **Deploy** - Deploy the contract (if not already deployed)
2. **Manage Funds** - Deposit and withdraw ETH
3. **Find Opportunities** - Search for arbitrage opportunities
4. **Execute Trade** - Execute arbitrage trades (operator only)

See [ui/README.md](./ui/README.md) for detailed UI documentation.

## Contract Functions

### View Functions (No Transaction Required)

- **`GetStatus()`** - Get contract statistics and user status
  ```javascript
  const status = await bot.GetStatus();
  ```

- **`StartNative(uint256 maxAmount)`** - Search for arbitrage opportunities
  ```javascript
  const opp = await bot.StartNative(ethers.parseEther("1"));
  ```

### State-Changing Functions (Require Transaction)

- **`depositETH()`** - Deposit ETH and convert to WETH (operator only)
  ```javascript
  await bot.depositETH({ value: ethers.parseEther("10") });
  ```

- **`withdrawETH(uint256 amount)`** - Withdraw WETH as ETH (operator only)
  ```javascript
  await bot.withdrawETH(ethers.parseEther("5"));
  ```

- **`AutoArbitrage(uint256 maxAmount, uint256 estimatedGasLimit)`** - Execute arbitrage (operator only)
  ```javascript
  await bot.AutoArbitrage(ethers.parseEther("1"), 500000);
  ```

## Project Structure

```
eth/
├── contracts/
│   └── TrustlessArbitrageBot.sol    # Main contract
├── scripts/
│   ├── deploy.js                     # Deployment script
│   ├── interact.js                  # Interaction examples
│   ├── test-arbitrage.js            # Monitoring script
│   └── get-contract-address.js      # Helper script
├── ui/                               # Next.js dashboard (see ui/README.md)
│   ├── app/                          # Next.js app directory
│   ├── components/                  # React components
│   ├── hooks/                        # Custom hooks
│   └── lib/                          # Utilities and config
├── hardhat.config.js                # Hardhat configuration
├── .env                             # Environment variables (create this)
├── .gitignore                       # Git ignore rules
└── README.md                        # This file
```

## How It Works

### Mainnet Fork

When you run `npm run node`, Hardhat:
1. Connects to Ethereum mainnet via Alchemy
2. Creates a local copy of the blockchain state
3. Allows you to interact with real contract addresses (Uniswap, Aave, etc.)
4. All transactions are sandboxed - no real ETH is spent

### Test Accounts

Hardhat provides 20 pre-funded accounts:
- Each account has **10,000 ETH** (fake/test ETH)
- First account (`accounts[0]`) is typically the deployer/operator
- All accounts are available in scripts and console

### Contract Deployment

The contract deploys to your local fork:
- Uses real mainnet contract addresses (Uniswap, Aave, etc.)
- Can interact with real DEX pools and protocols
- All state changes are local and reversible

## Troubleshooting

### "ALCHEMY_MAINNET_URL not set"

Make sure you've created a `.env` file with your Alchemy API key:
```bash
ALCHEMY_MAINNET_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
```

### "Not operator" Error

Only the deployer account is the operator. Make sure you're using the same account that deployed the contract.

### "No opportunity found"

This is **normal**! Arbitrage opportunities are:
- Rare and competitive
- Quickly exploited by bots on mainnet
- Hard to find even with real-time data

The contract is working correctly - there just aren't profitable opportunities at the moment.

### Contract Compilation Errors

If you see compilation errors:
1. Make sure OpenZeppelin contracts are installed: `npm install @openzeppelin/contracts`
2. Try cleaning and recompiling: `npx hardhat clean && npm run compile`

### Fork Connection Issues

If the fork isn't working:
1. Verify your Alchemy API key is correct
2. Check your internet connection
3. Try restarting the Hardhat node

## Important Notes

- **All operations are local** - No real ETH or wallet needed
- **Fork uses live mainnet data** - Token balances, DEX addresses, etc. are real
- **Your actions are sandboxed** - Changes only exist in your local fork
- **Keep `.env` private** - Never commit your API keys to git
- **Gas prices are simulated** - Use realistic values for testing

## Next Steps

1. **Experiment with deposits/withdrawals** - Get familiar with the contract
2. **Monitor for opportunities** - Run `npm run test-arb` to see how the bot searches
3. **Try different token pairs** - Modify the contract or create custom scripts
4. **Test edge cases** - What happens with insufficient balance? Invalid parameters?

## Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js v6 Documentation](https://docs.ethers.org/v6/)
- [Alchemy Documentation](https://docs.alchemy.com/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

## License

MIT

