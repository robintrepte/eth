/**
 * Better error handling utilities
 */

export function parseError(error: any): { message: string; suggestion?: string } {
  const errorMessage = error?.message || error?.reason || String(error) || "Unknown error";
  const errorStr = errorMessage.toLowerCase();

  // Common error patterns
  if (errorStr.includes("user rejected") || errorStr.includes("user denied")) {
    return {
      message: "Transaction was cancelled",
      suggestion: "Please approve the transaction in your wallet to continue",
    };
  }

  if (errorStr.includes("insufficient funds") || errorStr.includes("insufficient balance")) {
    return {
      message: "Insufficient balance",
      suggestion: "You don't have enough ETH. Please add funds to your wallet.",
    };
  }

  if (errorStr.includes("not operator") || errorStr.includes("only operator")) {
    return {
      message: "Operator only",
      suggestion: "Only the contract deployer can perform this action. Make sure you're using the deployer account.",
    };
  }

  if (errorStr.includes("network") || errorStr.includes("connection")) {
    return {
      message: "Network error",
      suggestion: "Check your connection and make sure the Hardhat node is running.",
    };
  }

  if (errorStr.includes("gas") || errorStr.includes("out of gas")) {
    return {
      message: "Gas error",
      suggestion: "Transaction failed due to gas issues. Try increasing the gas limit.",
    };
  }

  if (errorStr.includes("slippage")) {
    return {
      message: "Slippage exceeded",
      suggestion: "Price moved too much during the transaction. Try again with a larger amount.",
    };
  }

  if (errorStr.includes("no opportunity found") || errorStr.includes("no profitable")) {
    return {
      message: "No opportunity found",
      suggestion: "This is normal - arbitrage opportunities are rare and competitive.",
    };
  }

  if (errorStr.includes("cooldown")) {
    return {
      message: "Cooldown active",
      suggestion: "Please wait before making another flash loan request.",
    };
  }

  if (errorStr.includes("paused")) {
    return {
      message: "Contract is paused",
      suggestion: "The contract is currently paused. Contact the operator.",
    };
  }

  // Default
  return {
    message: errorMessage,
    suggestion: "Please try again or check the console for more details.",
  };
}

export function formatError(error: any): string {
  const parsed = parseError(error);
  if (parsed.suggestion) {
    return `${parsed.message}\n\n${parsed.suggestion}`;
  }
  return parsed.message;
}

