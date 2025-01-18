import {
  Client,
  composeContext,
  elizaLogger,
  generateText,
  HandlerCallback,
  IAgentRuntime,
  ModelClass,
  State,
  stringToUuid,
} from "@elizaos/core";
import { TwitterClient } from "./twitter";
import { validateTwitterConfig, TwitterConfig } from "./environment";
import { mearthNewPositionTemplate } from "../../templates";
import { parseMearthActionFromText } from "../../utils/parsing";
import { retryWithBackoff } from "../../utils";
import { MearthActionResponse } from "../../types";

/**
 * MearthClient handles Twitter interactions and agent actions
 */
class MearthClient {
  public twitterClient: TwitterClient;
  private runtime: IAgentRuntime;
  private isRunning: boolean = false;
  private readonly LOOP_INTERVAL = 30000; // 30 seconds

  constructor(runtime: IAgentRuntime, twitterConfig: TwitterConfig) {
    this.runtime = runtime;
    this.twitterClient = new TwitterClient(runtime, twitterConfig);
  }

  async start() {
    elizaLogger.log("Starting MearthClient...");
    if (!this.twitterClient.profile) {
      await this.twitterClient.init();
    }
    this.isRunning = true;
    while (this.isRunning) {
      try {
        await this.processSingleIteration();
        await new Promise((resolve) => setTimeout(resolve, this.LOOP_INTERVAL));
      } catch (error) {
        elizaLogger.error("Error in Mearth loop:", error);
        // Continue loop even after error
      }
    }
  }
  private async processSingleIteration() {
    const roomId = stringToUuid(
      `twitter_generate_room-${this.twitterClient.profile.username}`
    );
    const topics = this.runtime.character.topics.join(", ");

    const state = await this.runtime.composeState(
      {
        userId: this.runtime.agentId,
        roomId,
        agentId: this.runtime.agentId,
        content: {
          text: topics || "",
          action: "MOVE",
        },
      },
      {
        twitterUserName: this.twitterClient.profile.username,
      }
    );

    const context = composeContext({
      state,
      template: mearthNewPositionTemplate,
    });

    const content = await this.generateAgentAction({
      runtime: this.runtime,
      context,
      modelClass: ModelClass.LARGE,
    });

    if (content) {
      const memory = {
        userId: this.runtime.agentId,
        agentId: this.runtime.agentId,
        content: {
          ...content,
          text: content.text || "", // Ensure text property exists
        },
        roomId,
      };

      const handlerCallback: HandlerCallback = async (error) => {
        if (error) {
          elizaLogger.error("Error processing actions:", error);
        }
        this.postUpdate(content.text);
        return [];
      };

      await this.runtime.processActions(
        memory,
        [memory],
        state,
        handlerCallback
      );
    }

    elizaLogger.log(`Next Mearth loop scheduled in ${this.LOOP_INTERVAL}ms`);
  }

  private postUpdate = async (action?: string) => {
    this.twitterClient.postTweet(action);
  };

  private generateAgentAction = async ({
    runtime,
    context,
    modelClass,
  }: {
    runtime: IAgentRuntime;
    context: string;
    modelClass: ModelClass;
  }): Promise<MearthActionResponse | null> => {
    return retryWithBackoff(
      async () => {
        try {
          const response = await generateText({
            runtime,
            context,
            modelClass,
          });
          elizaLogger.debug(
            "Received response from generateText for action:",
            response
          );
          const { action } = parseMearthActionFromText(response.trim());

          if (action) {
            elizaLogger.debug("Parsed tweet actions: ", action);
            return action;
          }
          elizaLogger.debug("generateTweetActions no valid response");
          return null;
        } catch (error) {
          elizaLogger.error("Error in generateAgentAction:", error);
          throw error; // Rethrow for retry mechanism
        }
      },
      5,
      1000
    );
  };

  async stop() {
    this.isRunning = false;
    elizaLogger.log("Stopping MearthClient...");
  }
}

export const MearthClientInterface: Client = {
  start: async (runtime: IAgentRuntime) => {
    elizaLogger.log("I was called 🔥🔥 ✅✅✅");
    const twitterConfig: TwitterConfig = await validateTwitterConfig(runtime);
    const client = new MearthClient(runtime, twitterConfig);
    await client.twitterClient.init();
    await client.start();
    return client;
  },

  stop: async (_runtime: IAgentRuntime) => {
    elizaLogger.warn("Twitter twitterClientBase does not support stopping yet");
  },
};

export default MearthClientInterface;
