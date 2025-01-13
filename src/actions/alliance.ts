// import { IAgentRuntime, Memory, State } from "@elizaos/core";
// import { Action, ActionType } from "./types";
// import { Agent } from "../types";
// import { canBattle } from "./battle";

// export interface AllianceAction {
//   type: ActionType.ALLIANCE;
//   initiator: string;
//   ally: string;
//   combinedTokens: number;
// }

// export interface IgnoreAction {
//   type: ActionType.IGNORE;
//   initiator: string;
//   target: string;
//   cooldownEnd: number;
// }

// const ALLIANCE_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
// const BATTLE_COOLDOWN = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

// export const canFormAlliance = (agent1: Agent, agent2: Agent): boolean => {
//   if (!canBattle(agent1, agent2)) return false; // Must be in range
//   if (agent1.alliances.includes(agent2.id)) return false; // Already allied

//   // Check cooldowns
//   const cooldownEnd = getAllianceCooldownEnd(agent1, agent2);
//   return Date.now() >= cooldownEnd;
// };

// export const getBattleCooldownEnd = (agent1: Agent, agent2: Agent): number => {
//   const lastBattle = Math.max(
//     agent1.battleCooldowns[agent2.id] || 0,
//     agent2.battleCooldowns[agent1.id] || 0
//   );
//   return lastBattle + BATTLE_COOLDOWN;
// };

// export const getAllianceCooldownEnd = (
//   agent1: Agent,
//   agent2: Agent
// ): number => {
//   const lastAlliance = Math.max(
//     agent1.allianceCooldowns[agent2.id] || 0,
//     agent2.allianceCooldowns[agent1.id] || 0
//   );
//   return lastAlliance + ALLIANCE_COOLDOWN;
// };

// export const allianceAction: Action = {
//   name: "ALLIANCE",
//   similes: ["ALLY", "TEAM_UP", "JOIN_FORCES", "UNITE"],
//   description: "Form an alliance with another agent within range",

//   validate: async (runtime: IAgentRuntime, message: Memory) => {
//     try {
//       const state = await message.content.getState();
//       const initiator = state.currentAgent as Agent;

//       // Check if message mentions another agent
//       const text = message.content.text.toLowerCase();
//       const mentionsAgent = state.agents?.some(
//         (agent) =>
//           agent.id !== initiator.id && text.includes(agent.name.toLowerCase())
//       );

//       if (!mentionsAgent) {
//         console.error("No target agent mentioned");
//         return false;
//       }

//       // Find mentioned agent
//       const ally = state.agents?.find(
//         (agent) =>
//           agent.id !== initiator.id && text.includes(agent.name.toLowerCase())
//       );

//       if (!ally) return false;

//       // Check if alliance is possible
//       return canFormAlliance(initiator, ally);
//     } catch (error) {
//       console.error("Alliance validation error:", error);
//       return false;
//     }
//   },

//   handler: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
//     try {
//       const initiator = state?.currentAgent as Agent;
//       const text = message.content.text.toLowerCase();

//       // Find ally
//       const ally = state?.agents?.find(
//         (agent) =>
//           agent.id !== initiator.id && text.includes(agent.name.toLowerCase())
//       );

//       if (!ally) throw new Error("Ally not found");

//       // Create alliance action
//       const allianceAction: AllianceAction = {
//         type: ActionType.ALLIANCE,
//         initiator: initiator.id,
//         ally: ally.id,
//         combinedTokens: initiator.tokens + ally.tokens,
//       };

//       // Update alliances
//       initiator.alliances.push(ally.id);
//       ally.alliances.push(initiator.id);

//       // Update state
//       await runtime.updateState({
//         currentAgent: initiator,
//         agents: state?.agents?.map((a) => (a.id === ally.id ? ally : a)),
//       });

//       console.log(`Alliance formed between ${initiator.name} and ${ally.name}`);
//     } catch (error) {
//       console.error("Alliance handler error:", error);
//       throw error;
//     }
//   },

//   examples: [
//     [
//       {
//         user: "user1",
//         content: { text: "Let's form an alliance with Agent2!" },
//       },
//       {
//         user: "agent",
//         content: {
//           text: "Proposing an alliance with Agent2. Together we'll be stronger!",
//           action: "ALLIANCE",
//         },
//       },
//     ],
//     [
//       {
//         user: "user1",
//         content: { text: "Agent3, shall we join forces against our enemies?" },
//       },
//       {
//         user: "agent",
//         content: {
//           text: "Forming an alliance with Agent3. Our combined tokens will make us formidable!",
//           action: "ALLIANCE",
//         },
//       },
//     ],
//   ],

//   suppressInitialMessage: false,
// };

// export const ignoreAction: Action = {
//   name: "IGNORE",
//   similes: ["AVOID", "SKIP", "PASS"],
//   description:
//     "Choose to ignore another agent, preventing interactions for a cooldown period",

//   validate: async (runtime: IAgentRuntime, message: Memory) => {
//     try {
//       const state = await runtime.getState();
//       const initiator = state.currentAgent as Agent;

//       // Check if message mentions another agent
//       const text = message.content.text.toLowerCase();
//       return (
//         state.agents?.some(
//           (agent) =>
//             agent.id !== initiator.id && text.includes(agent.name.toLowerCase())
//         ) || false
//       );
//     } catch (error) {
//       console.error("Ignore validation error:", error);
//       return false;
//     }
//   },

//   handler: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
//     try {
//       const initiator = state?.currentAgent as Agent;
//       const text = message.content.text.toLowerCase();

//       // Find target
//       const target = state?.agents?.find(
//         (agent) =>
//           agent.id !== initiator.id && text.includes(agent.name.toLowerCase())
//       );

//       if (!target) throw new Error("Target not found");

//       const cooldownEnd = Date.now() + BATTLE_COOLDOWN;

//       // Create ignore action
//       const ignoreAction: IgnoreAction = {
//         type: ActionType.IGNORE,
//         initiator: initiator.id,
//         target: target.id,
//         cooldownEnd,
//       };

//       // Update cooldowns
//       initiator.battleCooldowns[target.id] = cooldownEnd;
//       target.battleCooldowns[initiator.id] = cooldownEnd;

//       // Update state
//       await runtime.updateState({
//         currentAgent: initiator,
//         agents: state?.agents?.map((a) => (a.id === target.id ? target : a)),
//       });

//       console.log(
//         `${initiator.name} is now ignoring ${target.name} until ${new Date(
//           cooldownEnd
//         )}`
//       );
//     } catch (error) {
//       console.error("Ignore handler error:", error);
//       throw error;
//     }
//   },

//   examples: [
//     [
//       {
//         user: "user1",
//         content: { text: "Let's ignore Agent2 for now" },
//       },
//       {
//         user: "agent",
//         content: {
//           text: "I'll ignore Agent2 for the next 4 hours",
//           action: "IGNORE",
//         },
//       },
//     ],
//   ],

//   suppressInitialMessage: false,
// };
