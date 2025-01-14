import { MiddleEarthAiProgram } from "./constants/middle_earth_ai_program";
import * as anchor from "@coral-xyz/anchor";

export interface Position {
  x: number;
  y: number;
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

export enum ActionType {
  MOVE = "MOVE",
  BATTLE = "BATTLE",
  ALLIANCE = "ALLIANCE",
  IGNORE = "IGNORE",
  DIE = "DIE",
}

export enum TerrainType {
  PLAINS = "PLAINS",
  MOUNTAINS = "MOUNTAINS",
  RIVER = "RIVER",
}

export interface MoveAction {
  type: ActionType.MOVE;
  agentId: string;
  from: Position;
  to: Position;
  terrain: TerrainType;
}

export interface BattleAction {
  type: ActionType.BATTLE;
  attacker: string;
  defender: string;
  attackerWallet: string;
  defenderWallet: string;
  tokensBurned: number;
}

export interface AllianceAction {
  type: ActionType.ALLIANCE;
  initiator: string;
  ally: string;
  initiatorWallet: string;
  allyWallet: string;
}

export interface IgnoreAction {
  type: ActionType.IGNORE;
  initiator: string;
  target: string;
  cooldownEnd: number;
}

export interface DieAction {
  type: ActionType.DIE;
  agentId: string;
  cause: "BATTLE" | "TERRAIN";
}

export type MearthProgram = anchor.Program<MiddleEarthAiProgram>;
