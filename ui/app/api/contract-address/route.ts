import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const envFile = path.join(process.cwd(), ".env.local");
    let contractAddress = null;
    let contractVersion = null;

    if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, "utf-8");
      const addressMatch = envContent.match(/NEXT_PUBLIC_CONTRACT_ADDRESS=(0x[a-fA-F0-9]{40})/);
      if (addressMatch) {
        contractAddress = addressMatch[1];
      }
      const versionMatch = envContent.match(/NEXT_PUBLIC_CONTRACT_VERSION=(v[12])/);
      if (versionMatch) {
        contractVersion = versionMatch[1];
      }
    }

    // Also check from environment variables
    if (!contractAddress) {
      contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || null;
    }
    if (!contractVersion) {
      contractVersion = process.env.NEXT_PUBLIC_CONTRACT_VERSION || null;
    }

    return NextResponse.json({
      contractAddress,
      contractVersion,
      configured: !!contractAddress,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

