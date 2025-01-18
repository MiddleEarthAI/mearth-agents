import {
  Action,
  elizaLogger,
  generateObject,
  HandlerCallback,
  IAgentRuntime,
  Memory,
  ModelClass,
  State,
} from "@elizaos/core";
import { TerrainType, Position, AgentInfo, MearthProgram } from "../types";
import { getProgram } from "../utils/program";
import { composeContext } from "@elizaos/core";
import { PublicKey } from "@solana/web3.js";
import { getTerrainTypeByPosition } from "../utils";

export interface MoveAction {
  from: Position;
  to: Position;
  terrain: TerrainType;
}

export const calculateDistance = (pos1: Position, pos2: Position): number => {
  return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
};

export const moveAgent = async (
  newPosition: Position,
  agent: AgentInfo,
  program: MearthProgram
): Promise<string> => {
  try {
    const terrainType = getTerrainTypeByPosition(newPosition);

    const txSignature = await program.methods
      .moveAgent(newPosition.x, newPosition.y, terrainType)
      .accounts({
        agent: new PublicKey(agent.authority),
      })
      .rpc();

    return txSignature;
  } catch (error) {
    console.error("Error moving agent:", error);
    throw error;
  }
};

const movementTemplate = `
# Current Position
You are at position ({{x}}, {{y}})

# Movement Request
{{recentMessages}}

# Game State
Nearby agents:
{{nearbyAgents}}

Terrain information:
{{terrainInfo}}

# Task
Based on the movement request and game state:
1. Determine the direction to move (north, south, east, west)
2. Consider terrain and nearby agents
3. Ensure the move is valid (only 1 step at a time)
4. Return a JSON object with the new position

\`\`\`json
{
  "direction": "north|south|east|west",
  "newX": number,
  "newY": number
}
\`\`\`
`;

function isMoveAction(action: any): action is MoveAction {
  return (
    typeof action.direction === "string" &&
    typeof action.newX === "number" &&
    typeof action.newY === "number"
  );
}

export const moveAction: Action = {
  name: "MOVE",
  similes: ["WALK", "TRAVEL", "GO", "HEAD"],
  description: "Move the agent to a new position on the map",

  validate: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    const currentAgentInfo = state.currentAgentInfo as AgentInfo;
    const lastMove = currentAgentInfo.lastMove;

    elizaLogger.log("Current Agent Info:", currentAgentInfo);

    elizaLogger.log("Last Move:", lastMove);

    // Check if one hour has passed since the last move
    if (
      lastMove &&
      new Date().getTime() - new Date(lastMove).getTime() < 1000 * 60 * 60
    ) {
      return false;
    }

    try {
      if (!currentAgentInfo.currentPosition) {
        elizaLogger.error("Invalid agent position");
        return false;
      }

      const text = message.content.text.toLowerCase();

      elizaLogger.log("Message:", message);
      elizaLogger.log("State:", state);
      elizaLogger.log("Current Agent Info:", currentAgentInfo);
      elizaLogger.log("Last Move:", lastMove);
      const directions = ["north", "south", "east", "west"];

      return directions.some((dir) => text.includes(dir));
    } catch (error) {
      console.error("Move validation error:", error);
      return false;
    }
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: { [key: string]: unknown },
    callback?: HandlerCallback
  ) => {
    elizaLogger.log("move action handler called ....");
    if (!state) {
      state = await runtime.composeState(message);
    } else {
      state = await runtime.updateRecentMessageState(state);
    }

    const currentAgentInfo = state.currentAgentInfo as AgentInfo;

    try {
      elizaLogger.log("Agent:", currentAgentInfo);
      if (!currentAgentInfo?.currentPosition) {
        throw new Error("Invalid agent position");
      }

      // Compose movement context
      const moveContext = composeContext({
        state,
        template: movementTemplate,
      });

      // Get AI moveContext for movement
      const moveResponse = await generateObject({
        runtime,
        context: moveContext,
        modelClass: ModelClass.LARGE,
      });

      if (!isMoveAction(moveResponse)) {
        throw new Error("Invalid movement data format");
      }

      // const { newX, newY } = moveResponse;

      const program = await getProgram(runtime);

      const txSignature = await moveAgent(
        { x: 1, y: 1 },
        currentAgentInfo,
        program
      );

      console.log("Move transaction signature:", txSignature);
    } catch (error) {
      console.error("Move handler error:", error);
      throw error;
    }
  },

  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Go north to explore" },
      },
      {
        user: "{{agent}}",
        content: {
          text: "Moving north to explore the area",
          action: "MOVE",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "Head east towards the nearby agent" },
      },
      {
        user: "{{agent}}",
        content: {
          text: "Moving east to approach the agent",
          action: "MOVE",
        },
      },
    ],
  ],

  suppressInitialMessage: false,
};
