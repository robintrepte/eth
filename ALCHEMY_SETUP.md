# Alchemy API Key Setup - Quick Guide

## Step 1: Create an App
1. After logging into Alchemy, you should see a dashboard
2. Click **"Create App"** or **"Create New App"** button
3. Fill in:
   - **App Name**: `Arbitrage Bot` (or any name you like)
   - **Chain**: `Ethereum`
   - **Network**: `Ethereum Mainnet`
4. Click **"Create App"**

## Step 2: Get Your API Key
1. Click on your newly created app
2. You'll see an **"API Key"** section
3. Click **"View Key"** or **"Copy"** button
4. The key will look like: `https://eth-mainnet.g.alchemy.com/v2/abc123def456...`

## Step 3: Update Your .env File
1. Open the `.env` file in the project root
2. Replace the placeholder with your actual key:
   ```
   ALCHEMY_MAINNET_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ACTUAL_KEY_HERE
   ```
3. Save the file

## Step 4: Restart
Run `npm start` again to restart with mainnet fork enabled!

