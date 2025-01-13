// import { IAgentRuntime, Memory } from "@elizaos/core";
// import { Evaluator } from "./types";
// import {
//   getTokenBalance,
//   TokenProvider,
//   WalletProvider,
// } from "@elizaos/plugin-solana";

// const ENGAGEMENT_THRESHOLDS = {
//   IMPRESSIONS: 1000,
//   LIKES: 50,
//   REPLIES: 20,
//   RETWEETS: 30,
// };

// const TOKEN_INFLUENCE_THRESHOLDS = {
//   LOW: 100,
//   MEDIUM: 500,
//   HIGH: 1000,
// };

// export const socialEvaluator: Evaluator = {
//   name: "SOCIAL_EVALUATOR",
//   description: "Evaluates social media engagement and token-based influence",
//   similes: ["COMMUNITY_ANALYST", "INFLUENCE_TRACKER", "ENGAGEMENT_MONITOR"],
//   alwaysRun: true,
//   priority: 1,

//   validate: async (runtime: IAgentRuntime) => {
//     try {
//       const state = await runtime.getState();
//       return !!state.twitterMetrics;
//     } catch (error) {
//       console.error("Social evaluator validation error:", error);
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

//       // Get token balance for influence calculation
//       const tokenBalance = await getTokenBalance(tokenProvider, walletAddress);

//       // Get Twitter metrics
//       const metrics = state.twitterMetrics;
//       if (!metrics) throw new Error("No Twitter metrics found");

//       // Calculate engagement score (0-100)
//       const engagementScore = calculateEngagementScore(metrics);

//       // Calculate token-based influence (0-100)
//       const tokenInfluence = calculateTokenInfluence(tokenBalance);

//       // Combined social power score (0-100)
//       const socialPowerScore = (engagementScore + tokenInfluence) / 2;

//       // Generate analysis and recommendations
//       let analysis = "";
//       let recommendations = [];

//       if (socialPowerScore < 40) {
//         analysis = "Low social influence. Need to build community presence.";
//         recommendations = [
//           "Increase tweet frequency",
//           "Engage with community members",
//           "Build token reserves for credibility",
//           "Join Twitter Spaces discussions",
//         ];
//       } else if (socialPowerScore < 70) {
//         analysis = "Moderate social influence. Good foundation for growth.";
//         recommendations = [
//           "Lead community discussions",
//           "Form strategic alliances",
//           "Share battle victories and strategies",
//           "Host Twitter Spaces events",
//         ];
//       } else {
//         analysis = "Strong social influence. Community leader status.";
//         recommendations = [
//           "Rally community for major battles",
//           "Influence territory control",
//           "Shape alliance dynamics",
//           "Drive game narrative",
//         ];
//       }

//       // Store analysis in memory
//       await runtime.memoryManager.createMemory({
//         roomId: message.roomId,
//         user: "SOCIAL_EVALUATOR",
//         content: {
//           text: `Social Analysis:\n${analysis}\n\nRecommendations:\n${recommendations.join(
//             "\n"
//           )}`,
//           metadata: {
//             engagementScore,
//             tokenInfluence,
//             socialPowerScore,
//             metrics: {
//               impressions: metrics.impressions,
//               likes: metrics.likes,
//               replies: metrics.replies,
//               retweets: metrics.retweets,
//             },
//           },
//         },
//       });
//     } catch (error) {
//       console.error("Social evaluator handler error:", error);
//       throw error;
//     }
//   },

//   examples: [
//     {
//       input: {
//         user: "user1",
//         content: { text: "How's our social influence looking?" },
//       },
//       output: {
//         user: "SOCIAL_EVALUATOR",
//         content: {
//           text: "Social Analysis:\nModerate social influence. Good foundation for growth.\n\nRecommendations:\n- Lead community discussions\n- Form strategic alliances\n- Share battle victories and strategies\n- Host Twitter Spaces events",
//           metadata: {
//             engagementScore: 65,
//             tokenInfluence: 55,
//             socialPowerScore: 60,
//             metrics: {
//               impressions: 1500,
//               likes: 75,
//               replies: 25,
//               retweets: 40,
//             },
//           },
//         },
//       },
//     },
//   ],
// };

// function calculateEngagementScore(metrics: any): number {
//   const scores = {
//     impressions: Math.min(
//       100,
//       (metrics.impressions / ENGAGEMENT_THRESHOLDS.IMPRESSIONS) * 100
//     ),
//     likes: Math.min(100, (metrics.likes / ENGAGEMENT_THRESHOLDS.LIKES) * 100),
//     replies: Math.min(
//       100,
//       (metrics.replies / ENGAGEMENT_THRESHOLDS.REPLIES) * 100
//     ),
//     retweets: Math.min(
//       100,
//       (metrics.retweets / ENGAGEMENT_THRESHOLDS.RETWEETS) * 100
//     ),
//   };

//   return (
//     (scores.impressions + scores.likes + scores.replies + scores.retweets) / 4
//   );
// }

// function calculateTokenInfluence(balance: number): number {
//   if (balance >= TOKEN_INFLUENCE_THRESHOLDS.HIGH) {
//     return 100;
//   } else if (balance >= TOKEN_INFLUENCE_THRESHOLDS.MEDIUM) {
//     return 70;
//   } else if (balance >= TOKEN_INFLUENCE_THRESHOLDS.LOW) {
//     return 40;
//   }
//   return 10;
// }
