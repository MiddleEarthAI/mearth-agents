import { IAgentRuntime, Provider, Memory, State } from "@elizaos/core";
import { AgentInfo, Position, TerrainType } from "../types";

export interface GameConfig {
  mapWidth: number;
  mapHeight: number;
  maxAgents: number;
  moveInterval: number; // in seconds
  battleInterval: number; // in seconds
  allianceInterval: number; // in seconds
  minStakeAmount: number;
}

export interface GameState {
  agents: AgentInfo[];
  terrain: TerrainType[][];
  config: GameConfig;
}

export class GameStateProvider implements Provider {
  private state: GameState;

  constructor(private runtime: IAgentRuntime) {
    // Initialize with default config
    this.state = {
      agents: [],
      terrain: [],
      config: {
        mapWidth: 100,
        mapHeight: 100,
        maxAgents: 100,
        moveInterval: 3600, // 1 hour
        battleInterval: 7200, // 2 hours
        allianceInterval: 86400, // 24 hours
        minStakeAmount: 1000000, // 1 MEARTH
      },
    };
  }

  async get(
    _runtime: IAgentRuntime,
    _message: Memory,
    _state?: State
  ): Promise<string> {
    // Fetch latest state from chain
    await this.updateGameState();

    // Format game state information
    const agentCount = this.state.agents.length;
    const mapSize = `${this.state.config.mapWidth}x${this.state.config.mapHeight}`;
    const activeAgents = this.state.agents.filter((a) => a.isAlive).length;

    return `
Game State Information:
- Total Agents: ${agentCount}
- Active Agents: ${activeAgents}
- Map Size: ${mapSize}
- Move Interval: ${this.state.config.moveInterval}s
- Battle Interval: ${this.state.config.battleInterval}s
- Alliance Interval: ${this.state.config.allianceInterval}s
- Min Stake: ${this.state.config.minStakeAmount} MEARTH
    `.trim();
  }

  private async updateGameState() {
    try {
      // TODO: Implement fetching state from chain
      // For now using mock data
      this.state.terrain = this.generateTerrain();
      // Agents will be updated through the MearthManager
    } catch (error) {
      console.error("Failed to update game state:", error);
    }
  }

  private generateTerrain(): TerrainType[][] {
    const terrain: TerrainType[][] = [];
    for (let y = 0; y < this.state.config.mapHeight; y++) {
      terrain[y] = [];
      for (let x = 0; x < this.state.config.mapWidth; x++) {
        // Simple random terrain generation
        const rand = Math.random();
        if (rand < 0.7) {
          terrain[y][x] = TerrainType.PLAIN;
        } else if (rand < 0.85) {
          terrain[y][x] = TerrainType.RIVER;
        } else {
          terrain[y][x] = TerrainType.MOUNTAIN;
        }
      }
    }
    return terrain;
  }

  // Helper methods for game state management
  isValidPosition(position: Position): boolean {
    return (
      position.x >= 0 &&
      position.x < this.state.config.mapWidth &&
      position.y >= 0 &&
      position.y < this.state.config.mapHeight
    );
  }

  getTerrainAt(position: Position): TerrainType {
    if (!this.isValidPosition(position)) {
      throw new Error("Invalid position");
    }
    return this.state.terrain[position.y][position.x];
  }

  calculateDistance(pos1: Position, pos2: Position): number {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
  }

  isMovementAllowed(agent: AgentInfo): boolean {
    const now = new Date();
    return now.getTime() >= agent.nextMoveTime.getTime();
  }

  isBattleAllowed(agent: AgentInfo): boolean {
    const now = new Date();
    return (
      now.getTime() >=
      agent.lastBattle.getTime() + this.state.config.battleInterval * 1000
    );
  }

  isAllianceAllowed(agent: AgentInfo): boolean {
    const now = new Date();
    return (
      now.getTime() >=
      agent.lastAlliance.getTime() + this.state.config.allianceInterval * 1000
    );
  }
}
