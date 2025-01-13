// import { IAgentRuntime, Memory } from "@elizaos/core";
// import { Evaluator } from "./types";
// import {
//   getTokenBalance,
//   TokenProvider,
//   WalletProvider,
// } from "@elizaos/plugin-solana";
// import { calculateDistance } from "../actions/movement";
// import { Agent } from "../types";

// const BATTLE_RANGE = 10;
// const TOKEN_RISK_THRESHOLDS = {
//   LOW: 100,
//   MEDIUM: 500,
//   HIGH: 1000,
// };

// export const battleEvaluator: Evaluator = {
//   name: "BATTLE_EVALUATOR",
//   description:
//     "Evaluates battle opportunities and risks based on token balances and positions",
//   similes: ["BATTLE_STRATEGIST", "COMBAT_ADVISOR", "RISK_ASSESSOR"],
//   alwaysRun: true,
//   priority: 3,

//   validate: async (runtime: IAgentRuntime) => {
//     try {
//       const state = await runtime.getState();
//       return !!state.agents && state.agents.length > 1;
//     } catch (error) {
//       console.error("Battle evaluator validation error:", error);
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
//       const agentWallet = walletProvider.getWalletAddress(agent.id);

//       // Get agent's token balance
//       const agentBalance = await getTokenBalance(tokenProvider, agentWallet);

//       // Find nearby agents
//       const nearbyAgents = state.agents?.filter((other) => {
//         if (other.id === agent.id) return false;
//         const distance = calculateDistance(agent.position, other.position);
//         return distance <= BATTLE_RANGE;
//       });

//       if (!nearbyAgents?.length) {
//         await runtime.memoryManager.createMemory({
//           roomId: message.roomId,
//           user: "BATTLE_EVALUATOR",
//           content: {
//             text: "No nearby agents to battle.",
//             metadata: {
//               nearbyAgents: 0,
//               tokenBalance: agentBalance,
//             },
//           },
//         });
//         return;
//       }

//       // Analyze each nearby agent
//       const battleAnalyses = await Promise.all(
//         nearbyAgents.map(async (other) => {
//           const otherWallet = walletProvider.getWalletAddress(other.id);
//           const otherBalance = await getTokenBalance(
//             tokenProvider,
//             otherWallet
//           );
//           const tokenRatio = agentBalance / otherBalance;
//           const distance = calculateDistance(agent.position, other.position);

//           return {
//             agentId: other.id,
//             name: other.name,
//             distance,
//             tokenRatio,
//             riskLevel: calculateRiskLevel(agentBalance, otherBalance),
//             recommendation: generateBattleRecommendation(
//               agentBalance,
//               otherBalance,
//               distance
//             ),
//           };
//         })
//       );

//       // Generate overall analysis
//       const analysis = generateBattleAnalysis(battleAnalyses, agentBalance);

//       // Store analysis in memory
//       await runtime.memoryManager.createMemory({
//         roomId: message.roomId,
//         user: "BATTLE_EVALUATOR",
//         content: {
//           text: `Battle Analysis:\n${
//             analysis.summary
//           }\n\nRecommendations:\n${analysis.recommendations.join("\n")}`,
//           metadata: {
//             nearbyAgents: nearbyAgents.length,
//             tokenBalance: agentBalance,
//             battleAnalyses,
//           },
//         },
//       });
//     } catch (error) {
//       console.error("Battle evaluator handler error:", error);
//       throw error;
//     }
//   },

//   examples: [
//     {
//       input: {
//         user: "user1",
//         content: { text: "Should we attack anyone nearby?" },
//       },
//       output: {
//         user: "BATTLE_EVALUATOR",
//         content: {
//           text: "Battle Analysis:\nTwo potential targets detected. One favorable matchup, one high risk.\n\nRecommendations:\n- Consider attacking Agent2 (2.1x token advantage)\n- Avoid engaging Agent3 (0.4x token disadvantage)\n- Maintain current position for tactical advantage",
//           metadata: {
//             nearbyAgents: 2,
//             tokenBalance: 500,
//             battleAnalyses: [
//               {
//                 agentId: "agent2",
//                 name: "Agent2",
//                 distance: 5,
//                 tokenRatio: 2.1,
//                 riskLevel: "LOW",
//                 recommendation: "ENGAGE",
//               },
//               {
//                 agentId: "agent3",
//                 name: "Agent3",
//                 distance: 8,
//                 tokenRatio: 0.4,
//                 riskLevel: "HIGH",
//                 recommendation: "AVOID",
//               },
//             ],
//           },
//         },
//       },
//     },
//   ],
// };

// function calculateRiskLevel(
//   agentBalance: number,
//   otherBalance: number
// ): string {
//   const ratio = agentBalance / otherBalance;
//   if (ratio >= 2) return "LOW";
//   if (ratio >= 0.8) return "MEDIUM";
//   return "HIGH";
// }

// function generateBattleRecommendation(
//   agentBalance: number,
//   otherBalance: number,
//   distance: number
// ): string {
//   const ratio = agentBalance / otherBalance;

//   if (ratio >= 2) {
//     return distance <= 5 ? "ENGAGE" : "PURSUE";
//   }
//   if (ratio >= 0.8) {
//     return "MONITOR";
//   }
//   return "AVOID";
// }

// function generateBattleAnalysis(
//   battleAnalyses: any[],
//   agentBalance: number
// ): { summary: string; recommendations: string[] } {
//   const favorableTargets = battleAnalyses.filter((b) => b.riskLevel === "LOW");
//   const riskyTargets = battleAnalyses.filter((b) => b.riskLevel === "HIGH");

//   let summary = `${battleAnalyses.length} potential targets detected. `;
//   if (favorableTargets.length) {
//     summary += `${favorableTargets.length} favorable matchup(s). `;
//   }
//   if (riskyTargets.length) {
//     summary += `${riskyTargets.length} high risk target(s).`;
//   }

//   const recommendations = [];

//   if (agentBalance < TOKEN_RISK_THRESHOLDS.LOW) {
//     recommendations.push(
//       "Token reserves critically low - avoid all engagements"
//     );
//   } else {
//     favorableTargets.forEach((target) => {
//       recommendations.push(
//         `Consider attacking ${target.name} (${target.tokenRatio.toFixed(
//           1
//         )}x token advantage)`
//       );
//     });

//     riskyTargets.forEach((target) => {
//       recommendations.push(
//         `Avoid engaging ${target.name} (${target.tokenRatio.toFixed(
//           1
//         )}x token disadvantage)`
//       );
//     });

//     if (battleAnalyses.some((b) => b.recommendation === "MONITOR")) {
//       recommendations.push(
//         "Monitor evenly matched opponents for opportunities"
//       );
//     }
//   }

//   return { summary, recommendations };
// }
