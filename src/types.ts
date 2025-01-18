import { MiddleEarthAiProgram } from "./constants/middle_earth_ai_program";
import * as anchor from "@coral-xyz/anchor";

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
  user: string;
  text: string;
  action: string;
};

export type MearthProgram = anchor.Program<MiddleEarthAiProgram>;

export type Position = `${number | string},${number | string}`;

export interface Terrain {
  type: "mountain" | "river" | "plain";
  coordinates: Position[];
  radius: number;
}

export enum CharacterType {
  SCOOTLES = "scootles",
  PURRLOCK_PAWS = "purrlock_paws",
  SIR_GULLIHOP = "sir_gullihop",
  WANDERLEAF = "wanderleaf",
}

// Character definitions based on the whitepaper
// export const CHARACTER_STATS: Record<CharacterType, CharacterStats> = {
//   [CharacterType.SCOOTLES]: {
//     type: CharacterType.SCOOTLES,
//     traits: {
//       aggressiveness: 0.8,
//       sociability: 0.6,
//       intelligence: 0.7,
//       bravery: 0.9,
//     },
//     description:
//       "Always heading towards other players. Open to form alliances and to go into battle.",
//   },
//   [CharacterType.PURRLOCK_PAWS]: {
//     type: CharacterType.PURRLOCK_PAWS,
//     traits: {
//       aggressiveness: 0.9,
//       sociability: 0.2,
//       intelligence: 0.8,
//       bravery: 0.7,
//     },
//     description:
//       "Trying to avoid everyone. If another player is approaching her, she's most likely going to fight.",
//   },
//   [CharacterType.SIR_GULLIHOP]: {
//     type: CharacterType.SIR_GULLIHOP,
//     traits: {
//       aggressiveness: 0.3,
//       sociability: 0.9,
//       intelligence: 0.4,
//       bravery: 0.8,
//     },
//     description:
//       "A nice fella, but not the smartest. Always looking to form alliances. He doesn't expect anything bad to happen to him.",
//   },
//   [CharacterType.WANDERLEAF]: {
//     type: CharacterType.WANDERLEAF,
//     traits: {
//       aggressiveness: 0.4,
//       sociability: 0.5,
//       intelligence: 0.6,
//       bravery: 0.4,
//     },
//     description:
//       "Just living his life, doesn't really know what to do. Very insecure, always looking for guidance.",
//   },
// };

export interface MearthConfig {
  SOLANA_WALLET_ADDRESS: string;
  SOLANA_RPC_URL: string;
}

export type TwitterProfile = {
  id: string;
  username: string;
  screenName: string;
  bio: string;
  nicknames: string[];
};
