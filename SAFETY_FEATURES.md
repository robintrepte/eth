# Safety Features - TrustlessArbitrageBotV2

## Overview
The V2 contract includes comprehensive safety features to protect against losses and prevent runaway trading. These features are designed to limit risk while maintaining profitability.

## Safety Features

### 1. **Maximum Loss Per Trade** 🛡️
- **Default**: 1 ETH
- **Purpose**: Prevents a single trade from losing more than the set amount
- **How it works**: Before executing, calculates worst-case loss (gas + trade amount) and blocks if exceeds limit
- **Configurable**: `setMaxLossPerTrade(uint256 _maxLoss)` (max: 10 ETH)

### 2. **Daily Loss Limit** 📊
- **Default**: 5 ETH
- **Purpose**: Prevents accumulating losses over a 24-hour period
- **How it works**: Tracks daily losses per user, blocks trading if limit reached
- **Auto-reset**: Resets every 24 hours
- **Configurable**: `setDailyLossLimit(uint256 _limit)` (max: 50 ETH)

### 3. **Gas Price Limit** ⛽
- **Default**: 200 Gwei
- **Purpose**: Prevents executing trades when gas prices are too high (unprofitable)
- **How it works**: Blocks execution if current gas price exceeds limit
- **Configurable**: `setMaxGasPriceGwei(uint256 _maxGwei)` (max: 1000 Gwei)

### 4. **Trade Cooldown** ⏱️
- **Default**: 10 seconds
- **Purpose**: Prevents rapid-fire trading that could lead to mistakes or excessive gas costs
- **How it works**: Enforces minimum time between trades per user
- **Configurable**: `setMinTimeBetweenTrades(uint256 _seconds)` (max: 3600s = 1 hour)

### 5. **Loss Tracking** 📉
- **Purpose**: Monitors and records all losses for analysis
- **Features**:
  - Tracks total contract losses (`totalLosses`)
  - Tracks daily losses per user (`dailyLosses`)
  - Emits `TradeLossDetected` event when losses occur
  - Included in `GetStatus()` return values

### 6. **Enhanced Profit Verification** ✅
- **Purpose**: Double-checks profit after execution
- **How it works**: 
  - Verifies actual profit > gas costs + minimum threshold
  - Tracks losses if profit < gas costs
  - Reverts if loss exceeds safety limits

## Configuration Functions

All safety limits can be adjusted by the operator:

```solidity
// Set maximum loss per trade (in wei)
setMaxLossPerTrade(1 ether); // 1 ETH

// Set daily loss limit (in wei)
setDailyLossLimit(5 ether); // 5 ETH

// Set maximum gas price (in Gwei)
setMaxGasPriceGwei(200); // 200 Gwei

// Set minimum time between trades (in seconds)
setMinTimeBetweenTrades(10); // 10 seconds
```

## Status Functions

### `getSafetyStatus(address user)`
Returns current safety status for a user:
- `userDailyLoss`: Current daily loss amount
- `userLastTradeTime`: Timestamp of last trade
- `timeUntilNextTrade`: Seconds until next trade allowed
- `canTrade`: Boolean indicating if trading is allowed

### `GetStatus()` (Updated)
Now includes:
- `contractTotalLosses`: Total losses across all trades

## Safety Checks Flow

When `ExecuteArbitrage` is called, the following checks occur **before** execution:

1. ✅ **Gas Price Check**: Current gas price ≤ maxGasPriceGwei
2. ✅ **Cooldown Check**: Enough time passed since last trade
3. ✅ **Daily Loss Reset**: Reset daily losses if new day
4. ✅ **Daily Loss Limit**: Current daily loss < dailyLossLimit
5. ✅ **Max Loss Per Trade**: Estimated worst-case loss ≤ maxLossPerTrade

