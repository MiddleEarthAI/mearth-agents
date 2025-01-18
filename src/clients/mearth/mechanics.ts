import { UUID } from "@elizaos/core";
import {
  Position,
  Terrain,
  GameState,
  BattleResult,
  AllianceProposal,
  CharacterType,
  CHARACTER_STATS,
} from "./types";

export class GameMechanics {
  private static MOUNTAIN_SPEED_REDUCTION = 0.5;
  private static RIVER_SPEED_REDUCTION = 0.7;
  private static TERRAIN_DEATH_CHANCE = 0.01;
  private static BATTLE_DEATH_CHANCE = 0.05;
  private static MIN_TOKEN_BURN_PERCENT = 0.31;
  private static MAX_TOKEN_BURN_PERCENT = 0.5;
  private static ALLIANCE_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours in ms
  private static BATTLE_COOLDOWN = 4 * 60 * 60 * 1000; // 4 hours in ms
  private static INTERACTION_RANGE = 2; // units

  // Predefined terrain features
  private static TERRAIN_FEATURES: Terrain[] = [
    {
      type: "mountain",
      position: { x: 20, y: 20 },
      radius: 10,
    },
    {
      type: "river",
      position: { x: 15, y: 30 },
      radius: 5,
    },
  ];

  /**
   * Calculate movement speed based on current terrain
   */
  static getMovementSpeed(position: Position, baseSpeed: number): number {
    const terrain = this.getCurrentTerrain(position);
    if (!terrain) return baseSpeed;

    switch (terrain.type) {
      case "mountain":
        return baseSpeed * this.MOUNTAIN_SPEED_REDUCTION;
      case "river":
        return baseSpeed * this.RIVER_SPEED_REDUCTION;
      default:
        return baseSpeed;
    }
  }

  /**
   * Check if movement through terrain results in death
   */
  static checkTerrainDeath(position: Position): boolean {
    const terrain = this.getCurrentTerrain(position);
    if (!terrain) return false;

    return Math.random() < this.TERRAIN_DEATH_CHANCE;
  }

  /**
   * Get current terrain at position
   */
  static getCurrentTerrain(position: Position): Terrain | null {
    return (
      this.TERRAIN_FEATURES.find(
        (terrain) =>
          this.getDistance(position, terrain.position) <= terrain.radius
      ) || null
    );
  }

  /**
   * Calculate distance between two positions
   */
  static getDistance(pos1: Position, pos2: Position): number {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Check if two agents are within interaction range
   */
  static canInteract(pos1: Position, pos2: Position): boolean {
    return this.getDistance(pos1, pos2) <= this.INTERACTION_RANGE;
  }

  /**
   * Calculate battle outcome between two agents
   */
  static calculateBattle(
    attacker: { id: UUID; tokens: number; type: CharacterType },
    defender: { id: UUID; tokens: number; type: CharacterType }
  ): BattleResult {
    const totalTokens = attacker.tokens + defender.tokens;
    const attackerProbability = attacker.tokens / totalTokens;

    // Adjust probability based on character traits
    const attackerTraits = CHARACTER_STATS[attacker.type].traits;
    const defenderTraits = CHARACTER_STATS[defender.type].traits;

    const traitModifier =
      (attackerTraits.aggressiveness + attackerTraits.bravery) /
      (defenderTraits.aggressiveness + defenderTraits.bravery);

    const finalProbability = attackerProbability * traitModifier;

    const attackerWins = Math.random() < finalProbability;
    const loser = attackerWins ? defender : attacker;

    // Calculate token burn
    const burnPercent =
      this.MIN_TOKEN_BURN_PERCENT +
      Math.random() *
        (this.MAX_TOKEN_BURN_PERCENT - this.MIN_TOKEN_BURN_PERCENT);
    const tokensBurned = Math.floor(loser.tokens * burnPercent);

    // Check for death
    const deathOccurred = Math.random() < this.BATTLE_DEATH_CHANCE;

    return {
      winner: attackerWins ? attacker.id : defender.id,
      loser: attackerWins ? defender.id : attacker.id,
      tokensBurned,
      deathOccurred,
    };
  }

  /**
   * Check if an alliance can be formed
   */
  static canFormAlliance(
    proposer: GameState,
    proposed: GameState,
    currentTime: number
  ): boolean {
    // Check cooldowns
    if (
      proposer.lastAllianceTime &&
      currentTime - proposer.lastAllianceTime < this.ALLIANCE_COOLDOWN
    ) {
      return false;
    }

    // Check if already allied
    if (proposer.alliances.includes(proposed.id as UUID)) {
      return false;
    }

    return true;
  }

  /**
   * Create an alliance proposal
   */
  static createAllianceProposal(
    proposerId: UUID,
    proposedId: UUID,
    currentTime: number
  ): AllianceProposal {
    return {
      proposer: proposerId,
      proposed: proposedId,
      timestamp: currentTime,
      expiresAt: currentTime + this.ALLIANCE_COOLDOWN,
    };
  }

  /**
   * Generate a tweet message based on game state and character
   */
  static generateTweetMessage(
    state: GameState,
    type: CharacterType,
    action?: string
  ): string {
    const traits = CHARACTER_STATS[type].traits;
    const terrain = state.currentTerrain?.type || "plain";

    let message = "";

    // Add character-specific flavor
    if (traits.intelligence < 0.5) {
      message += "Uhhh... ";
    }

    // Add position
    message += `I'm at (${state.position.x.toFixed(
      1
    )}, ${state.position.y.toFixed(1)}) on ${terrain} ground. `;

    // Add action if provided
    if (action) {
      message += action;
    } else {
      // Generate random flavor text based on character traits
      if (traits.aggressiveness > 0.7) {
        message += "Looking for a fight! ";
      } else if (traits.sociability > 0.7) {
        message += "Anyone want to be friends? ";
      }
    }

    // Add token count
    message += `\nTokens: ${state.tokens}`;

    return message;
  }
}
