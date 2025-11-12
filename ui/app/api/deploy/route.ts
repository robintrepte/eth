import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

export async function POST() {
  try {
    const projectRoot = path.join(process.cwd(), "..");
    const deployScript = path.join(projectRoot, "scripts", "deploy.js");

    // Check if deploy script exists
    if (!fs.existsSync(deployScript)) {
      return NextResponse.json(
        { error: "Deploy script not found" },
        { status: 404 }
      );
    }

    // Run deployment
    const { stdout, stderr } = await execAsync(
      `npx hardhat run scripts/deploy.js --network localhost`,
      {
        cwd: projectRoot,
        timeout: 60000, // 60 second timeout
      }
    );

    // Extract contract address from output
    const addressMatch = stdout.match(
      /TrustlessArbitrageBot deployed to: (0x[a-fA-F0-9]{40})/i
    );

    if (!addressMatch) {
      return NextResponse.json(
        {
          error: "Could not extract contract address from deployment output",
          output: stdout,
        },
        { status: 500 }
      );
    }

    const contractAddress = addressMatch[1];

    // Save to .env.local
    const envFile = path.join(process.cwd(), ".env.local");
    const envContent = `NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}\n`;
    fs.writeFileSync(envFile, envContent);

    return NextResponse.json({
      success: true,
      contractAddress,
      message: "Contract deployed successfully",
    });
  } catch (error: any) {
    console.error("Deployment error:", error);
    return NextResponse.json(
      {
        error: error.message || "Deployment failed",
        stderr: error.stderr,
        stdout: error.stdout,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Check if contract is already deployed
  const envFile = path.join(process.cwd(), ".env.local");
  let contractAddress = null;

  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, "utf-8");
    const match = envContent.match(/NEXT_PUBLIC_CONTRACT_ADDRESS=(0x[a-fA-F0-9]{40})/);
    if (match) {
      contractAddress = match[1];
    }
  }

  // Also check from environment variable
  if (!contractAddress) {
    contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || null;
  }

  return NextResponse.json({
    deployed: !!contractAddress,
    contractAddress,
  });
}

