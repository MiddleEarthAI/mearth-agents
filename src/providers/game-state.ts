import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";
import { TerrainType } from "./types";
import * as anchor from "@coral-xyz/anchor";

const gameStateProvider: Provider = {
  get: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
  ): Promise<string> => {
    try {
      // TODO: Implement game state provider
      // const gameState = state;
      console.log("runtime", runtime);
      console.log("message", message);
      console.log("state", state);

      const gameState = {
        agents: [],
        map: {
          width: 120,
          height: 120,
        },
        lastUpdate: new Date().toISOString(),
      };

      // Format game state information
      const agentCount = gameState.agents.length;
      const mapSize = `${gameState.map.width}x${gameState.map.height}`;
      const lastUpdateTime = new Date(gameState.lastUpdate).toLocaleString();

      return `
Game State Information:
- Number of Agents: ${agentCount}
- Map Size: ${mapSize}
- Last Updated: ${lastUpdateTime}

Map Overview:
- Width: ${gameState.map.width}
- Height: ${gameState.map.height}
- Default Terrain: ${
        Math.random() > 0.5 ? TerrainType.PLAINS : TerrainType.MOUNTAINS
      }
      `.trim();
    } catch (error) {
      console.error("Game state provider error:", error);
      return "Game state temporarily unavailable";
    }
  },
};

export { gameStateProvider };
