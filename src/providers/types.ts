import { Agent } from "../types";

export interface GameState {
  map: {
    width: number;
    height: number;
    terrain: TerrainType[][];
  };
  agents: Agent[];
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
}

export interface TwitterMetrics {
  impressions: number;
  likes: number;
  replies: number;
  retweets: number;
  lastUpdate: number;
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
  tokensBurned: number;
}

export interface BattleOutcome {
  battleId: string;
  winner: string;
  loser: string;
  tokensWon: number;
  endTime: number;
}

export enum TerrainType {
  PLAINS = "PLAINS",
  MOUNTAINS = "MOUNTAINS",
  RIVER = "RIVER",
}
