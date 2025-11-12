import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const version = body.version || "v1"; // Default to v1 for backward compatibility
    
    const projectRoot = path.join(process.cwd(), "..");
    const deployScript = version === "v2" 
      ? path.join(projectRoot, "scripts", "deploy-v2.js")
      : path.join(projectRoot, "scripts", "deploy.js");

    // Check if deploy script exists
    if (!fs.existsSync(deployScript)) {
      return NextResponse.json(
        { error: `Deploy script not found for ${version}` },
        { status: 404 }
      );
    }

    // Run deployment
    const scriptName = version === "v2" ? "deploy-v2.js" : "deploy.js";
    const { stdout } = await execAsync(
      `npx hardhat run scripts/${scriptName} --network localhost`,
      {
        cwd: projectRoot,
        timeout: 60000, // 60 second timeout
      }
    );

    // Extract contract address from output (supports both V1 and V2)
    const addressMatch = stdout.match(
      /TrustlessArbitrageBot(V2)? deployed to: (0x[a-fA-F0-9]{40})/i
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

    const contractAddress = addressMatch[2] || addressMatch[1];

    // Save to .env.local
    const envFile = path.join(process.cwd(), ".env.local");
    const envContent = `NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}\nNEXT_PUBLIC_CONTRACT_VERSION=${version}\n`;
    fs.writeFileSync(envFile, envContent);

    return NextResponse.json({
      success: true,
      contractAddress,
      version,
      message: `Contract ${version} deployed successfully`,
    });
  } catch (error) {
    console.error("Deployment error:", error);
    const err = error as { message?: string; stderr?: string; stdout?: string };
    return NextResponse.json(
      {
        error: err.message || "Deployment failed",
        stderr: err.stderr,
        stdout: err.stdout,
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

