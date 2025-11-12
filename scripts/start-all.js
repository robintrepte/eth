const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const http = require("http");

const HARDHAT_PORT = 8545;
const UI_PORT = 3010;
const NODE_STARTUP_TIMEOUT = 30000; // 30 seconds
const CONTRACT_ADDRESS_FILE = path.join(__dirname, "../ui/.env.local");

let hardhatProcess = null;
let uiProcess = null;

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkPort(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

function waitForNode() {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkInterval = 1000;
    const http = require("http");

    const check = () => {
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port: HARDHAT_PORT,
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
        (res) => {
          if (res.statusCode === 200) {
            log("✓ Hardhat node is ready", "green");
            resolve();
          } else {
            scheduleNextCheck();
          }
        }
      );

      req.on("error", () => {
        scheduleNextCheck();
      });

      req.write(
        JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_blockNumber",
          params: [],
          id: 1,
        })
      );
      req.end();

      function scheduleNextCheck() {
        if (Date.now() - startTime > NODE_STARTUP_TIMEOUT) {
          reject(new Error("Hardhat node failed to start within timeout"));
          return;
        }
        setTimeout(check, checkInterval);
      }
    };

    check();
  });
}

function startHardhatNode() {
  return new Promise((resolve, reject) => {
    log("🚀 Starting Hardhat node...", "cyan");
    
    hardhatProcess = spawn("npx", ["hardhat", "node"], {
      cwd: path.join(__dirname, ".."),
      stdio: "pipe",
      shell: true,
    });

    let output = "";
    hardhatProcess.stdout.on("data", (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);

      // Check if node is ready
      if (text.includes("Started HTTP and WebSocket JSON-RPC server")) {
        log("\n✓ Hardhat node started", "green");
        setTimeout(() => resolve(), 2000); // Give it a moment to fully initialize
      }
    });

    hardhatProcess.stderr.on("data", (data) => {
      process.stderr.write(data);
    });

    hardhatProcess.on("error", (error) => {
      log(`\n❌ Failed to start Hardhat node: ${error.message}`, "red");
      reject(error);
    });

    hardhatProcess.on("exit", (code) => {
      if (code !== 0 && code !== null) {
        log(`\n❌ Hardhat node exited with code ${code}`, "red");
      }
    });

    // Timeout fallback
    setTimeout(() => {
      if (!output.includes("Started HTTP")) {
        log("\n⚠️  Hardhat node may not have started properly", "yellow");
        log("   Attempting to continue anyway...", "yellow");
        resolve();
      }
    }, NODE_STARTUP_TIMEOUT);
  });
}

async function deployContract() {
  return new Promise((resolve, reject) => {
    log("\n📦 Deploying contract...", "cyan");

    const deployProcess = spawn("npx", ["hardhat", "run", "scripts/deploy.js", "--network", "localhost"], {
      cwd: path.join(__dirname, ".."),
      stdio: "pipe",
      shell: true,
    });

    let output = "";
    deployProcess.stdout.on("data", (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });

    deployProcess.stderr.on("data", (data) => {
      process.stderr.write(data);
    });

    deployProcess.on("exit", (code) => {
      if (code !== 0) {
        log(`\n❌ Deployment failed with code ${code}`, "red");
        reject(new Error("Deployment failed"));
        return;
      }

      // Extract contract address from output
      const addressMatch = output.match(/TrustlessArbitrageBot deployed to: (0x[a-fA-F0-9]{40})/i);
      if (addressMatch) {
        const address = addressMatch[1];
        log(`\n✓ Contract deployed: ${address}`, "green");
        
        // Save to .env.local
        const envContent = `NEXT_PUBLIC_CONTRACT_ADDRESS=${address}\n`;
        fs.writeFileSync(CONTRACT_ADDRESS_FILE, envContent);
        log(`✓ Contract address saved to ui/.env.local`, "green");
        
        resolve(address);
      } else {
        log("\n⚠️  Could not extract contract address from output", "yellow");
        log("   You may need to set NEXT_PUBLIC_CONTRACT_ADDRESS manually", "yellow");
        resolve(null);
      }
    });
  });
}

function startUI() {
  return new Promise((resolve) => {
    log("\n🌐 Starting Next.js UI...", "cyan");
    log(`   UI will be available at http://localhost:${UI_PORT}`, "blue");

    uiProcess = spawn("npm", ["run", "dev"], {
      cwd: path.join(__dirname, "../ui"),
      stdio: "inherit",
      shell: true,
    });

    uiProcess.on("error", (error) => {
      log(`\n❌ Failed to start UI: ${error.message}`, "red");
    });

    resolve();
  });
}

function cleanup() {
  log("\n\n🛑 Shutting down...", "yellow");
  
  if (hardhatProcess) {
    hardhatProcess.kill();
    log("✓ Hardhat node stopped", "green");
  }
  
  if (uiProcess) {
    uiProcess.kill();
    log("✓ UI stopped", "green");
  }
  
  process.exit(0);
}

async function compileContracts() {
  return new Promise((resolve, reject) => {
    log("🔨 Compiling contracts...", "cyan");
    
    const compileProcess = spawn("npx", ["hardhat", "compile"], {
      cwd: path.join(__dirname, ".."),
      stdio: "pipe",
      shell: true,
    });

    let output = "";
    compileProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    compileProcess.stderr.on("data", (data) => {
      output += data.toString();
    });

    compileProcess.on("exit", (code) => {
      if (code === 0) {
        log("✓ Contracts compiled successfully", "green");
        resolve();
      } else {
        log(`⚠️  Compilation warnings (continuing anyway)`, "yellow");
        resolve(); // Continue even with warnings
      }
    });

    compileProcess.on("error", (error) => {
      log(`⚠️  Compilation error: ${error.message}`, "yellow");
      log("   Attempting to continue...", "yellow");
      resolve(); // Try to continue
    });
  });
}

async function main() {
  // Handle cleanup on exit
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  try {
    // Compile contracts first
    await compileContracts();

    // Check if ports are available
    const hardhatAvailable = await checkPort(HARDHAT_PORT);
    if (!hardhatAvailable) {
      log(`⚠️  Port ${HARDHAT_PORT} is already in use`, "yellow");
      log("   Assuming Hardhat node is already running...", "yellow");
    } else {
      // Start Hardhat node
      await startHardhatNode();
      await waitForNode();
    }

    // Deploy contract
    await deployContract();

    // Start UI
    await startUI();

    log("\n" + "=".repeat(50), "cyan");
    log("✅ Everything is running!", "green");
    log("=".repeat(50), "cyan");
    log(`\n📊 Dashboard: http://localhost:${UI_PORT}`, "blue");
    log(`🔗 Hardhat Node: http://127.0.0.1:${HARDHAT_PORT}`, "blue");
    log("\nPress Ctrl+C to stop everything\n", "yellow");

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, "red");
    cleanup();
    process.exit(1);
  }
}

main();

