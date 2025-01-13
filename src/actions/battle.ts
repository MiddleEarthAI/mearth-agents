// import { IAgentRuntime, Memory, State } from "@elizaos/core";
// import { Action } from "@elizaos/core";
// import { Agent } from "../types";
// import { calculateDistance } from "./movement";
// import { TokenProvider, WalletProvider } from "@elizaos/plugin-solana";

// export interface BattleAction {
//   type: ActionType.BATTLE;
//   attacker: string;
//   defender: string;
//   tokensAtStake: number;
//   winProbability: number;
//   duration: number;
//   attackerWallet: string;
//   defenderWallet: string;
// }

// export const BATTLE_RANGE = 2;
// export const TOKEN_BURN_MIN = 31;
// export const TOKEN_BURN_MAX = 50;
// export const DEATH_CHANCE = 0.05;

// export const battleAction: Action = {
//   name: "BATTLE",
//   similes: ["FIGHT", "ATTACK", "CHALLENGE", "DUEL"],
//   description: "Initiate a battle with another agent within range",

//   validate: async (runtime: IAgentRuntime, message: Memory) => {
//     try {
//         const account = await runtime.databaseAdapter.get(message.agentId);

//       const attackerId = message.agentId;
//       const attacker = await runtime.descriptionManager.getMemoryById(
//         attackerId
//       );

//       // Check if message mentions another agent
//       const text = message.content.text.toLowerCase();
//       const defender = state.agents?.find(
//         (agent) =>
//           agent.id !== attacker.id && text.includes(agent.name.toLowerCase())
//       );

//       if (!defender) {
//         console.error("No target agent mentioned");
//         return false;
//       }

//       // Check if battle is possible
//       return await canBattle(runtime, attacker, defender);
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

//       const walletProvider = runtime.getProvider("wallet") as WalletProvider;
//       const attackerWallet = walletProvider.getWalletAddress(attacker.id);
//       const defenderWallet = walletProvider.getWalletAddress(defender.id);

//       const winProbability = await calculateWinProbability(
//         runtime,
//         attacker.id,
//         defender.id
//       );

//       // Create battle action
//       const battleAction: BattleAction = {
//         type: ActionType.BATTLE,
//         attacker: attacker.id,
//         defender: defender.id,
//         tokensAtStake: calculateTokenBurnAmount(defender.tokens),
//         winProbability,
//         duration: calculateBattleDuration(attacker.tokens, defender.tokens),
//         attackerWallet,
//         defenderWallet,
//       };

//       // Execute battle on-chain
//       const tokenProvider = runtime.getProvider("token") as TokenProvider;
//       const attackerWins = Math.random() < winProbability;
//       const loser = attackerWins ? defender : attacker;
//       const loserWallet = attackerWins ? defenderWallet : attackerWallet;

//       // Burn tokens from loser
//       const burnAmount = calculateTokenBurnAmount(loser.tokens);
//       await tokenProvider.burnTokens(loserWallet, burnAmount);

//       // Check for death
//       if (shouldAgentDieInBattle()) {
//         // Transfer all remaining tokens to winner
//         const remainingBalance = await getTokenBalance(
//           tokenProvider,
//           loserWallet
//         );
//         const winnerWallet = attackerWins ? attackerWallet : defenderWallet;
//         await tokenProvider.transferTokens(
//           loserWallet,
//           winnerWallet,
//           remainingBalance
//         );

//         await runtime.processActions([
//           {
//             type: "DIE",
//             agentId: loser.id,
//           },
//         ]);
//         return;
//       }

//       // Update state
//       await runtime.updateState({
//         currentAgent: attacker,
//         agents: state?.agents?.map((a) => (a.id === loser.id ? loser : a)),
//       });

//       console.log(
//         `Battle between ${attacker.name} and ${defender.name} completed. ${
//           attackerWins ? "Attacker" : "Defender"
//         } won!`
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
//   ],

//   suppressInitialMessage: false,
// };

// export const canBattle = async (
//   runtime: IAgentRuntime,
//   agent1: Agent,
//   agent2: Agent
// ): Promise<boolean> => {
//   // Check distance
//   if (calculateDistance(agent1.position, agent2.position) > BATTLE_RANGE) {
//     return false;
//   }
//   // Get token balances
//   const tokenProvider = runtime.getProvider("token") as TokenProvider;
//   const walletProvider = runtime.getProvider("wallet") as WalletProvider;

//   const agent1Balance = await getTokenBalance(
//     tokenProvider,
//     walletProvider.getWalletAddress(agent1.id)
//   );

//   const agent2Balance = await getTokenBalance(
//     tokenProvider,
//     walletProvider.getWalletAddress(agent2.id)
//   );

//   // Both agents must have tokens to battle
//   return agent1Balance > 0 && agent2Balance > 0;
// };

// export const calculateWinProbability = async (
//   runtime: IAgentRuntime,
//   attackerId: string,
//   defenderId: string
// ): Promise<number> => {
//   const tokenProvider = runtime.getProvider("token") as TokenProvider;
//   const walletProvider = runtime.getProvider("wallet") as WalletProvider;

//   const attackerBalance = await getTokenBalance(
//     tokenProvider,
//     walletProvider.getWalletAddress(attackerId)
//   );

//   const defenderBalance = await getTokenBalance(
//     tokenProvider,
//     walletProvider.getWalletAddress(defenderId)
//   );

//   const total = attackerBalance + defenderBalance;
//   return attackerBalance / total;
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
