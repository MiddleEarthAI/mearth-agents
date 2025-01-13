// import { IAgentRuntime, Memory, State } from "@elizaos/core";
// import { Action, ActionType } from "./types";
// import { Agent } from "../types";
// import { calculateDistance } from "./movement";

// export interface BattleAction {
//   type: ActionType.BATTLE;
//   attacker: string;
//   defender: string;
//   tokensAtStake: number;
//   winProbability: number;
//   duration: number;
// }

// export const BATTLE_RANGE = 2;
// export const TOKEN_BURN_MIN = 31;
// export const TOKEN_BURN_MAX = 50;
// export const DEATH_CHANCE = 0.05;

// export const canBattle = (agent1: Agent, agent2: Agent): boolean => {
//   return calculateDistance(agent1.position, agent2.position) <= BATTLE_RANGE;
// };

// export const calculateWinProbability = (
//   attackerTokens: number,
//   defenderTokens: number
// ): number => {
//   const total = attackerTokens + defenderTokens;
//   return attackerTokens / total;
// };

// export const calculateBattleDuration = (
//   attackerTokens: number,
//   defenderTokens: number
// ): number => {
//   return attackerTokens + defenderTokens; // 1 second per token
// };

// export const calculateTokenBurnAmount = (tokens: number): number => {
//   const burnPercent =
//     TOKEN_BURN_MIN +
//     Math.floor(Math.random() * (TOKEN_BURN_MAX - TOKEN_BURN_MIN + 1));
//   return Math.floor((tokens * burnPercent) / 100);
// };

// export const shouldAgentDieInBattle = (): boolean => {
//   return Math.random() < DEATH_CHANCE;
// };

// export const battleAction: Action = {
//   name: "BATTLE",
//   similes: ["FIGHT", "ATTACK", "CHALLENGE", "DUEL"],
//   description: "Initiate a battle with another agent within range",

//   validate: async (runtime: IAgentRuntime, message: Memory) => {
//     try {
//       const state = await runtime.getState();
//       const attacker = state.currentAgent as Agent;

//       // Check if message mentions another agent
//       const text = message.content.text.toLowerCase();
//       const mentionsAgent = state.agents?.some(
//         (agent) =>
//           agent.id !== attacker.id && text.includes(agent.name.toLowerCase())
//       );

//       if (!mentionsAgent) {
//         console.error("No target agent mentioned");
//         return false;
//       }

//       // Find mentioned agent
//       const defender = state.agents?.find(
//         (agent) =>
//           agent.id !== attacker.id && text.includes(agent.name.toLowerCase())
//       );

//       if (!defender) return false;

//       // Check if in range
//       return canBattle(attacker, defender);
//     } catch (error) {
//       console.error("Battle validation error:", error);
//       return false;
//     }
//   },

//   handler: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
//     try {
//       const attacker = state?.currentAgent as Agent;
//       const text = message.content.text.toLowerCase();

//       // Find defender
//       const defender = state?.agents?.find(
//         (agent) =>
//           agent.id !== attacker.id && text.includes(agent.name.toLowerCase())
//       );

//       if (!defender) throw new Error("Defender not found");

//       const winProbability = calculateWinProbability(
//         attacker.tokens,
//         defender.tokens
//       );
//       const duration = calculateBattleDuration(
//         attacker.tokens,
//         defender.tokens
//       );

//       // Create battle action
//       const battleAction: BattleAction = {
//         type: ActionType.BATTLE,
//         attacker: attacker.id,
//         defender: defender.id,
//         tokensAtStake: calculateTokenBurnAmount(defender.tokens),
//         winProbability,
//         duration,
//       };

//       // Determine outcome
//       const attackerWins = Math.random() < winProbability;
//       const loser = attackerWins ? defender : attacker;

//       // Apply token burn
//       loser.tokens -= calculateTokenBurnAmount(loser.tokens);

//       // Check for death
//       if (shouldAgentDieInBattle()) {
//         await runtime.processAction("DIE", message);
//         return;
//       }

//       // Update state
//       await runtime.updateState({
//         currentAgent: attacker,
//         agents: state?.agents?.map((a) => (a.id === loser.id ? loser : a)),
//       });

//       console.log(
//         `Battle between ${attacker.name} and ${defender.name} completed`
//       );
//     } catch (error) {
//       console.error("Battle handler error:", error);
//       throw error;
//     }
//   },

//   examples: [
//     [
//       {
//         user: "user1",
//         content: { text: "I challenge Agent2 to a battle!" },
//       },
//       {
//         user: "agent",
//         content: {
//           text: "Initiating battle with Agent2. My tokens give me a 75% chance of victory!",
//           action: "BATTLE",
//         },
//       },
//     ],
//     [
//       {
//         user: "user1",
//         content: { text: "Let's fight Agent3 while they're weak" },
//       },
//       {
//         user: "agent",
//         content: {
//           text: "Engaging in battle with Agent3. Victory will cost them 40% of their tokens!",
//           action: "BATTLE",
//         },
//       },
//     ],
//   ],

//   suppressInitialMessage: false,
// };
