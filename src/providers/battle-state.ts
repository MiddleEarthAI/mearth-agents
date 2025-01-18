import {
  Provider,
  IAgentRuntime,
  Memory,
  State,
  elizaLogger,
} from "@elizaos/core";

import { getProgram } from "../utils/program";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { TerrainType, DeathCause, Position } from "../types";

/**
 * Provider for retrieving and managing battle state information
 * Interfaces with the Middle Earth AI Program to get battle data
 * Currently using mock data for testing/development based on whitepaper specs
 */
const battleStateProvider: Provider = {
  get: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
  ): Promise<string> => {
    elizaLogger.info("Battle state provider");
    console.log(state);
    try {
      // Mock agent account data based on game mechanics
      const mockAgentAccount = {
        lastBattle: Date.now() / 1000 - 3600, // 1 hour ago
        lastAttack: Date.now() / 1000 - 7200, // 2 hours ago
        tokenBalance: "2500", // Governance tokens held
        stakedBalance: "1200", // Tokens staked by supporters
        currentPosition: "45,60",
        movementSpeed: 1.2, // Base speed units per hour
        battleRange: 2, // Units range for battle engagement
        allianceTimeout: 18, // Hours before new alliance possible
        ignoreCooldown: 3, // Hours before interaction possible
        deathChance: 0.05, // 5% chance of permanent death on loss
        currentTerrain: TerrainType.MOUNTAIN,
        isAlive: true,
        game: new PublicKey("Game111111111111111111111111111111111111111"),
      };

      const mockGameAccount = {
        id: "game_123",
        state: 1, // 0: pending, 1: active, 2: completed
        mapDiameter: 120,
        activePlayers: [
          "Scootles",
          "Purrlock Paws",
          "Sir Gullihop",
          "Wanderleaf",
        ],
        currentRound: 3,
        terrainHazards: {
          mountainDeathRate: 0.01,
          riverDeathRate: 0.01,
          mountainSpeedPenalty: 0.5,
          riverSpeedPenalty: 0.7,
        },
      };

      const mockBattleState = {
        activeBattles: [
          {
            id: "battle_1",
            attacker: "Scootles",
            defender: "Purrlock Paws",
            startTime: Date.now() - 1800000,
            tokensBurned: "750",
            winProbability: 0.65, // Based on token ratio
            battleDuration: 3500, // 1s per governance token
            terrainAdvantage: 1.2,
          },
          {
            id: "battle_2",
            attacker: "Sir Gullihop",
            defender: "Wanderleaf",
            startTime: Date.now() - 900000,
            tokensBurned: "1200",
            winProbability: 0.48,
            battleDuration: 2800,
            terrainAdvantage: 0.9,
          },
        ],
        recentOutcomes: [
          {
            battleId: "battle_0",
            winner: "Purrlock Paws",
            loser: "Wanderleaf",
            tokensWon: "1500",
            endTime: Date.now() - 3600000,
            deathOccurred: true,
            deathCause: DeathCause.BATTLE,
            tokensBurned: "850",
          },
        ],
        alliances: [
          {
            agents: ["Scootles", "Sir Gullihop"],
            formed: Date.now() - 7200000,
            combinedTokens: "4500",
            expiresAt: Date.now() + 3600000 * 24,
          },
        ],
        ignoredPairs: [
          {
            agents: ["Purrlock Paws", "Wanderleaf"],
            until: Date.now() + 3600000 * 4,
          },
        ],
        lastUpdate: Date.now(),
      };

      // Store mock data in state
      state.currentAgentAccount = mockAgentAccount;
      state.currentGameAccount = mockGameAccount;

      // Format battle information
      const battleInfo = `
Battle State Information:

Active Battles (${mockBattleState.activeBattles.length}):
${mockBattleState.activeBattles
  .map(
    (battle) => `
- Battle ID: ${battle.id}
  Attacker: ${battle.attacker}
  Defender: ${battle.defender}
  Started: ${new Date(battle.startTime).toLocaleString()}
  Tokens at Stake: ${battle.tokensBurned}
  Win Probability: ${(battle.winProbability * 100).toFixed(1)}%
  Duration: ${battle.battleDuration}s
  Terrain Advantage: ${battle.terrainAdvantage}x
`
  )
  .join("")}

Recent Battle Outcomes (${mockBattleState.recentOutcomes.length}):
${mockBattleState.recentOutcomes
  .map(
    (outcome) => `
- Battle ID: ${outcome.battleId}
  Winner: ${outcome.winner}
  Loser: ${outcome.loser} ${outcome.deathOccurred ? "(DIED)" : ""}
  Tokens Transferred: ${outcome.tokensWon}
  Tokens Burned: ${outcome.tokensBurned}
  Ended: ${new Date(outcome.endTime).toLocaleString()}
`
  )
  .join("")}

Current Alliances:
${mockBattleState.alliances
  .map(
    (alliance) => `
- Between: ${alliance.agents.join(" & ")}
  Formed: ${new Date(alliance.formed).toLocaleString()}
  Combined Tokens: ${alliance.combinedTokens}
  Expires: ${new Date(alliance.expiresAt).toLocaleString()}
`
  )
  .join("")}

Agent Battle Stats:
- Last Battle: ${
        mockAgentAccount.lastBattle
          ? new Date(mockAgentAccount.lastBattle * 1000).toLocaleString()
          : "Never"
      }
- Last Attack: ${
        mockAgentAccount.lastAttack
          ? new Date(mockAgentAccount.lastAttack * 1000).toLocaleString()
          : "Never"
      } 
- Current Token Balance: ${mockAgentAccount.tokenBalance}
- Staked Balance: ${mockAgentAccount.stakedBalance}
- Current Position: (${mockAgentAccount.currentPosition.split(",")[0]}, ${
        mockAgentAccount.currentPosition.split(",")[1]
      })
- Movement Speed: ${mockAgentAccount.movementSpeed} units/hour
- Current Terrain: ${mockAgentAccount.currentTerrain}
- Death Risk: ${(mockAgentAccount.deathChance * 100).toFixed(1)}%

Last Updated: ${new Date(mockBattleState.lastUpdate).toLocaleString()}
      `.trim();

      return battleInfo;
    } catch (error) {
      console.error("Battle state provider error:", error);
      return "Error retrieving battle state: " + error.message;
    }
  },
};

export { battleStateProvider };
