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
} from "@elizaos/core";
import { TwitterPostClient } from "./post";
import { GameState, CharacterType, CHARACTER_STATS, Position } from "./types";
import { GameMechanics } from "./mechanics";
import { TwitterClientBase } from "./twitterBase";

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

    // Start the game loop that runs every hour
    this.interval = setInterval(
      async () => {
        await this.gameLoop();
      },
      60 * 60 * 1000 // 1 hour in milliseconds
    );
  }

  async start() {
    elizaLogger.log("Starting MearthAutoClient...");
    if (!this.twitterClientBase.profile) {
      await this.twitterClientBase.init();
    }

    while (true) {
      this.gameLoop();
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // const generateNewTweetLoop = async () => {
    //   const lastPost = await this.runtime.cacheManager.get<{
    //     timestamp: number;
    //   }>("twitter/" + this.twitterPoster.twitterUsername + "/lastPost");

    //   const lastPostTimestamp = lastPost?.timestamp ?? 0;
    //   const minMinutes = Number(
    //     this.twitterClientBase.twitterConfig.POST_INTERVAL_MIN
    //   );
    //   const maxMinutes = Number(
    //     this.twitterClientBase.twitterConfig.POST_INTERVAL_MAX
    //   );
    //   const delay =
    //     Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;

    //   if (Date.now() > lastPostTimestamp + delay) {
    //     await this.twitterPoster.generateNewTweet();
    //   }

    //   setTimeout(() => {
    //     generateNewTweetLoop(); // Set up next iteration
    //   }, delay);

    //   elizaLogger.log(`Next tweet scheduled in ${delay} minutes`);
    // };
    // // Only start tweet generation loop if not in dry run mode
    // generateNewTweetLoop();
  }

  private getRandomPosition(): Position {
    const angle = Math.random() * 2 * Math.PI;
    const radius = Math.random() * this.mapRadius;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  }

  private async gameLoop() {
    const agentId = this.runtime.agentId;
    const userName = this.runtime.character.username;
    const roomId = stringToUuid("agentsRoom");

    this.runtime.ensureRoomExists(roomId);
    this.runtime.ensureUserExists(
      agentId,
      userName,
      this.runtime.character.name,
      "mearth"
    );
    this.runtime.ensureConnection(
      agentId,
      roomId,
      userName,
      this.runtime.character.name,
      "mearth"
    );
    // TODO: This is just a placeholder for now
    const tweetId = stringToUuid(
      this.runtime.agentId + "-" + this.runtime.character.id
    ) as UUID;

    const content: Content = {
      text: "Decide next position",
      type: "text",
      action: "decideNextPosition",
    };

    const memory: Memory = {
      id: tweetId,
      agentId,
      roomId: roomId,
      content: content,
      embedding: getEmbeddingZeroVector(),
      createdAt: Date.now(),
      userId: agentId,
    };

    await this.runtime.messageManager.createMemory(memory);

    // Update state with the new memory
    let state = await this.runtime.composeState(memory);
    state = await this.runtime.updateRecentMessageState(state);

    try {
      elizaLogger.log("Running Middle Earth agent game loop...");
      // 1. Decide agent next position
      const nextPosition = await this.decideNextPosition();
    } catch (error) {
      elizaLogger.error("Error in game loop:", error);
    }
  }

  private async decideNextPosition() {
    const runtime = this.runtime;
    const memories = await runtime.knowledgeManager.getMemories({
      roomId: runtime.roomId,
    });
    const state = await runtime.composeState({
      agentId: runtime.agentId,
      userId: runtime.userId,
      roomId: runtime.roomId,
      content: {
        text: "Decide next position",
        type: "text",
        action: "decideNextPosition",
      },
    });

    const context = composeContext({
      state: state,
      template: "Decide next position",
    });
  }

  private async updatePosition() {
    const traits = CHARACTER_STATS[this.gameState.characterType].traits;
    const newPos = { ...this.gameState.position };

    // Calculate movement based on character traits
    let targetPos: Position | null = null;

    if (traits.aggressiveness > 0.7) {
      // Aggressive characters move towards nearest agent
      targetPos = this.findNearestAgent()?.position;
    } else if (traits.sociability > 0.7) {
      // Social characters move towards potential allies
      targetPos = this.findPotentialAlly()?.position;
    } else if (traits.intelligence < 0.5) {
      // Less intelligent characters move randomly
      const angle = Math.random() * 2 * Math.PI;
      newPos.x += Math.cos(angle) * this.moveSpeed;
      newPos.y += Math.sin(angle) * this.moveSpeed;
    }

    if (targetPos) {
      // Move towards target
      const dx = targetPos.x - newPos.x;
      const dy = targetPos.y - newPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 0) {
        const speed = GameMechanics.getMovementSpeed(newPos, this.moveSpeed);
        newPos.x += (dx / distance) * speed;
        newPos.y += (dy / distance) * speed;
      }
    }

    // Ensure we stay within map bounds
    const distance = Math.sqrt(newPos.x * newPos.x + newPos.y * newPos.y);
    if (distance > this.mapRadius) {
      newPos.x = (newPos.x / distance) * this.mapRadius;
      newPos.y = (newPos.y / distance) * this.mapRadius;
    }

    this.gameState.position = newPos;
  }

  private findNearestAgent(): GameState | null {
    let nearest: GameState | null = null;
    let minDistance = Infinity;

    for (const agent of this.knownAgents.values()) {
      const distance = GameMechanics.getDistance(
        this.gameState.position,
        agent.position
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = agent;
      }
    }

    return nearest;
  }

  private findPotentialAlly(): GameState | null {
    // Find agent with highest sociability that isn't already an ally
    let bestMatch: GameState | null = null;
    let highestSociability = -1;

    for (const agent of this.knownAgents.values()) {
      if (!this.gameState.alliances.includes(agent.id)) {
        const traits = CHARACTER_STATS[agent.characterType].traits;
        if (traits.sociability > highestSociability) {
          highestSociability = traits.sociability;
          bestMatch = agent;
        }
      }
    }

    return bestMatch;
  }

  private async checkNearbyAgents(): Promise<GameState[]> {
    const nearbyAgents: GameState[] = [];

    for (const agent of this.knownAgents.values()) {
      if (GameMechanics.canInteract(this.gameState.position, agent.position)) {
        nearbyAgents.push(agent);
      }
    }

    return nearbyAgents;
  }

  private async handleNearbyAgents(agents: GameState[]) {
    const traits = CHARACTER_STATS[this.gameState.characterType].traits;

    for (const agent of agents) {
      if (this.shouldInitiateBattle(agent)) {
        await this.initiateBattle(agent);
      } else if (this.shouldProposeAlliance(agent)) {
        await this.proposeAlliance(agent);
      }
    }
  }

  private shouldInitiateBattle(agent: GameState): boolean {
    const traits = CHARACTER_STATS[this.gameState.characterType].traits;
    const agentTraits = CHARACTER_STATS[agent.characterType].traits;

    // Don't battle allies
    if (this.gameState.alliances.includes(agent.id)) {
      return false;
    }

    // Battle decision based on traits
    const battleProbability =
      traits.aggressiveness * 0.6 +
      traits.bravery * 0.3 +
      (1 - agentTraits.bravery) * 0.1;

    return Math.random() < battleProbability;
  }

  private shouldProposeAlliance(agent: GameState): boolean {
    const traits = CHARACTER_STATS[this.gameState.characterType].traits;
    const agentTraits = CHARACTER_STATS[agent.characterType].traits;

    // Check if alliance is possible
    if (!GameMechanics.canFormAlliance(this.gameState, agent, Date.now())) {
      return false;
    }

    // Alliance decision based on traits
    const allianceProbability =
      traits.sociability * 0.7 + agentTraits.sociability * 0.3;

    return Math.random() < allianceProbability;
  }

  private async initiateBattle(agent: GameState) {
    const battleResult = GameMechanics.calculateBattle(
      {
        id: this.gameState.id,
        tokens: this.gameState.tokens,
        type: this.gameState.characterType,
      },
      {
        id: agent.id,
        tokens: agent.tokens,
        type: agent.characterType,
      }
    );

    // Handle battle outcome
    if (battleResult.winner === this.gameState.id) {
      // We won
      await this.postUpdate(
        `Defeated ${agent.characterType} in battle! They lost ${battleResult.tokensBurned} tokens.`
      );
    } else {
      // We lost
      this.gameState.tokens -= battleResult.tokensBurned;
      await this.postUpdate(
        `Lost battle against ${agent.characterType}. Lost ${battleResult.tokensBurned} tokens...`
      );

      if (battleResult.deathOccurred) {
        await this.handleDeath("battle");
      }
    }

    this.gameState.lastBattleTime = Date.now();
  }

  private async proposeAlliance(agent: GameState) {
    const proposal = GameMechanics.createAllianceProposal(
      this.gameState.id,
      agent.id,
      Date.now()
    );

    // TODO: Implement alliance proposal mechanism
    await this.postUpdate(`Proposing alliance to ${agent.characterType}!`);

    this.gameState.lastAllianceTime = Date.now();
  }

  private async handleDeath(cause: "battle" | "terrain") {
    const message =
      cause === "battle"
        ? "I have fallen in battle... Goodbye Middle Earth!"
        : "The treacherous terrain has claimed me... Farewell!";

    await this.postUpdate(message);

    // TODO: Implement permanent death mechanics
    clearInterval(this.interval);
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
}
