import {
  Provider,
  IAgentRuntime,
  Memory,
  State,
  elizaLogger,
} from "@elizaos/core";
import { TerrainType, DeathCause } from "../types";
import { getProgram } from "../utils/program";
import { getGamePDA } from "../utils/pda";

/**
 * Gets mock game state data for testing/development
 * Simulates the current state of the Middle Earth AI game
 */
async function getGameState(runtime: IAgentRuntime) {
  // Mock game state data with rich details based on whitepaper
  const mockGameState = {
    agents: {
      total: 4,
      active: 3,
      details: [
        {
          name: "Scootles",
          isAlive: true,
          position: { x: 35, y: 45 },
          currentTerrain: TerrainType.PLAIN,
          tokenBalance: 2500,
          lastBattle: Date.now() - 7200000,
          currentAlliance: "Purrlock Paws",
          influenceDifficulty: "medium",
          deathRisk: 0.05,
        },
        {
          name: "Purrlock Paws",
          isAlive: true,
          position: { x: 60, y: 25 },
          currentTerrain: TerrainType.MOUNTAIN,
          tokenBalance: 3500,
          lastBattle: Date.now() - 3600000,
          currentAlliance: "Scootles",
          influenceDifficulty: "hard",
          deathRisk: 0.01,
        },
        {
          name: "Sir Gullihop",
          isAlive: true,
          position: { x: 15, y: 75 },
          currentTerrain: TerrainType.RIVER,
          tokenBalance: 1500,
          lastBattle: null,
          currentAlliance: null,
          influenceDifficulty: "medium",
          deathRisk: 0.03,
        },
        {
          name: "Wanderleaf",
          isAlive: false,
          deathCause: DeathCause.TERRAIN,
          lastPosition: { x: 90, y: 90 },
          tokenBalance: 0,
          influenceDifficulty: "easy",
        },
      ],
    },
    map: {
      diameter: 120,
      terrainZones: [
        { type: TerrainType.MOUNTAIN, center: { x: 60, y: 20 }, radius: 15 },
        {
          type: TerrainType.RIVER,
          path: [
            { x: 0, y: 60 },
            { x: 120, y: 60 },
          ],
          width: 5,
        },
      ],
    },
    gameMetrics: {
      totalBattles: 12,
      tokensStaked: 15000,
      totalBurned: 2500,
      averageInfluenceScore: 75, // 0-100 scale of how much human interaction affects agents
    },
    isActive: true,
    startTime: Date.now() - 86400000, // 24 hours ago
    currentPhase: "MID_GAME", // EARLY_GAME, MID_GAME, LATE_GAME
  };

  return mockGameState;
}

/**
 * Provider for retrieving game state information
 * Provides detailed information about the current state of Middle Earth AI game
 */
export const gameStateProvider: Provider = {
  async get(
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
  ): Promise<string> {
    try {
      const gameState = await getGameState(runtime);
      elizaLogger.info("Fetching game state...");

      // Update state with current game data
      state.agents = gameState.agents.total;
      state.currentGamePhase = gameState.currentPhase;

      // Game configuration settings
      const gameSettings = {
        mapDiameter: 120,
        moveSpeed: 1, // units per hour
        battleRange: 2, // units
        mountainSpeedPenalty: 0.5,
        riverSpeedPenalty: 0.7,
        terrainDeathChance: 0.01,
        battleDeathChance: 0.05,
        minStakeAmount: 100,
        tokenMint: "MEARTH1111111111111111111111111111111111111",
        allianceCooldown: 24 * 3600, // 24 hours in seconds
        battleCooldown: 4 * 3600, // 4 hours in seconds
        tokenBurnRange: { min: 31, max: 50 }, // percentage
      };

      return `
Game State Information:

Active Agents (${gameState.agents.active}/${gameState.agents.total}):
${gameState.agents.details
  .map(
    (agent) => `
- ${agent.name}:
  ${
    agent.isAlive
      ? `• Position: (${agent.position.x}, ${agent.position.y})
  • Current Terrain: ${agent.currentTerrain}
  • Token Balance: ${agent.tokenBalance} MEARTH
  • Alliance: ${agent.currentAlliance || "None"}
  • Death Risk: ${agent.deathRisk * 100}%`
      : `• DECEASED (Cause: ${agent.deathCause})`
  }`
  )
  .join("\n")}

Map Status:
- Diameter: ${gameSettings.mapDiameter} units
- Active Terrain Zones: ${gameState.map.terrainZones.length}
- Movement Penalties:
  • Mountains: ${gameSettings.mountainSpeedPenalty * 100}% slower
  • Rivers: ${gameSettings.riverSpeedPenalty * 100}% slower

Game Metrics:
- Total Battles: ${gameState.gameMetrics.totalBattles}
- Total Tokens Staked: ${gameState.gameMetrics.tokensStaked} MEARTH
- Tokens Burned: ${gameState.gameMetrics.totalBurned} MEARTH
- Current Phase: ${gameState.currentPhase}
- Running Time: ${Math.floor((Date.now() - gameState.startTime) / 3600000)}h

Game Settings:
- Battle Range: ${gameSettings.battleRange} units
- Alliance Cooldown: ${gameSettings.allianceCooldown / 3600}h
- Battle Cooldown: ${gameSettings.battleCooldown / 3600}h
- Token Burn Range: ${gameSettings.tokenBurnRange.min}-${
        gameSettings.tokenBurnRange.max
      }%
- Min Stake: ${gameSettings.minStakeAmount} MEARTH
    `.trim();
    } catch (error) {
      console.error("Game state provider error:", error);
      return "Error retrieving game state: " + error.message;
    }
  },
};
