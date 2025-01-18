import { Action, Memory, State, Content, HandlerCallback } from "@elizaos/core";
import { AgentInfo, MearthProgram } from "../types";
import { BATTLE_COOLDOWN } from "../constants";
import { Program } from "@coral-xyz/anchor";
import { getProgram } from "../utils/program";

export interface BattleContent extends Content {
  text: string;
  action: string;
  targetAgentId: string;
}

export const BATTLE_ACTION: Action = {
  name: "BATTLE",
  similes: ["battle", "attack", "fight"],
  description: "Initiate a battle with another agent",
  examples: [
    [
      {
        user: "user1",
        content: {
          text: "Battle agent2",
          action: "BATTLE",
          targetAgentId: "agent2",
        },
      },
    ],
  ],
  validate: async (runtime, memory: Memory, state: State) => {
    const content = memory.content as BattleContent;
    const targetAgentId = content.targetAgentId;

    // Get target agent from state
    const agents = (state.agents || []) as AgentInfo[];
    const targetAgent = agents.find((agent) => agent.id === targetAgentId);

    if (!targetAgent) {
      throw new Error("Target agent not found");
    }

    if (!targetAgent.isAlive) {
      throw new Error("Target agent is not alive");
    }

    // Check battle cooldown
    const now = Date.now();
    const lastBattle = Number(targetAgent.lastBattle) || 0;
    if (now - lastBattle < BATTLE_COOLDOWN * 1000) {
      // Convert seconds to milliseconds
      throw new Error("Target agent is still in battle cooldown");
    }

    return true;
  },
  handler: async (
    runtime,
    memory: Memory,
    state: State,
    _options: any,
    callback: HandlerCallback
  ) => {
    const content = memory.content as BattleContent;
    const targetAgentId = content.targetAgentId;

    try {
      // Get target agent from state
      const agents = (state.agents || []) as AgentInfo[];
      const targetAgent = agents.find((agent) => agent.id === targetAgentId);

      if (!targetAgent) {
        throw new Error("Target agent not found");
      }

      // Get the Anchor program
      const program = await getProgram(runtime);

      if (!program) {
        throw new Error("Anchor program not found");
      }

      // const tx = await program.methods
      //   .initiateBattle()
      //   .accounts({
      //     initiator: memory.agentId,
      //     target: targetAgentId,
      //     game: state.game,
      //     authority: state.authority,
      //   })
      //   .rpc();

      // await callback(
      //   {
      //     text: `Battle initiated with ${targetAgentId}. Transaction: ${tx}`,
      //   },
      //   []
      // );
    } catch (error) {
      throw new Error(`Failed to initiate battle: ${error.message}`);
    }
  },
};
