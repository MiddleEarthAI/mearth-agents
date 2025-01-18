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
  ActionResponse,
} from "@elizaos/core";
import { TwitterPostClient } from "./post";
import { GameState, CharacterType, CHARACTER_STATS, Position } from "./types";
import { GameMechanics } from "./mechanics";
import { TwitterClientBase } from "./twitterBase";
import { mearthNewPositionTemplate } from "./templates";
import { MearthActionResponse } from "../../types";

export class MearthAutoClient {
  interval: NodeJS.Timeout;
  runtime: IAgentRuntime;
  lastMoveTime: number = 0;
  twitterPoster: TwitterPostClient;
  twitterClientBase: TwitterClientBase;
  gameState: GameState;
  mapRadius: number = 60; // 120 units diameter / 2
  moveSpeed: number = 1; // 1 unit per hour
  knownAgents: Map<string, GameState> = new Map();

  constructor(
    runtime: IAgentRuntime,
    twitterPoster: TwitterPostClient,
    twitterClientBase: TwitterClientBase
  ) {
    this.runtime = runtime;
    this.twitterPoster = twitterPoster;
    this.twitterClientBase = twitterClientBase;
  }

  async generateNewActionAndTweet() {
    elizaLogger.log("Generating new tweet");

    try {
      const roomId = stringToUuid(
        "twitter_generate_room-" + this.twitterPoster.twitterUsername
      );

      await this.runtime.ensureUserExists(
        this.runtime.agentId,
        this.twitterPoster.twitterUsername,
        this.runtime.character.name,
        "mearth"
      );

      const topics = this.runtime.character.topics.join(", ");

      // 1. compose a new state
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
          twitterUserName: this.twitterPoster.twitterUsername,
        }
      );

      const context = composeContext({
        state,
        template: mearthNewPositionTemplate,
      });

      elizaLogger.debug("generate post prompt:\n" + context);

      const content = await generateText({
        runtime: this.runtime,
        context,
        modelClass: ModelClass.LARGE,
      });

      // First attempt to clean content
      let cleanedContent = "";

      // Try parsing as JSON first
      try {
        const parsedResponse = JSON.parse(content);
        if (parsedResponse.text) {
          cleanedContent = parsedResponse.text;
          elizaLogger.info(cleanedContent);
        } else if (typeof parsedResponse === "string") {
          cleanedContent = parsedResponse;
        }
      } catch (error) {
        error.linted = true; // make linter happy since catch needs a variable
        // If not JSON, clean the raw content
        cleanedContent = content
          .replace(/^\s*{?\s*"text":\s*"|"\s*}?\s*$/g, "") // Remove JSON-like wrapper
          .replace(/^['"](.*)['"]$/g, "$1") // Remove quotes
          .replace(/\\"/g, '"') // Unescape quotes
          .replace(/\\n/g, "\n\n") // Unescape newlines, ensures double spaces
          .trim();
      }

      if (!cleanedContent) {
        elizaLogger.error("Failed to extract valid content from response:", {
          rawResponse: content,
          attempted: "JSON parsing",
        });
        return;
      }

      // Truncate the content to the maximum tweet length specified in the environment settings, ensuring the truncation respects sentence boundaries.
      const maxTweetLength =
        this.twitterClientBase.twitterConfig.MAX_TWEET_LENGTH;
      if (maxTweetLength) {
        // cleanedContent = truncateToCompleteSentence(
        //   cleanedContent,
        //   maxTweetLength
        // );
      }

      const removeQuotes = (str: string) => str.replace(/^['"](.*)['"]$/, "$1");

      const fixNewLines = (str: string) => str.replaceAll(/\\n/g, "\n\n"); //ensures double spaces

      // Final cleaning
      cleanedContent = removeQuotes(fixNewLines(cleanedContent));

      // if (this.isDryRun) {
      //   elizaLogger.info(
      //     `Dry run: would have posted tweet: ${cleanedContent}`
      //   );
      //   return;
      // }

      try {
        this.twitterPoster.postTweet(
          this.runtime,
          this.twitterClientBase,
          cleanedContent,
          roomId,
          content,
          this.twitterPoster.twitterUsername
        );
      } catch (error) {
        elizaLogger.error("Error sending tweet:", error);
      }
    } catch (error) {
      elizaLogger.error("Error generating new tweet:", error);
    }
  }

  async start() {
    elizaLogger.log("Starting MearthAutoClient...");
    if (!this.twitterClientBase.profile) {
      await this.twitterClientBase.init();
    }

    const generateNewActionAndTweetLoop = async () => {
      // Check for pending tweets first

      const lastPost = await this.runtime.cacheManager.get<{
        timestamp: number;
      }>("twitter/" + this.twitterPoster.twitterUsername + "/lastPost");

      const lastPostTimestamp = lastPost?.timestamp ?? 0;
      const minMinutes =
        this.twitterClientBase.twitterConfig.POST_INTERVAL_MIN || 10;
      const maxMinutes =
        this.twitterClientBase.twitterConfig.POST_INTERVAL_MAX || 15;

      const randomMinutes =
        Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;
      const delay = randomMinutes * 60 * 1000;

      if (Date.now() > lastPostTimestamp + delay) {
        await this.generateNewActionAndTweet();
      }

      setTimeout(() => {
        generateNewActionAndTweetLoop(); // Set up next iteration
      }, delay);

      elizaLogger.log(`Next tweet scheduled in ${randomMinutes} minutes`);
    };
  }

  private async postUpdate(action?: string) {
    const message = GameMechanics.generateTweetMessage(
      this.gameState,
      this.gameState.characterType,
      action
    );

    try {
      // TODO: Implement actual Twitter posting
      elizaLogger.log("Posting update:", message);
    } catch (error) {
      elizaLogger.error("Error posting update:", error);
    }
  }

  async generateAgentActions({
    runtime,
    context,
    modelClass,
  }: {
    runtime: IAgentRuntime;
    context: string;
    modelClass: ModelClass;
  }): Promise<MearthActionResponse | null> {
    let retryDelay = 1000;
    while (true) {
      try {
        const response = await generateText({
          runtime,
          context,
          modelClass,
        });
        console.debug(
          "Received response from generateText for tweet actions:",
          response
        );
        const { actions } = parseActionResponseFromText(response.trim());
        if (actions) {
          console.debug("Parsed tweet actions:", actions);
          return actions;
        } else {
          elizaLogger.debug("generateTweetActions no valid response");
        }
      } catch (error) {
        elizaLogger.error("Error in generateTweetActions:", error);
        if (
          error instanceof TypeError &&
          error.message.includes("queueTextCompletion")
        ) {
          elizaLogger.error(
            "TypeError: Cannot read properties of null (reading 'queueTextCompletion')"
          );
        }
      }
      elizaLogger.log(`Retrying in ${retryDelay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      retryDelay *= 2;
    }
  }
}
