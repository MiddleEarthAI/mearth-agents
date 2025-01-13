import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";
import { BattleState, Battle, BattleOutcome } from "./types";

const battleStateProvider: Provider = {
  get: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
  ): Promise<string> => {
    try {
      // const battleState = state?.battleState as BattleState;
      // if (!battleState) {
      //   return "No battle state available";
      // }

      const agentId = runtime.agentId;
      const battleState = {
        activeBattles: [],
        recentOutcomes: [],
        lastUpdate: new Date().toISOString(),
      };

      // Get active battles for this agent
      const activeBattles = battleState.activeBattles.filter(
        (battle) => battle.attacker === agentId || battle.defender === agentId
      );

      // Get recent battle outcomes for this agent
      const recentOutcomes = battleState.recentOutcomes.filter(
        (outcome) => outcome.winner === agentId || outcome.loser === agentId
      );

      // Format battle information
      const battleInfo = `
Battle State Information:

Active Battles (${activeBattles.length}):
${activeBattles
  .map(
    (battle) => `
- Battle ID: ${battle.id}
  Attacker: ${battle.attacker}
  Defender: ${battle.defender}
  Started: ${new Date(battle.startTime).toLocaleString()}
  Tokens Burned: ${battle.tokensBurned}
`
  )
  .join("")}

Recent Battle Outcomes (${recentOutcomes.length}):
${recentOutcomes
  .map(
    (outcome) => `
- Battle ID: ${outcome.battleId}
  Winner: ${outcome.winner}
  Loser: ${outcome.loser}
  Tokens Won: ${outcome.tokensWon}
  Ended: ${new Date(outcome.endTime).toLocaleString()}
`
  )
  .join("")}

Last Updated: ${new Date(battleState.lastUpdate).toLocaleString()}
      `.trim();

      return battleInfo;
    } catch (error) {
      console.error("Battle state provider error:", error);
      return "Battle state temporarily unavailable";
    }
  },
};

export { battleStateProvider };