**After** execution:
- ✅ **Profit Verification**: Actual profit > gas costs + minimum
- ✅ **Loss Tracking**: If loss occurred, track and emit event
- ✅ **Limit Enforcement**: Revert if loss exceeds limits

## Example Scenarios

### Scenario 1: Gas Price Too High
```
Current gas price: 250 Gwei
Max allowed: 200 Gwei
Result: ❌ Trade blocked - "Gas price too high"
```

### Scenario 2: Daily Loss Limit Reached
```
Daily losses: 4.8 ETH
Daily limit: 5 ETH
New trade loss: 0.3 ETH
Total: 5.1 ETH
Result: ❌ Trade blocked - "Daily loss limit exceeded"
```

### Scenario 3: Trade Cooldown Active
```
Last trade: 5 seconds ago
Cooldown: 10 seconds
Result: ❌ Trade blocked - "Trade cooldown active"
Wait: 5 more seconds
```

### Scenario 4: Loss Detected
```
Expected profit: 0.01 ETH
Gas cost: 0.03 ETH
Actual result: Loss of 0.02 ETH
Result: ✅ Trade completes, loss tracked
If loss > maxLossPerTrade: ❌ Revert
```

## Recommended Settings

### Conservative (Low Risk)
```solidity
maxLossPerTrade = 0.5 ether;      // 0.5 ETH per trade
dailyLossLimit = 2 ether;         // 2 ETH per day
maxGasPriceGwei = 100;            // 100 Gwei max
minTimeBetweenTrades = 30;        // 30 seconds
```

### Moderate (Balanced)
```solidity
maxLossPerTrade = 1 ether;        // 1 ETH per trade (default)
dailyLossLimit = 5 ether;         // 5 ETH per day (default)
maxGasPriceGwei = 200;            // 200 Gwei max (default)
minTimeBetweenTrades = 10;        // 10 seconds (default)
```

### Aggressive (Higher Risk)
```solidity
maxLossPerTrade = 5 ether;        // 5 ETH per trade
dailyLossLimit = 20 ether;        // 20 ETH per day
maxGasPriceGwei = 500;            // 500 Gwei max
minTimeBetweenTrades = 5;         // 5 seconds
```

## Events

### `TradeLossDetected`
Emitted when a trade results in a loss:
```solidity
event TradeLossDetected(
    address indexed user,
    uint256 lossAmount,
    uint256 dailyLossTotal
);
```

### `SafetyLimitUpdated`
Emitted when a safety limit is changed:
```solidity
event SafetyLimitUpdated(
    string limitType,
    uint256 newValue
);
```

## Best Practices

1. **Start Conservative**: Begin with low limits and increase gradually
2. **Monitor Losses**: Check `totalLosses` and `dailyLosses` regularly
3. **Adjust Based on Performance**: Increase limits only if consistently profitable
4. **Use Cooldowns**: Prevent emotional or rapid trading decisions
5. **Gas Price Awareness**: Lower gas price limits during high network congestion
6. **Daily Reviews**: Check daily loss totals and adjust limits if needed

## Integration with UI

The UI should:
- Display current safety limits
- Show daily loss tracking
- Warn when approaching limits
- Display time until next trade allowed
- Show total losses in status dashboard

## Emergency Actions

If losses are accumulating:
1. **Pause Contract**: `pause()` - Stops all trading immediately
2. **Lower Limits**: Reduce `maxLossPerTrade` and `dailyLossLimit`
3. **Increase Cooldown**: Set `minTimeBetweenTrades` to higher value
4. **Review Strategy**: Analyze why losses are occurring

## Summary

These safety features provide multiple layers of protection:
- ✅ **Pre-execution checks**: Prevent bad trades before they happen
- ✅ **Post-execution verification**: Track and limit actual losses
- ✅ **Configurable limits**: Adjust based on risk tolerance
- ✅ **Comprehensive tracking**: Monitor all losses for analysis

The contract is now much safer while maintaining the ability to profit from arbitrage opportunities.

