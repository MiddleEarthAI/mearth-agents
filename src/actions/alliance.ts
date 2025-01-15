import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  elizaLogger,
} from "@elizaos/core";
import { ActionType } from "./types";
import { AgentInfo } from "../types";
import { calculateDistance } from "./movement";
import { TokenProvider } from "@elizaos/plugin-solana";
import { PublicKey } from "@solana/web3.js";
import { walletProvider } from "../providers/wallet";

// Constants
const ALLIANCE_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours
const BATTLE_COOLDOWN = 4 * 60 * 60 * 1000; // 4 hours
const ALLIANCE_RANGE = 5; // Maximum distance for alliance

// Action interfaces
export interface AllianceAction {
  type: ActionType.ALLIANCE;
  initiator: string;
  ally: string;
  combinedTokens: number;
  initiatorWallet: string;
  allyWallet: string;
}

export interface IgnoreAction {
  type: ActionType.IGNORE;
  initiator: string;
  target: string;
  cooldownEnd: number;
}

// Helper functions
const canFormAlliance = async (
  runtime: IAgentRuntime,
  agent1: AgentInfo,
  agent2: AgentInfo
): Promise<boolean> => {
  // Check distance
  const distance = calculateDistance(
    agent1.currentPosition,
    agent2.currentPosition
  );
  if (distance > ALLIANCE_RANGE) {
    elizaLogger.debug(`Alliance failed - agents too far apart: ${distance}`);
    return false;
  }

  // Check existing alliance
  if (agent1.allianceWith === agent2.id) {
    elizaLogger.debug("Alliance failed - already allied");
    return false;
  }

  // Get providers
  const providers = runtime.providers;
  const walletInfo = await walletProvider.get(runtime, null, null);

  return false;
};

// Alliance Action
export const allianceAction: Action = {
  name: "ALLIANCE",
  similes: ["ALLY", "TEAM_UP", "JOIN_FORCES", "UNITE"],
  description: "Form an alliance with another agent within range",

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
  ): Promise<boolean> => {
    try {
      const initiator = state.currentAgent as AgentInfo;
      const text = message.content.text.toLowerCase();

      const ally = initiator.allianceWith;

      if (!ally) {
        elizaLogger.debug("Alliance validation failed - no target mentioned");
        return false;
      }

      // return canFormAlliance(runtime, initiator, ally);
      false;
    } catch (error) {
      elizaLogger.error("Alliance validation error:", error);
      return false;
    }
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
  ): Promise<void> => {
    try {
      const initiator = state.currentAgent as AgentInfo;
      const text = message.content.text.toLowerCase();
    } catch (error) {
      elizaLogger.error("Alliance handler error:", error);
      throw error;
    }
  },

  examples: [
    [
      {
        user: "user1",
        content: { text: "Let's form an alliance with Agent2!" },
      },
      {
        user: "agent",
        content: {
          text: "Proposing an alliance with Agent2. Together we'll be stronger!",
          action: "ALLIANCE",
        },
      },
    ],
  ],

  suppressInitialMessage: false,
};

// Ignore Action
export const ignoreAction: Action = {
  name: "IGNORE",
  similes: ["AVOID", "SKIP", "PASS"],
  description:
    "Choose to ignore another agent, preventing interactions for a cooldown period",

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
  ): Promise<boolean> => {
    try {
      const initiator = state.currentAgent as AgentInfo;
      const text = message.content.text.toLowerCase();

      //   return state.agents.some(
      //     (agent) =>
      //       agent.id !== initiator.id && text.includes(agent.name.toLowerCase())
      //   );
    } catch (error) {
      elizaLogger.error("Ignore validation error:", error);
      return false;
    }
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State
  ): Promise<void> => {
    try {
      const initiator = state.currentAgent as AgentInfo;
      const text = message.content.text.toLowerCase();

      const cooldownEnd = Date.now() + BATTLE_COOLDOWN;
    } catch (error) {
      elizaLogger.error("Ignore handler error:", error);
      throw error;
    }
  },

  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Let's ignore Agent2 for now" },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll ignore Agent2 for the next 4 hours",
          action: "IGNORE",
        },
      },
    ],
  ],

  suppressInitialMessage: false,
};
