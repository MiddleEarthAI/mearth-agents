import { Provider, BattleState, Battle, BattleOutcome } from "./types";

export class BattleStateProvider implements Provider {
  name = "battle_state_provider";
  description =
    "Provides battle state including active battles and recent outcomes";
  private state: BattleState = {
    activeBattles: [],
    recentOutcomes: [],
    lastUpdate: 0,
  };

  async initialize(): Promise<void> {
    // Initialize battle state
    // TODO: Load any persisted battle data
  }

  async update(): Promise<void> {
    // Update battle state
    // TODO: Update active battles and outcomes
    this.cleanupOldBattles();
  }

  getState(): Promise<BattleState> {
    return Promise.resolve(this.state);
  }

  addBattle(battle: Battle): void {
    this.state.activeBattles.push(battle);
  }

  recordOutcome(outcome: BattleOutcome): void {
    // Remove the battle from active battles
    this.state.activeBattles = this.state.activeBattles.filter(
      (battle) => battle.id !== outcome.battleId
    );

    // Add to recent outcomes
    this.state.recentOutcomes.push(outcome);

    // Keep only last 24 hours of outcomes
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.state.recentOutcomes = this.state.recentOutcomes.filter(
      (outcome) => outcome.endTime > oneDayAgo
    );
  }

  private cleanupOldBattles(): void {
    const now = Date.now();
    this.state.activeBattles = this.state.activeBattles.filter((battle) => {
      const battleEndTime = battle.startTime + battle.duration;
      return battleEndTime > now;
    });
  }

  getActiveBattlesForAgent(agentId: string): Battle[] {
    return this.state.activeBattles.filter(
      (battle) => battle.attacker === agentId || battle.defender === agentId
    );
  }

  getRecentOutcomesForAgent(agentId: string): BattleOutcome[] {
    return this.state.recentOutcomes.filter(
      (outcome) => outcome.winner === agentId || outcome.loser === agentId
    );
  }

  canInitiateBattle(attackerId: string, defenderId: string): boolean {
    // Check if either agent is already in a battle
    const existingBattle = this.state.activeBattles.find(
      (battle) =>
        battle.attacker === attackerId ||
        battle.attacker === defenderId ||
        battle.defender === attackerId ||
        battle.defender === defenderId
    );

    return !existingBattle;
  }
}
