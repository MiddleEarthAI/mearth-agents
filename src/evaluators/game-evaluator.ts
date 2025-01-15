import {
  elizaLogger,
  Evaluator,
  IAgentRuntime,
  Memory,
  ModelClass,
  State,
} from "@elizaos/core";
import { generateObjectArray, composeContext } from "@elizaos/core";
import { MemoryManager } from "@elizaos/core";

interface GameState {
  position: { x: number; y: number };
  health: number;
  resources: number;
}

interface GameEvaluation {
  status: string;
  threats: string[];
  opportunities: string[];
  recommendations: string[];
}

const gameTemplate = `TASK: Evaluate the current game state and provide strategic recommendations.

# START OF EXAMPLES
These are examples of the expected output of this task:
{{evaluationExamples}}
# END OF EXAMPLES

# INSTRUCTIONS
Analyze the current game state and provide:
- Overall status assessment
- Potential threats and risks
- Available opportunities
- Strategic recommendations

Current Game State:
Position: {{position}}
Health: {{health}}
Resources: {{resources}}

Response should be a JSON object inside a JSON markdown block. Correct response format:
\`\`\`json
{
  "status": string,
  "threats": string[],
  "opportunities": string[],
  "recommendations": string[]
}
\`\`\``;

async function handler(runtime: IAgentRuntime, message: Memory, state: State) {
  try {
    const gameState = state.gameState as GameState;

    const context = composeContext({
      state: {
        ...state,
        position: `(${gameState.position.x}, ${gameState.position.y})`,
        health: gameState.health,
        resources: gameState.resources,
      },
      template: gameTemplate,
    });

    const evaluation = await generateObjectArray({
      runtime,
      context,
      modelClass: ModelClass.LARGE,
    });

    if (!evaluation) {
      return null;
    }

    const memoryManager = new MemoryManager({
      runtime,
      tableName: "game-state",
    });

    const gameMemory = await memoryManager.addEmbeddingToMemory({
      agentId: runtime.agentId,
      userId: runtime.agentId,
      content: {
        text: `Game Analysis:\n${
          evaluation[0].status
        }\n\nThreats:\n${evaluation[0].threats.join(
          "\n"
        )}\n\nOpportunities:\n${evaluation[0].opportunities.join(
          "\n"
        )}\n\nRecommendations:\n${evaluation[0].recommendations.join("\n")}`,
        metadata: {
          evaluation,
          gameState,
        },
      },
      roomId: message.roomId,
      createdAt: Date.now(),
    });

    await memoryManager.createMemory(gameMemory, true);

    return evaluation;
  } catch (error) {
    elizaLogger.error("Game evaluator handler error:", error);
    throw error;
  }
}

export const gameEvaluator: Evaluator = {
  name: "GAME_EVALUATOR",
  similes: ["STRATEGY_ADVISOR", "TACTICAL_ANALYST", "GAME_STRATEGIST"],
  description: "Evaluates game state and provides strategic recommendations",
  validate: async (
    runtime: IAgentRuntime,
    message: Memory
  ): Promise<boolean> => {
    try {
      const messageCount = await runtime.messageManager.countMemories(
        message.roomId
      );
      return messageCount % 5 === 0;
    } catch (error) {
      elizaLogger.error("Game evaluator validation error:", error);
      return false;
    }
  },
  handler,
  examples: [
    {
      context:
        "Current game state shows player at position (10,5) with 50% health and 100 resources",
      messages: [
        {
          user: "GAME_EVALUATOR",
          content: {
            text: "Evaluate current game state",
          },
        },
      ],
      outcome: `\`\`\`json
{
  "status": "Vulnerable but resource-advantaged position",
  "threats": [
    "Low health makes combat risky",
    "Exposed position in resource area"
  ],
  "opportunities": [
    "Rich resource nodes nearby",
    "Good defensive positions available"  
  ],
  "recommendations": [
    "Gather nearby resources to strengthen position",
    "Find defensive position to recover health",
    "Avoid combat until health improves"
  ]
}
\`\`\``,
    },
  ],
};
