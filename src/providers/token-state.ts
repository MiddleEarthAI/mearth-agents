import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";
import { TokenState, Transaction } from "./types";

const tokenStateProvider: Provider = {
  get: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
  ): Promise<string> => {
    try {
      // const tokenState = state?.tokenState as TokenState;
      // if (!tokenState) {
      //     return "No token state available";
      //   }
      const tokenState = {
        balance: Math.random() * 1000,
        recentTransactions: [],
        lastUpdate: new Date().toISOString(),
      };

      // Get recent transactions
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const recentTransactions = tokenState.recentTransactions.filter(
        (tx) => tx.timestamp > oneDayAgo
      );

      // Format token state information
      return `
Token State Information:

Current Balance: ${tokenState.balance} tokens

Recent Transactions (24h):
${recentTransactions
  .map(
    (tx) => `
- Amount: ${tx.amount > 0 ? "+" : ""}${tx.amount} tokens
  Time: ${new Date(tx.timestamp).toLocaleString()}
  Type: ${tx.type}
`
  )
  .join("")}

Last Updated: ${new Date(tokenState.lastUpdate).toLocaleString()}
      `.trim();
    } catch (error) {
      console.error("Token state provider error:", error);
      return "Token state temporarily unavailable";
    }
  },
};

export { tokenStateProvider };
