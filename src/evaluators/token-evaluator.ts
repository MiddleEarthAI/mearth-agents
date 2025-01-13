// import { IAgentRuntime, Memory } from "@elizaos/core";
// import { Evaluator } from "./types";
// import {
//   getTokenBalance,
//   TokenProvider,
//   WalletProvider,
// } from "@elizaos/plugin-solana";

// const TOKEN_THRESHOLDS = {
//   LOW: 100,
//   MEDIUM: 500,
//   HIGH: 1000,
// };

// export const tokenEvaluator: Evaluator = {
//   name: "TOKEN_EVALUATOR",
//   description:
//     "Evaluates token balances and transaction history to provide economic insights",
//   similes: ["WEALTH_ADVISOR", "ECONOMIC_ANALYST", "TREASURY_MANAGER"],
//   alwaysRun: true,
//   priority: 2,

//   validate: async (runtime: IAgentRuntime) => {
//     try {
//       const tokenProvider = runtime.getProvider("token") as TokenProvider;
//       return !!tokenProvider;
//     } catch (error) {
//       console.error("Token evaluator validation error:", error);
//       return false;
//     }
//   },

//   handler: async (runtime: IAgentRuntime, message: Memory) => {
//     try {
//       const state = await runtime.getState();
//       const agent = state.currentAgent;
//       if (!agent) throw new Error("No current agent found");

//       const tokenProvider = runtime.getProvider("token") as TokenProvider;
//       const walletProvider = runtime.getProvider("wallet") as WalletProvider;
//       const walletAddress = walletProvider.getWalletAddress(agent.id);

//       // Get current token balance
//       const balance = await getTokenBalance(tokenProvider, walletAddress);

//       // Get recent transactions
//       const transactions = await tokenProvider.getRecentTransactions(
//         walletAddress
//       );

//       // Calculate net token flow
//       const netFlow = transactions.reduce((sum, tx) => sum + tx.amount, 0);

//       // Calculate token volatility (standard deviation of transaction amounts)
//       const amounts = transactions.map((tx) => tx.amount);
//       const mean = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
//       const variance =
//         amounts.reduce((sum, amt) => sum + Math.pow(amt - mean, 2), 0) /
//         amounts.length;
//       const volatility = Math.sqrt(variance);

//       // Generate analysis and recommendations
//       let analysis = "";
//       let recommendations = [];

//       if (balance < TOKEN_THRESHOLDS.LOW) {
//         analysis =
//           "Critical token level. High risk of vulnerability in battles.";
//         recommendations = [
//           "Avoid battles until token reserves are replenished",
//           "Focus on forming defensive alliances",
//           "Consider strategic retreat to safer territories",
//         ];
//       } else if (balance < TOKEN_THRESHOLDS.MEDIUM) {
//         analysis = "Moderate token reserves. Cautious engagement advised.";
//         recommendations = [
//           "Engage in selective battles with favorable odds",
//           "Build alliances to pool resources",
//           "Monitor token flow for opportunities",
//         ];
//       } else {
//         analysis =
//           "Strong token position. Multiple strategic options available.";
//         recommendations = [
//           "Consider aggressive expansion",
//           "Lead alliance formations",
//           "Target high-value territories",
//         ];
//       }

//       // Store analysis in memory
//       await runtime.memoryManager.createMemory({
//         roomId: message.roomId,
//         user: "TOKEN_EVALUATOR",
//         content: {
//           text: `Token Analysis:\n${analysis}\n\nRecommendations:\n${recommendations.join(
//             "\n"
//           )}`,
//           metadata: {
//             balance,
//             netFlow,
//             volatility,
//             riskLevel:
//               balance < TOKEN_THRESHOLDS.LOW
//                 ? "HIGH"
//                 : balance < TOKEN_THRESHOLDS.MEDIUM
//                 ? "MEDIUM"
//                 : "LOW",
//           },
//         },
//       });
//     } catch (error) {
//       console.error("Token evaluator handler error:", error);
//       throw error;
//     }
//   },

//   examples: [
//     {
//       input: {
//         user: "user1",
//         content: { text: "What's my current token status?" },
//       },
//       output: {
//         user: "TOKEN_EVALUATOR",
//         content: {
//           text: "Token Analysis:\nModerate token reserves. Cautious engagement advised.\n\nRecommendations:\n- Engage in selective battles with favorable odds\n- Build alliances to pool resources\n- Monitor token flow for opportunities",
//           metadata: {
//             balance: 300,
//             netFlow: -50,
//             volatility: 25,
//             riskLevel: "MEDIUM",
//           },
//         },
//       },
//     },
//   ],
// };
