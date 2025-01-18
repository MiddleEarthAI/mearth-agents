import {
  IAgentRuntime,
  composeContext,
  elizaLogger,
  stringToUuid,
  Memory,
  UUID,
  Content,
  getEmbeddingZeroVector,
  HandlerCallback,
  generateText,
  ModelClass,
  generateObjectDeprecated,
  parseActionResponseFromText,
} from "@elizaos/core";
import { TwitterPostClient } from "./post";
import { GameState } from "./types";
import { GameMechanics } from "./mechanics";
import { TwitterClientBase } from "./twitterBase";
import { mearthNewPositionTemplate } from "../../templates";
import { ActionResponse } from "../../types";
import { parseMearthActionFromText } from "../../utils/parsing";

export class MearthAutoClient {
  interval: NodeJS.Timeout;
  runtime: IAgentRuntime;
  lastMoveTime: number = 0;
  twitterClientBase: TwitterClientBase;

  constructor(runtime: IAgentRuntime, twitterClientBase: TwitterClientBase) {
    this.runtime = runtime;
    this.twitterClientBase = twitterClientBase;
  }

  async start() {
    elizaLogger.log("Starting MearthAutoClient...");
    if (!this.twitterClientBase.profile) {
      await this.twitterClientBase.init();
    }

    const MearthLoop = async () => {
      const roomId = stringToUuid(
        "twitter_generate_room-" + this.twitterClientBase.profile.username
      );

      const topics = this.runtime.character.topics.join(", ");

      const state = await this.runtime.composeState(
        {
          userId: this.runtime.agentId,
          roomId: roomId,
          agentId: this.runtime.agentId,
          content: {
            text: topics || "",
            action: "MOVE",
          },
        },
        {
          twitterUserName: this.twitterClientBase.profile.username,
        }
      );

      const context = composeContext({
        state,
        template: mearthNewPositionTemplate,
      });
      const content = await this.generateAgentAction({
        runtime: this.runtime,
        context: context,
        modelClass: ModelClass.LARGE,
      });

      const memory = {
        userId: this.runtime.agentId,
        agentId: this.runtime.agentId,
        content: content,
        roomId: roomId,
      };

      console.log(memory);

      const handlerCallback: HandlerCallback = async (error) => {
        if (error) {
          elizaLogger.error("Error processing actions:", error);
        }
        this.postUpdate(content.action);
        return [];
      };

      if (memory.content) {
        this.runtime.processActions(memory, [memory], state, handlerCallback);
      }

      const delay = 30000; // 30 seconds

      setTimeout(() => {
        MearthLoop(); // Set up next iteration
      }, delay);

      elizaLogger.log(`Next Mearth loop scheduled in ${delay} seconds`);
    };
  }

  private async postUpdate(action?: string) {}

  async generateAgentAction({
    runtime,
    context,
    modelClass,
  }: {
    runtime: IAgentRuntime;
    context: string;
    modelClass: ModelClass;
  }): Promise<ActionResponse | null> {
    let retryDelay = 1000;
    while (true) {
      try {
        const response = await generateText({
          runtime,
          context,
          modelClass,
        });
        console.debug(
          "Received response from generateText for action:",
          response
        );
        const { action } = parseMearthActionFromText(response.trim());

        if (action) {
          console.debug("Parsed tweet actions: ", action);
          return action;
        } else {
          elizaLogger.debug("generateTweetActions no valid response");
        }
      } catch (error) {
        elizaLogger.error("Error in generateAgentAction:", error);
      }

      elizaLogger.log(`Retrying in ${retryDelay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      retryDelay *= 2;
    }
  }
}
