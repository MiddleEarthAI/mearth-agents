import { IAgentRuntime, Memory, State } from "@elizaos/core";
import { Evaluator } from "./types";
import { TokenState, Transaction } from "../providers/types";

const TOKEN_THRESHOLDS = {
  LOW: 100,
  MEDIUM: 500,
  HIGH: 1000,
};

export const tokenEvaluator: Evaluator = {
  name: "TOKEN_EVALUATOR",
  description:
    "Evaluates token balances, transaction history, and economic strategies",
  similes: ["WEALTH_EVAL", "ECONOMIC_ANALYSIS", "TOKEN_CHECK"],
  alwaysRun: true,
  priority: 3,

  validate: async (runtime: IAgentRuntime, message: Memory) => {
    // try {
    //   const state = await runtime.getState();
    //   return !!state.tokenState;
    // } catch (error) {
    //   console.error("Token evaluation validation error:", error);
    //   return false;
    // }
    return false;
  },

  handler: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    const tokenState = state.tokenState as TokenState;
    if (!tokenState) {
      return {
        type: "TOKEN_EVAL",
        result: "NO_TOKEN_STATE",
        recommendation: "Unable to evaluate token status",
      };
    }

    const analysis = {
      type: "TOKEN_EVAL",
      result: "TOKEN_ANALYZED",
      metrics: {
        currentBalance: tokenState.balance,
        wealthLevel: getWealthLevel(tokenState.balance),
        recentActivity: analyzeRecentTransactions(
          tokenState.recentTransactions
        ),
        netFlow: calculateNetFlow(tokenState.recentTransactions),
        volatility: calculateVolatility(tokenState.recentTransactions),
      },
      recommendations: generateRecommendations(tokenState),
    };

    // // Store analysis in runtime memory
    // await runtime.memoryManager.createMemory({
    //   id: `token-eval-${Date.now()}`,
    //   content: {
    //     text: `Token Analysis Report:\n${JSON.stringify(analysis, null, 2)}`,
    //   },
    //   userId: message.userId,
    //   roomId: message.roomId,
    // });

    return analysis;
  },

  examples: [
    {
      context: "Agent has accumulated significant tokens",
      messages: [
        {
          user: "user1",
          content: { text: "How are our token reserves looking?" },
        },
      ],
      outcome:
        "Identified strong token position and suggested strategic opportunities",
      explanation:
        "High token balance triggered aggressive strategy recommendations",
    },
    {
      context: "Agent experiences token losses from battles",
      messages: [
        {
          user: "user1",
          content: {
            text: "We've lost some battles, what's our token situation?",
          },
        },
      ],
      outcome: "Detected token depletion and recommended recovery strategies",
      explanation: "Recent battle losses triggered defensive recommendations",
    },
  ],
};

function getWealthLevel(balance: number): string {
  if (balance >= TOKEN_THRESHOLDS.HIGH) return "HIGH";
  if (balance >= TOKEN_THRESHOLDS.MEDIUM) return "MEDIUM";
  return "LOW";
}

function analyzeRecentTransactions(transactions: Transaction[]): {
  battleLosses: number;
  battleGains: number;
  allianceActivity: number;
} {
  return transactions.reduce(
    (acc, tx) => ({
      battleLosses:
        acc.battleLosses +
        (tx.type === "BATTLE" && tx.amount < 0 ? Math.abs(tx.amount) : 0),
      battleGains:
        acc.battleGains +
        (tx.type === "BATTLE" && tx.amount > 0 ? tx.amount : 0),
      allianceActivity: acc.allianceActivity + (tx.type === "ALLIANCE" ? 1 : 0),
    }),
    {
      battleLosses: 0,
      battleGains: 0,
      allianceActivity: 0,
    }
  );
}

function calculateNetFlow(transactions: Transaction[]): number {
  return transactions.reduce((sum, tx) => sum + tx.amount, 0);
}

function calculateVolatility(transactions: Transaction[]): number {
  if (transactions.length < 2) return 0;

  const amounts = transactions.map((tx) => tx.amount);
  const mean =
    amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
  const squaredDiffs = amounts.map((amount) => Math.pow(amount - mean, 2));
  return Math.sqrt(
    squaredDiffs.reduce((sum, diff) => sum + diff, 0) / amounts.length
  );
}

function generateRecommendations(tokenState: TokenState): string[] {
  const recommendations: string[] = [];
  const activity = analyzeRecentTransactions(tokenState.recentTransactions);
  const netFlow = calculateNetFlow(tokenState.recentTransactions);

  if (tokenState.balance < TOKEN_THRESHOLDS.LOW) {
    recommendations.push(
      "Critical: Build up token reserves before engaging in battles"
    );
    recommendations.push("Consider forming alliances for protection");
  }

  if (activity.battleLosses > activity.battleGains) {
    recommendations.push(
      "Recent battles have been costly - adopt defensive strategy"
    );
    recommendations.push("Focus on recovery and rebuilding token reserves");
  }

  if (netFlow < 0) {
    recommendations.push(
      "Negative token flow detected - reduce risky engagements"
    );
    recommendations.push(
      "Look for opportunities to gain tokens through alliances"
    );
  }

  if (tokenState.balance >= TOKEN_THRESHOLDS.HIGH) {
    recommendations.push(
      "Strong token position - consider aggressive expansion"
    );
    recommendations.push("Use token advantage to form beneficial alliances");
  }

  return recommendations;
}
