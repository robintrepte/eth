# TrustlessArbitrageBotV2 - Enhanced Features

## Overview
This is an enhanced version of the TrustlessArbitrageBot contract with significant improvements for better profitability and more opportunities.

## Key Improvements

### 1. **Expanded Token Support** 🪙
- **Original**: 5 tokens (WETH, USDC, USDT, DAI, WBTC)
- **V2**: 8 tokens (added LINK, UNI, AAVE)
- **Impact**: More trading pairs = more arbitrage opportunities

### 2. **Triangle Arbitrage** 🔺
- **New Feature**: 3-leg arbitrage routes (A → B → C → A)
- **Example**: WETH → USDC → DAI → WETH
- **Impact**: Finds opportunities that 2-leg arbitrage misses
- **Toggle**: Can be enabled/disabled via `setTriangleArbEnabled()`

### 3. **Gas Optimization** ⛽
- Reduced base gas costs by ~10%
- Optimized gas estimates for different DEX types
- **Impact**: Lower gas costs = more profitable trades

### 4. **Improved Opportunity Finding** 🔍
- More granular amount testing (5 different amounts vs 3)
- Better algorithm for finding optimal trade sizes
- **Impact**: Finds more profitable opportunities

### 5. **Enhanced Limits** 📈
- Max trade amount: 300 ETH → **500 ETH**
- Daily flash loan limit: 100 → **150**
- Flash loan cooldown: 30s → **20s**
- **Impact**: More trading capacity and flexibility

### 6. **Lower Profit Threshold** 💰
- Minimum profit: 0.001 ETH → **0.0005 ETH**
- **Impact**: Captures smaller but still profitable opportunities

### 7. **Better Tracking** 📊
- Tracks triangle arbitrage trades separately
- Enhanced status function with triangle arb count
- **Impact**: Better analytics and monitoring

## Contract Comparison

| Feature | V1 | V2 |
|---------|----|----|
| Supported Tokens | 5 | 8 |
| Arbitrage Types | 2-leg only | 2-leg + Triangle |
| Max Trade Amount | 300 ETH | 500 ETH |
| Min Profit Threshold | 0.001 ETH | 0.0005 ETH |
| Daily Flash Loans | 100 | 150 |
| Flash Loan Cooldown | 30s | 20s |
| Gas Optimization | Standard | Optimized (~10% better) |

## New Functions

### `StartNative(uint256 maxAmount)`
Enhanced to return triangle arbitrage opportunities:
- Returns `tokenIntermediate` for triangle routes
- Returns `isTriangleArb` flag

### `setTriangleArbEnabled(bool _enabled)`
Toggle triangle arbitrage on/off (operator only)

### `GetStatus()`
Now includes `contractTriangleArbs` count

## Deployment

### Deploy V2 Contract
```bash
npm run deploy:v2
```

Or manually:
```bash
npx hardhat run scripts/deploy-v2.js --network localhost
```

## Usage Example

```javascript
const botV2 = await ethers.getContractAt("TrustlessArbitrageBotV2", contractAddress);

// Search for opportunities (now includes triangle arbitrage)
const result = await botV2.StartNative(ethers.parseEther("1"));
console.log("Triangle arbitrage:", result.bestOpportunity.isTriangleArb);
console.log("Intermediate token:", result.tokenIntermediate);

// Execute arbitrage
await botV2.AutoArbitrage(ethers.parseEther("1"), 600000);

// Check status
const status = await botV2.GetStatus();
console.log("Triangle arbs executed:", status.contractTriangleArbs);
```

## Migration Notes

- V2 is a **separate contract** - original V1 remains unchanged
- Both contracts can coexist on the same network
- V2 uses the same DEX addresses and interfaces
- V2 maintains backward compatibility with V1's core functions

## Expected Impact

1. **More Opportunities**: Triangle arbitrage + more tokens = 2-3x more opportunities
2. **Better Profitability**: Lower thresholds + gas optimization = more profitable trades
3. **Higher Volume**: Increased limits allow for larger trades
4. **Better Analytics**: Separate tracking of triangle arbitrage trades

## Recommendations

1. **Start with V1** to understand the basics
2. **Deploy V2** when ready for enhanced features
3. **Monitor both** to compare performance
4. **Use triangle arbitrage** when market conditions are favorable

## Technical Details

### Triangle Arbitrage Example
```
WETH (1.0) 
  → [Uniswap V2] → USDC (3000)
    → [Sushiswap] → DAI (3000)
      → [Uniswap V3] → WETH (1.01)
        
Profit: 0.01 WETH (1%)
```

### Gas Optimizations
- Reduced base gas: 100k → 90k
- Optimized V3 gas: 180k → 170k
- Optimized Balancer gas: 200k → 190k
- Triangle arb adds ~140k gas per intermediate leg

## Security

- All V1 security features maintained
- Same reentrancy protection
- Same access controls
- Same flash loan protections
- Additional validation for triangle arbitrage routes

## Future Enhancements (Potential)

- Multi-hop arbitrage (4+ legs)
- Cross-chain arbitrage
- MEV protection integration
- Automated execution bot
- Layer 2 deployment

