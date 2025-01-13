import { IAgentRuntime, Memory, State } from "@elizaos/core";

export interface Provider {
  name: string;
  description: string;
  initialize: (runtime: IAgentRuntime) => Promise<void>;
  update: (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
  ) => Promise<void>;
  getState: () => Promise<any>;
}

export interface GameState {
  agents: Agent[];
  map: {
    width: number;
    height: number;
    terrain: TerrainType[][];
  };
  lastUpdate: number;
}

export interface TokenState {
  balance: number;
  recentTransactions: Transaction[];
  lastUpdate: number;
}

export interface Transaction {
  amount: number;
  timestamp: number;
  type: "BATTLE" | "ALLIANCE" | "REWARD" | "PENALTY";
  description: string;
}

export interface TwitterMetrics {
  followerCount: number;
  impressions: number;
  likes: number;
  replies: number;
  retweets: number;
  lastUpdate: number;
  significantEngagement: boolean;
}

export interface BattleState {
  activeBattles: Battle[];
  recentOutcomes: BattleOutcome[];
  lastUpdate: number;
}

export interface Battle {
  id: string;
  attacker: string;
  defender: string;
  startTime: number;
  duration: number;
  tokensAtStake: number;
  terrain: TerrainType;
}

export interface BattleOutcome {
  battleId: string;
  winner: string;
  loser: string;
  tokensWon: number;
  endTime: number;
  deathOccurred: boolean;
}

export interface Agent {
  id: string;
  name: string;
  position: Position;
  tokens: number;
  alliances: string[];
  allianceCooldowns: { [agentId: string]: number };
  battleCooldowns: { [agentId: string]: number };
}

export interface Position {
  x: number;
  y: number;
}

export enum TerrainType {
  PLAINS = "PLAINS",
  MOUNTAINS = "MOUNTAINS",
  RIVER = "RIVER",
}
