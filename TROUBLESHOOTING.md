# Troubleshooting Guide

## Current Issue: Alchemy API Key

The startup script is failing because the Alchemy API key is either:
1. Not set in `.env` file
2. Invalid or expired
3. Incorrectly formatted

### How to Fix

1. **Get a free Alchemy API key:**
   - Go to https://www.alchemy.com/
   - Sign up for a free account
   - Create a new app
   - Copy your API key

2. **Update your `.env` file:**
   ```bash
   ALCHEMY_MAINNET_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ACTUAL_API_KEY_HERE
   ```
   
   Replace `YOUR_ACTUAL_API_KEY_HERE` with your real API key from Alchemy.

3. **Verify the format:**
   - Should start with `https://eth-mainnet.g.alchemy.com/v2/`
   - Followed by your API key (no spaces, no quotes)
   - No trailing slashes

### Alternative: Run Without Fork (Testing Only)

If you just want to test the UI without mainnet fork, you can temporarily modify `hardhat.config.js` to disable forking:

```javascript
forking: {
  url: process.env.ALCHEMY_MAINNET_URL || "",
  enabled: false, // Disable forking for testing
},
```

Note: This will limit functionality as the contract needs real DEX addresses.

### Test the API Key

You can test if your API key works:

```bash
curl -X POST https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

If you get a 401 error, the key is invalid.

