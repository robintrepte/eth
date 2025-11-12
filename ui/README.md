# Trustless Arbitrage Bot - UI Dashboard

A beautiful Next.js dashboard with shadcn/ui for managing and controlling the TrustlessArbitrageBot contract.

## Features

- 🎨 **Modern UI** - Built with Next.js, TypeScript, and shadcn/ui
- 🔌 **Wallet Integration** - Connect MetaMask to localhost network
- 📊 **Real-time Status** - Live contract statistics and metrics
- 💰 **Fund Management** - Deposit and withdraw ETH easily
- 🔍 **Opportunity Search** - Find arbitrage opportunities across DEXes
- ⚡ **Execute Trades** - One-click arbitrage execution (operator only)

## Prerequisites

1. **Hardhat Node Running** - The local blockchain must be running:
   ```bash
   cd .. && npm run node
   ```

2. **Contract Deployed** - Deploy the contract and get the address:
   ```bash
   cd .. && npm run deploy
   ```

3. **MetaMask** - Install MetaMask browser extension

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   
   Create a `.env.local` file:
   ```bash
   NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourDeployedContractAddress
   ```

3. **Configure MetaMask for Localhost**
   
   - Open MetaMask
   - Click network dropdown → "Add Network"
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

4. **Import Test Account** (Optional)
   
   When you run `npm run node`, Hardhat displays test accounts with private keys.
   You can import one into MetaMask for testing.

## Running the UI

```bash
npm run dev
```

Open [http://localhost:3010](http://localhost:3010) in your browser.

## Usage

### 1. Connect Wallet

- Click "Connect Wallet" in the top right
- MetaMask will prompt you to connect
- Make sure you're on the "Hardhat Local" network

### 2. View Status

The dashboard automatically displays:
- Contract WETH balance
- Total trades, volume, and profit
- Flash loan usage and cooldown
- Trading availability

### 3. Manage Funds

**Deposit ETH:**
- Enter amount in ETH
- Click "Deposit"
- Approve transaction in MetaMask
- ETH is converted to WETH automatically

**Withdraw ETH:**
- Enter amount in ETH
- Click "Withdraw"
- Approve transaction in MetaMask
- WETH is converted back to ETH

### 4. Search Opportunities

- Enter max amount to search with
- Click "Search Opportunities"
- View results if any opportunities are found
- Note: Finding opportunities is rare and normal

### 5. Execute Arbitrage

**Operator Only:**
- Only the contract deployer can execute
- Enter max amount and gas limit
- Click "Execute Arbitrage"
- The contract will automatically find and execute profitable trades

## Project Structure

```
ui/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Main dashboard page
│   └── globals.css          # Global styles
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── wallet-connect.tsx  # Wallet connection component
│   ├── status-dashboard.tsx # Status display
│   ├── deposit-withdraw.tsx # Fund management
│   ├── opportunity-search.tsx # Opportunity finder
│   └── arbitrage-execute.tsx # Trade execution
├── hooks/
│   └── use-wallet.tsx      # Wallet context hook
├── lib/
│   ├── contract-abi.json   # Contract ABI
│   ├── contract-config.ts  # Configuration
│   └── ethers-utils.ts     # Ethers.js utilities
└── README.md
```

## Troubleshooting

### "Contract address not configured"

Set `NEXT_PUBLIC_CONTRACT_ADDRESS` in `.env.local` file.

### "MetaMask not installed"

Install the MetaMask browser extension.

### "Network not found"

Add the Hardhat Local network to MetaMask (see Setup step 3).

### "Transaction failed"

- Make sure Hardhat node is running
- Check you have enough ETH balance
- Verify you're the operator (for execute functions)
- Check contract address is correct

### "No opportunities found"

This is normal! Arbitrage opportunities are:
- Rare and competitive
- Quickly exploited by bots
- Hard to find even with real-time data

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Tech Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **shadcn/ui** - Beautiful UI components
- **Tailwind CSS** - Styling
- **ethers.js v6** - Blockchain interactions
- **Sonner** - Toast notifications

## License

MIT
