import { IAgentRuntime, Memory, State } from "@elizaos/core";
import { Action, ActionType, TerrainType } from "./types";
import { Position, Agent } from "../types";

export interface MoveAction {
  type: ActionType.MOVE;
  from: Position;
  to: Position;
  terrain: TerrainType;
  speedModifier: number;
}

export const calculateDistance = (pos1: Position, pos2: Position): number => {
  return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
};

export const getTerrainType = (pos: Position): TerrainType => {
  // Simplified terrain check - can be enhanced with actual map data
  if (pos.y > 80) return TerrainType.MOUNTAINS;
  if (pos.x < 20) return TerrainType.RIVER;
  return TerrainType.PLAINS;
};

export const getSpeedModifier = (terrain: TerrainType): number => {
  switch (terrain) {
    case TerrainType.MOUNTAINS:
      return 0.5; // 50% speed reduction
    case TerrainType.RIVER:
      return 0.3; // 70% speed reduction
    default:
      return 1.0;
  }
};

export const shouldAgentDie = (terrain: TerrainType): boolean => {
  if (terrain === TerrainType.PLAINS) return false;
  return Math.random() < 0.01; // 1% death chance in difficult terrain
};

export const isValidMove = (from: Position, to: Position): boolean => {
  const distance = calculateDistance(from, to);
  return distance <= 1; // Can only move 1 unit per hour
};

export const moveAction: Action = {
  name: "MOVE",
  similes: ["WALK", "TRAVEL", "GO", "HEAD"],
  description:
    "Move the agent to a new position on the map, considering terrain effects",

  validate: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    try {
      const agent = state?.currentAgent as Agent;

      if (!agent?.position) {
        console.error("Invalid agent position");
        return false;
      }

      // Extract destination from message
      const text = message.content.text.toLowerCase();
      const directions = ["north", "south", "east", "west"];

      return directions.some((dir) => text.includes(dir));
    } catch (error) {
      console.error("Move validation error:", error);
      return false;
    }
  },

  handler: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    try {
      const agent = state?.currentAgent as Agent;
      const currentPos = agent.position;

      // Parse direction from message
      const text = message.content.text.toLowerCase();
      let newPos = { ...currentPos };

      if (text.includes("north")) newPos.y += 1;
      if (text.includes("south")) newPos.y -= 1;
      if (text.includes("east")) newPos.x += 1;
      if (text.includes("west")) newPos.x -= 1;

      if (!isValidMove(currentPos, newPos)) {
        throw new Error("Invalid move distance");
      }

      const terrain = getTerrainType(newPos);
      const speedMod = getSpeedModifier(terrain);

      // Check for death in difficult terrain
      if (shouldAgentDie(terrain)) {
        await runtime.processAction("DIE", message);
        return;
      }

      // Create move action
      const moveAction: MoveAction = {
        type: ActionType.MOVE,
        from: currentPos,
        to: newPos,
        terrain,
        speedModifier: speedMod,
      };

      // Update agent position
      agent.position = newPos;
      await runtime.updateState({ currentAgent: agent });

      console.log(
        `Agent moved from (${currentPos.x},${currentPos.y}) to (${newPos.x},${newPos.y})`
      );
    } catch (error) {
      console.error("Move handler error:", error);
      throw error;
    }
  },

  examples: [
    [
      {
        user: "user1",
        content: { text: "I'm heading North to find my enemies" },
      },
      {
        user: "agent",
        content: {
          text: "Moving northward through the plains",
          action: "MOVE",
        },
      },
    ],
    [
      {
        user: "user1",
        content: { text: "Let's cross the river to the west" },
      },
      {
        user: "agent",
        content: {
          text: "Carefully crossing the river, though it's slowing me down",
          action: "MOVE",
        },
      },
    ],
  ],

  suppressInitialMessage: false,
};
