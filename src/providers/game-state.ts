import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";

import { getProgram } from "../utils/program";
import { getGamePDA } from "../utils/pda";

async function getGameState(runtime: IAgentRuntime) {
  const program = await getProgram(runtime);

  const [gamePDA, _] = getGamePDA(2, program.programId);
  const gameAccount = await program.account.game.fetch(gamePDA);
  const gameState = {
    agents: gameAccount.agents,
    isActive: gameAccount.isActive,
  };

  return gameState;
}

export const gameStateProvider: Provider = {
  async get(
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
  ): Promise<string> {
    const gameState = await getGameState(runtime);

    state.agents = gameState.agents;

    const mapSize = runtime.getSetting("MAP_SIZE");
    const moveInterval = runtime.getSetting("MOVE_INTERVAL");
    const battleInterval = runtime.getSetting("BATTLE_INTERVAL");
    const allianceInterval = runtime.getSetting("ALLIANCE_INTERVAL");
    const minStakeAmount = runtime.getSetting("MIN_STAKE_AMOUNT");
    const tokenMint = runtime.getSetting("TOKEN_MINT");

    return `
Game State Information:
- Total Agents: ${gameState.agents}
- Active Agents: ${gameState.agents}
- Map Size: ${mapSize}
- Move Interval: ${moveInterval}s
- Battle Interval: ${battleInterval}s
- Alliance Interval: ${allianceInterval}s
- Min Stake: ${minStakeAmount} MEARTH
- Token Mint: ${tokenMint}
    `.trim();
  },
};
