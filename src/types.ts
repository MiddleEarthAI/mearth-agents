import { MiddleEarthAiProgram } from "./constants/middle_earth_ai_program";
import * as anchor from "@coral-xyz/anchor";

export interface Position {
  x: number;
  y: number;
}

export interface AgentInfo {
  game: string; // Pubkey
  authority: string; // Pubkey
  id: string;
  currentPosition: Position;
  isAlive: boolean;
  lastMove: Date; // i64 timestamp
  lastBattle: Date; // i64 timestamp
  currentBattleStart?: Date; //
  allianceWith?: string; // ally agent name
  allianceDate: Date; // i64
  ignoreCooldowns: Array<{
    agentId: string;
    date: Date;
  }>;
  tokenBalance: number; // u64
  stakedBalance: number; // u64
  totalShares: number; // u64
  lastAttack: Date; // i64
  lastIgnore: Date; // i64
  lastAlliance: Date; // i64
  nextMoveTime: Date; // i64
  lastAllianceAgent?: string; // ally agent name
  lastAllianceBroken: Date; // i64
}

export enum TerrainType {
  PLAIN = "PLAIN",
  RIVER = "RIVER",
  MOUNTAIN = "MOUNTAIN",
}

export enum DeathCause {
  BATTLE = "BATTLE",
  TERRAIN = "TERRAIN",
}

export type MearthActionResponse = {
  // Movement actions
  move?: {
    direction: string;
    speed: number;
  };

  // Battle actions
  battle?: {
    targetAgent: string;
    probability: number;
    tokensAtRisk: number;
  };

  // Alliance actions
  alliance?: {
    targetAgent: string;
    duration: number;
  };

  // Ignore actions
  ignore?: {
    targetAgent: string;
    cooldownHours: number;
  };

  // Death events
  death?: {
    cause: "BATTLE" | "TERRAIN";
    killerAgent?: string;
    tokensLost: number;
  };

  // Strategy actions
  strategy?: {
    isDeceptive: boolean;
    targetCommunity?: string;
    message: string;
  };
};
export type MearthProgram = anchor.Program<MiddleEarthAiProgram>;
