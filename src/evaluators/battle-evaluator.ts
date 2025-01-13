import { IAgentRuntime, Memory, State } from "@elizaos/core";
import { Evaluator } from "./types";
import { Agent } from "../types";
// import { canBattle } from "../actions/battle";

export const battleEvaluator: Evaluator = {
  name: "BATTLE_EVALUATOR",
  description:
    "Evaluates battle opportunities and risks based on agent positions, token balances, and terrain",
  similes: ["COMBAT_EVAL", "FIGHT_ANALYSIS", "BATTLE_CHECK"],
  alwaysRun: true,
  priority: 1,

  validate: async (runtime: IAgentRuntime, message: Memory) => {
    // try {
    //   const state = await runtime.getState();
    //   const agent = state.currentAgent as Agent;
    //   return (
    //     state.agents?.some(
    //       (other) =>
    //         other.id !== agent.id && other.isAlive && canBattle(agent, other)
    //     ) || false
    //   );
    // } catch (error) {
    //   console.error("Battle evaluation validation error:", error);
    //   return false;
    // }
    return false;
  },

  handler: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    // const agent = state.currentAgent as Agent;
    // const nearbyAgents =
    //   state.agents?.filter(
    //     (other) =>
    //       other.id !== agent.id && other.isAlive && canBattle(agent, other)
    //   ) || [];
    // if (nearbyAgents.length === 0) {
    //   return {
    //     type: "BATTLE_EVAL",
    //     result: "NO_TARGETS",
    //     recommendation: "Continue exploring the map",
    //   };
    // }
    // const battleOpportunities = nearbyAgents.map((target) => {
    //   const combinedTokens = agent.tokens + target.tokens;
    //   const winProbability = agent.tokens / combinedTokens;
    //   const riskLevel = target.tokens > agent.tokens ? "HIGH" : "LOW";
    //   return {
    //     targetId: target.id,
    //     targetName: target.name,
    //     winProbability,
    //     riskLevel,
    //     potentialGain: Math.floor(target.tokens * 0.4), // 40% of target's tokens
    //     potentialLoss: Math.floor(agent.tokens * 0.4), // 40% of own tokens
    //     hasAllies: target.alliances.length > 0,
    //   };
    // });
    // const bestOpportunity = battleOpportunities.reduce((best, current) =>
    //   current.winProbability > best.winProbability ? current : best
    // );
    // return {
    //   type: "BATTLE_EVAL",
    //   result: "OPPORTUNITIES_FOUND",
    //   opportunities: battleOpportunities,
    //   recommendation:
    //     bestOpportunity.winProbability > 0.6
    //       ? `Consider attacking ${bestOpportunity.targetName} with ${Math.round(
    //           bestOpportunity.winProbability * 100
    //         )}% win chance`
    //       : "Current battle opportunities are too risky",
    // };
  },

  examples: [
    {
      context: "Agent encounters a weaker opponent",
      messages: [
        {
          user: "user1",
          content: { text: "Should I attack Agent2?" },
        },
      ],
      outcome: "Recommended battle due to favorable token ratio",
      explanation:
        "Agent had more tokens than opponent, resulting in >60% win probability",
    },
    {
      context: "Agent encounters multiple opponents",
      messages: [
        {
          user: "user1",
          content: { text: "Multiple agents nearby, what should I do?" },
        },
      ],
      outcome:
        "Analyzed all nearby opponents and recommended the most favorable target",
      explanation:
        "Compared token ratios and ally status of all potential targets",
    },
  ],
};
