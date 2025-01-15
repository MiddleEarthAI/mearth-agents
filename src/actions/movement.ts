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
import { TerrainType, Position, AgentInfo } from "../types";
import { program } from "../utils/program";
import { composeContext } from "@elizaos/core";
import { PublicKey } from "@solana/web3.js";

export interface MoveAction {
  from: Position;
  to: Position;
  terrain: TerrainType;
}

export const calculateDistance = (pos1: Position, pos2: Position): number => {
  return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
};

const getTerrainTypeByPosition = (position: Position): TerrainType => {
  const mountains = new Set([
    "6,12",
    "6,13",
    "7,13",
    "12,15",
    "13,15",
    "13,14",
    "13,13",
    "13,12",
    "13,11",
    "13,10",
    "14,11",
    "14,10",
    "15,10",
    "15,9",
    "16,9",
    "16,8",
    "17,8",
    "18,8",
    "19,8",
    "20,8",
    "21,8",
    "22,8",
    "19,9",
    "21,7",
    "22,7",
    "4,24",
    "5,24",
    "5,23",
    "6,23",
    "7,22",
    "8,22",
    "8,21",
    "8,20",
    "9,20",
    "13,23",
    "14,23",
    "14,22",
    "15,22",
    "15,24",
    "15,25",
    "15,26",
    "15,27",
    "15,28",
    "16,28",
    "14,24",
    "14,25",
    "14,26",
    "17,27",
    "17,26",
    "18,26",
    "18,25",
    "19,25",
    "19,24",
    "20,24",
    "21,24",
    "22,24",
    "22,23",
    "22,13",
    "23,13",
    "22,14",
    "23,14",
    "24,14",
    "24,15",
    "25,15",
    "25,16",
    "26,16",
    "26,17",
    "27,17",
    "28,17",
    "29,17",
    "27,18",
    "28,18",
    "29,18",
    "28,19",
    "29,19",
    "29,20",
  ]);

  const water = new Set([
    "27,7",
    "27,8",
    "27,9",
    "27,10",
    "27,11",
    "27,12",
    "27,13",
    "27,14",
    "27,15",
    "27,16",
    "26,11",
    "26,12",
    "26,13",
    "26,14",
    "26,15",
    "28,13",
    "28,14",
    "28,16",
    "29,14",
    "29,15",
    "7,3",
    "8,3",
    "9,3",
    "9,4",
    "10,4",
    "10,5",
    "10,6",
    "10,7",
    "11,7",
    "11,8",
    "11,9",
    "10,9",
    "10,10",
    "10,11",
    "9,11",
    "9,12",
    "9,13",
    "8,13",
    "3,20",
    "3,19",
    "3,18",
    "4,23",
    "4,22",
    "4,21",
    "4,20",
    "4,19",
    "4,18",
    "4,17",
    "4,16",
    "5,22",
    "6,22",
    "5,21",
    "7,21",
    "5,20",
    "6,20",
    "7,20",
    "5,16",
    "5,15",
    "6,15",
    "6,14",
    "7,15",
    "7,14",
    "8,15",
    "9,15",
    "9,16",
    "10,16",
    "10,17",
    "10,18",
    "10,19",
    "10,20",
    "11,17",
    "11,18",
    "12,18",
    "12,19",
    "13,18",
    "13,19",
    "13,20",
    "14,19",
    "14,20",
    "14,21",
    "15,21",
    "16,21",
    "17,21",
    "18,21",
    "18,20",
    "17,20",
    "17,19",
    "16,19",
    "15,19",
    "9,21",
    "9,22",
    "9,23",
    "9,24",
    "9,25",
    "9,26",
    "9,27",
    "10,27",
    "11,27",
    "11,26",
    "11,25",
    "10,25",
    "10,24",
  ]);

  const positionKey = `${position.x},${position.y}`;

  if (mountains.has(positionKey)) {
    return TerrainType.MOUNTAIN;
  } else if (water.has(positionKey)) {
    return TerrainType.RIVER;
  } else {
    return TerrainType.PLAIN;
  }
};

export const moveAgent = async (
  newPosition: Position,
  agent: AgentInfo
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

      const { newX, newY } = moveResponse;

      const txSignature = await moveAgent(runtime, {
        from: currentAgentInfo.currentPosition,
        to: { x: newX, y: newY },
        terrain: TerrainType.PLAIN,
      });
      console.log("Move transaction signature:", txSignature);
    } catch (error) {
      console.error("Move handler error:", error);
      throw error;
    }
  },

  examples: [
    [
      {
        user: "user1",
        content: { text: "Go north to explore" },
      },
      {
        user: "agent",
        content: {
          text: "Moving north to explore the area",
          action: "MOVE",
        },
      },
    ],
    [
      {
        user: "user1",
        content: { text: "Head east towards the nearby agent" },
      },
      {
        user: "agent",
        content: {
          text: "Moving east to approach the agent",
          action: "MOVE",
        },
      },
    ],
  ],

  suppressInitialMessage: false,
};
