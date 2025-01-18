import { Client, elizaLogger, IAgentRuntime } from "@elizaos/core";
import { TwitterClientBase } from "./twitterBase";
import {
  validateTwitterConfig,
  TwitterConfig,
  validateMearthConfig,
} from "./environment";
// import { TwitterInteractionClient } from "./interactions";
import { TwitterPostClient } from "./post";
import { MearthAutoClient } from "./mearth";
import { MearthConfig } from "./types";

class MearthManager {
  twitterClientBase: TwitterClientBase;
  post: TwitterPostClient;
  // interaction: TwitterInteractionClient;
  auto: MearthAutoClient;

  constructor(
    runtime: IAgentRuntime,
    twitterConfig: TwitterConfig,
    mearthConfig: MearthConfig
  ) {
    // Pass twitterConfig to the base twitterClientBase
    this.twitterClientBase = new TwitterClientBase(runtime, twitterConfig);

    // Posting logic
    this.post = new TwitterPostClient(this.twitterClientBase, runtime);

    // Mentions and interactions
    // this.interaction = new TwitterInteractionClient(
    //   this.twitterClientBase,
    //   runtime
    // );

    // Autonomous agent behavior
    this.auto = new MearthAutoClient(
      runtime,
      this.post,
      this.twitterClientBase
    );
  }
}

export const MearthClientInterface: Client = {
  async start(runtime: IAgentRuntime) {
    const twitterConfig: TwitterConfig = await validateTwitterConfig(runtime);
    const mearthConfig: MearthConfig = await validateMearthConfig(runtime);

    const manager = new MearthManager(runtime, twitterConfig, mearthConfig);

    // Initialize login/session
    await manager.twitterClientBase.init();

    await manager.auto.start();

    // Start interactions (mentions, replies)
    // await manager.interaction.start();

    return manager;
  },

  async stop(_runtime: IAgentRuntime) {
    elizaLogger.warn("Twitter twitterClientBase does not support stopping yet");
  },
};

export default MearthClientInterface;
