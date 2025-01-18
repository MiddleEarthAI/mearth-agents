import { UUID } from "@elizaos/core";

export interface Position {
  x: number;
  y: number;
}

export interface Terrain {
  type: "mountain" | "river" | "plain";
  position: Position;
  radius: number;
}

export enum CharacterType {
  SCOOTLES = "scootles",
  PURRLOCK_PAWS = "purrlock_paws",
  SIR_GULLIHOP = "sir_gullihop",
  WANDERLEAF = "wanderleaf",
}

export interface CharacterTrait {
  aggressiveness: number; // 0-1: likelihood to initiate battles
  sociability: number; // 0-1: likelihood to form alliances
  intelligence: number; // 0-1: affects strategy and decision making
  bravery: number; // 0-1: affects retreat decisions
}

export interface CharacterStats {
  type: CharacterType;
  traits: CharacterTrait;
  description: string;
}

export interface GameState {
  id: UUID;
  position: Position;
  health: number;
  tokens: number;
  alliances: UUID[];
  lastBattleTime?: number;
  lastAllianceTime?: number;
  currentTerrain?: Terrain;
  characterType: CharacterType;
}

export interface BattleResult {
  winner: UUID;
  loser: UUID;
  tokensBurned: number;
  deathOccurred: boolean;
}

export interface AllianceProposal {
  proposer: UUID;
  proposed: UUID;
  timestamp: number;
  expiresAt: number;
}

// Character definitions based on the whitepaper
export const CHARACTER_STATS: Record<CharacterType, CharacterStats> = {
  [CharacterType.SCOOTLES]: {
    type: CharacterType.SCOOTLES,
    traits: {
      aggressiveness: 0.8,
      sociability: 0.6,
      intelligence: 0.7,
      bravery: 0.9,
    },
    description:
      "Always heading towards other players. Open to form alliances and to go into battle.",
  },
  [CharacterType.PURRLOCK_PAWS]: {
    type: CharacterType.PURRLOCK_PAWS,
    traits: {
      aggressiveness: 0.9,
      sociability: 0.2,
      intelligence: 0.8,
      bravery: 0.7,
    },
    description:
      "Trying to avoid everyone. If another player is approaching her, she's most likely going to fight.",
  },
  [CharacterType.SIR_GULLIHOP]: {
    type: CharacterType.SIR_GULLIHOP,
    traits: {
      aggressiveness: 0.3,
      sociability: 0.9,
      intelligence: 0.4,
      bravery: 0.8,
    },
    description:
      "A nice fella, but not the smartest. Always looking to form alliances. He doesn't expect anything bad to happen to him.",
  },
  [CharacterType.WANDERLEAF]: {
    type: CharacterType.WANDERLEAF,
    traits: {
      aggressiveness: 0.4,
      sociability: 0.5,
      intelligence: 0.6,
      bravery: 0.4,
    },
    description:
      "Just living his life, doesn't really know what to do. Very insecure, always looking for guidance.",
  },
};

export interface MearthConfig {
  SOLANA_WALLET_ADDRESS: string;
  SOLANA_RPC_URL: string;
}
