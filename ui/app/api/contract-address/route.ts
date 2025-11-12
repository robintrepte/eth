import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
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
      contractAddress,
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

