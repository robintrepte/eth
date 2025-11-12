import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check if Hardhat node is running by making a simple RPC call
    const response = await fetch("http://127.0.0.1:8545", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_blockNumber",
        params: [],
        id: 1,
      }),
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        running: true,
        blockNumber: data.result,
      });
    } else {
      return NextResponse.json({
        running: false,
        error: "Node not responding",
      });
    }
  } catch (error: any) {
    return NextResponse.json({
      running: false,
      error: error.message || "Node not accessible",
    });
  }
}

