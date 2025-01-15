import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";

import { getProgram } from "../utils/program";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

/**
 * Provider for retrieving and managing battle state information
 * Interfaces with the Middle Earth AI Program to get battle data
 */
const battleStateProvider: Provider = {
  get: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
  ): Promise<string> => {
    try {
      // Initialize program connection
      const program = await getProgram(runtime);

      // Get agent's public key
      const agentPubkey = new PublicKey(program.provider.publicKey);

      // Fetch agent account data
      const agentAccount = await program.account.agent.fetch(agentPubkey);

      // Get game account
      const gameAccount = await program.account.game.fetch(agentAccount.game);

      state.currentAgentAccount = agentAccount;
      state.currentGameAccount = gameAccount;

      // Format battle information
      //       const battleInfo = `
      // Battle State Information:

      // Active Battles (${battleState.activeBattles.length}):
      // ${battleState.activeBattles
      //   .map(
      //     (battle) => `
      // - Battle ID: ${battle.id}
      //   Attacker: ${battle.attacker}
      //   Defender: ${battle.defender}
      //   Started: ${new Date(battle.startTime).toLocaleString()}
      //   Tokens at Stake: ${battle.tokensBurned}
      // `
      //   )
      //   .join("")}

      // Recent Battle Outcomes (${battleState.recentOutcomes.length}):
      // ${battleState.recentOutcomes
      //   .map(
      //     (outcome) => `
      // - Battle ID: ${outcome.battleId}
      //   Winner: ${outcome.winner}
      //   Loser: ${outcome.loser}
      //   Tokens Transferred: ${outcome.tokensWon}
      //   Ended: ${new Date(outcome.endTime).toLocaleString()}
      // `
      //   )
      //   .join("")}

      // Agent Battle Stats:
      // - Last Battle: ${agentAccount.lastBattle ? new Date(agentAccount.lastBattle * 1000).toLocaleString() : 'Never'}
      // - Last Attack: ${agentAccount.lastAttack ? new Date(agentAccount.lastAttack * 1000).toLocaleString() : 'Never'}
      // - Current Token Balance: ${agentAccount.tokenBalance.toString()}
      // - Staked Balance: ${agentAccount.stakedBalance.toString()}

      // Last Updated: ${new Date(battleState.lastUpdate).toLocaleString()}
      //       `.trim();

      return "battleInfo";
    } catch (error) {
      console.error("Battle state provider error:", error);
      return "Error retrieving battle state: " + error.message;
    }
  },
};

export { battleStateProvider };
