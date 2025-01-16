import { Provider, State } from "@elizaos/core";
import { TerrainType } from "../types";

export interface GameMechanics {
  // Map Configuration
  map: {
    dimensions: { width: number; height: number };
    terrainDistribution: { [key in TerrainType]: number }; // Percentage of each terrain type
    terrainEffects: {
      [key in TerrainType]: {
        movementCost: number; // Movement points required
        defensiveBonus: number; // % increase in defense
        tokenBurnRate: number; // % of tokens burned per turn
        visibility: number; // View distance in tiles
      };
    };
  };

  // Time and Cooldowns (in seconds)
  cooldowns: {
    movement: number; // 1 hour
    battle: number; // 4 hours
    alliance: number; // 12 hours
    tokenStaking: number; // 24 hours
  };

  // Battle Mechanics
  battle: {
    minDistance: number; // Minimum distance to initiate battle
    maxDistance: number; // Maximum distance to initiate battle
    baseDeathChance: number; // Base probability of agent death
    tokenBurnMax: number; // Maximum percentage of tokens that can be burned
    terrainMultiplier: number; // How much terrain affects battle outcomes
    stakingMultiplier: number; // How much staked tokens affect battle outcomes
    allianceBonus: number; // Bonus for having allies nearby
  };

  // Token Economics
  tokenomics: {
    minStakeAmount: number; // Minimum tokens required to stake
    maxStakeAmount: number; // Maximum tokens that can be staked
    stakingRewardRate: number; // Daily reward rate for staking
    burnRate: number; // Rate at which tokens are burned in battles
    initialDistribution: number; // Initial tokens given to new agents
  };

  // Alliance System
  alliances: {
    maxAllies: number; // Maximum number of simultaneous allies
    minDuration: number; // Minimum alliance duration in hours
    maxDuration: number; // Maximum alliance duration in hours
    breakPenalty: number; // Token penalty for breaking alliance
    benefitMultiplier: number; // Multiplier for combined token power
  };

  // Community Interaction
  community: {
    influenceWeight: number; // How much community votes affect decisions
    maxDailyVotes: number; // Maximum votes per community member per day
    voteCooldown: number; // Cooldown between votes in hours
    rewardPool: number; // Daily reward pool for active voters
  };
}

class GameMechanicsProvider implements Provider {
  private mechanics: GameMechanics = {
    map: {
      dimensions: { width: 100, height: 100 },
      terrainDistribution: {
        [TerrainType.PLAIN]: 60,
        [TerrainType.RIVER]: 20,
        [TerrainType.MOUNTAIN]: 20,
      },
      terrainEffects: {
        [TerrainType.PLAIN]: {
          movementCost: 1,
          defensiveBonus: 0,
          tokenBurnRate: 0,
          visibility: 5,
        },
        [TerrainType.RIVER]: {
          movementCost: 2,
          defensiveBonus: 10,
          tokenBurnRate: 5,
          visibility: 3,
        },
        [TerrainType.MOUNTAIN]: {
          movementCost: 3,
          defensiveBonus: 25,
          tokenBurnRate: 10,
          visibility: 7,
        },
      },
    },
    cooldowns: {
      movement: 3600, // 1 hour
      battle: 14400, // 4 hours
      alliance: 43200, // 12 hours
      tokenStaking: 86400, // 24 hours
    },
    battle: {
      minDistance: 1,
      maxDistance: 3,
      baseDeathChance: 0.05,
      tokenBurnMax: 50,
      terrainMultiplier: 1.5,
      stakingMultiplier: 2.0,
      allianceBonus: 1.25,
    },
    tokenomics: {
      minStakeAmount: 100,
      maxStakeAmount: 10000,
      stakingRewardRate: 0.01, // 1% daily
      burnRate: 0.1, // 10% per battle
      initialDistribution: 1000,
    },
    alliances: {
      maxAllies: 2,
      minDuration: 24,
      maxDuration: 168, // 1 week
      breakPenalty: 500,
      benefitMultiplier: 1.5,
    },
    community: {
      influenceWeight: 0.7,
      maxDailyVotes: 10,
      voteCooldown: 1,
      rewardPool: 1000,
    },
  };

  async get(_runtime: any, _message: any, _state?: State): Promise<string> {
    return JSON.stringify(
      {
        mechanics: this.mechanics,
        description: `
        Middle Earth AI Game Mechanics:
        
        Map: ${this.mechanics.map.dimensions.width}x${
          this.mechanics.map.dimensions.height
        } grid with varied terrain
        Movement: Cooldown ${
          this.mechanics.cooldowns.movement / 3600
        }h, affected by terrain
        Battles: Range ${this.mechanics.battle.minDistance}-${
          this.mechanics.battle.maxDistance
        } tiles, ${this.mechanics.battle.tokenBurnMax}% max token burn
        Alliances: Max ${this.mechanics.alliances.maxAllies} allies, ${
          this.mechanics.alliances.minDuration
        }h minimum duration
        Tokens: Stake ${this.mechanics.tokenomics.minStakeAmount}-${
          this.mechanics.tokenomics.maxStakeAmount
        } tokens
        Community: ${
          this.mechanics.community.influenceWeight * 100
        }% influence weight on decisions
      `,
      },
      null,
      2
    );
  }

  getMechanics(): GameMechanics {
    return this.mechanics;
  }

  // Helper methods for game logic
  calculateMovementCost(terrain: TerrainType): number {
    return this.mechanics.map.terrainEffects[terrain].movementCost;
  }

  calculateBattleOutcome(
    attacker: { tokens: number; terrain: TerrainType; allies: number },
    defender: { tokens: number; terrain: TerrainType; allies: number }
  ): {
    success: boolean;
    tokensBurned: number;
    deathChance: number;
  } {
    const attackerPower =
      attacker.tokens *
      (1 + attacker.allies * this.mechanics.alliances.benefitMultiplier) *
      (1 / this.mechanics.map.terrainEffects[attacker.terrain].movementCost);

    const defenderPower =
      defender.tokens *
      (1 + defender.allies * this.mechanics.alliances.benefitMultiplier) *
      (1 +
        this.mechanics.map.terrainEffects[defender.terrain].defensiveBonus /
          100);

    const success = attackerPower > defenderPower;
    const tokensBurned = Math.min(
      defender.tokens * this.mechanics.tokenomics.burnRate,
      defender.tokens * (this.mechanics.battle.tokenBurnMax / 100)
    );
    const deathChance =
      this.mechanics.battle.baseDeathChance * (defenderPower / attackerPower);

    return { success, tokensBurned, deathChance };
  }

  isValidMove(distance: number, lastMoveTime: number): boolean {
    const timeSinceLastMove = Date.now() - lastMoveTime;
    return timeSinceLastMove >= this.mechanics.cooldowns.movement;
  }

  isValidBattle(distance: number, lastBattleTime: number): boolean {
    const timeSinceLastBattle = Date.now() - lastBattleTime;
    return (
      distance >= this.mechanics.battle.minDistance &&
      distance <= this.mechanics.battle.maxDistance &&
      timeSinceLastBattle >= this.mechanics.cooldowns.battle
    );
  }

  calculateStakingRewards(amount: number, duration: number): number {
    const dailyReward = amount * this.mechanics.tokenomics.stakingRewardRate;
    return dailyReward * (duration / 86400); // Convert duration to days
  }
}

export const gameMechanicsProvider = new GameMechanicsProvider();
