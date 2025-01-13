import { DirectClient } from "@elizaos/client-direct";
import {
  AgentRuntime,
  elizaLogger,
  ModelProviderName,
  settings,
  stringToUuid,
  type Character,
} from "@elizaos/core";
import { bootstrapPlugin } from "@elizaos/plugin-bootstrap";
import { createNodePlugin } from "@elizaos/plugin-node";
// import { solanaPlugin } from "@elizaos/plugin-solana";
import fs from "fs";
import net from "net";
import path from "path";
import { fileURLToPath } from "url";
import { initializeDbCache } from "./cache/index.ts";
// import { character } from "./character.ts";
import { startChat } from "./chat/index.ts";
import { initializeClients } from "./clients/index.ts";

import {
  getTokenForProvider,
  loadCharacters,
  parseArguments,
} from "./config/index.ts";
import { initializeDatabase } from "./database/index.ts";
import { battleEvaluator } from "./evaluators/battle-evaluator.ts";
import { socialEvaluator } from "./evaluators/social-evaluator.ts";
import { tokenEvaluator } from "./evaluators/token-evaluator.ts";
import { BattleStateProvider } from "./providers/battle-state.ts";
import { GameStateProvider } from "./providers/game-state.ts";
import { TwitterMetricsProvider } from "./providers/twitter-metrics.ts";
import { TokenStateProvider } from "./providers/token-state.ts";

// Get the current file's directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to wait for a random duration between min and max milliseconds
export const wait = (minTime: number = 1000, maxTime: number = 3000) => {
  const waitTime =
    Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
  return new Promise((resolve) => setTimeout(resolve, waitTime));
};

let nodePlugin: any | undefined;

// Creates a new agent runtime with the provided character, database, cache and token
export function createAgent(
  character: Character,
  db: any,
  cache: any,
  token: string
) {
  elizaLogger.success(
    elizaLogger.successesTitle,
    "Creating runtime for character",
    character.name
  );

  nodePlugin ??= createNodePlugin();

  return new AgentRuntime({
    databaseAdapter: db,
    token,
    modelProvider: ModelProviderName.ANTHROPIC,
    evaluators: [battleEvaluator, socialEvaluator, tokenEvaluator],
    character,
    plugins: [
      bootstrapPlugin,
      nodePlugin,
      // character.settings?.secrets?.WALLET_PUBLIC_KEY ? solanaPlugin : null,
    ].filter(Boolean),
    providers: [
      // BattleStateProvider,
      // GameStateProvider,
      // TwitterMetricsProvider,
      // TokenStateProvider,
    ],
    // actions: [Actions],
    services: [],
    managers: [],
    cacheManager: cache,
  });
}

// Initializes and starts an agent for a given character
async function startAgent(character: Character, directClient: DirectClient) {
  try {
    // Set default ID and username if not provided
    character.id ??= stringToUuid(character.name);
    character.username ??= character.name;

    const token = getTokenForProvider(ModelProviderName.ANTHROPIC, character);
    const dataDir = path.join(__dirname, "../data");

    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const db = initializeDatabase(dataDir);

    await db.init();

    const cache = initializeDbCache(character, db);
    const runtime = createAgent(character, db, cache, token!);

    await runtime.initialize();

    runtime.clients = await initializeClients(character, runtime);

    directClient.registerAgent(runtime);

    elizaLogger.debug(`Started ${character.name} as ${runtime.agentId}`);

    return runtime;
  } catch (error) {
    elizaLogger.error(
      `Error starting agent for character ${character.name}:`,
      error
    );
    console.error(error);
    throw error;
  }
}

// Checks if a port is available for use
const checkPortAvailable = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        resolve(false);
      }
    });

    server.once("listening", () => {
      server.close();
      resolve(true);
    });

    server.listen(port);
  });
};

// Main function to start all agents
const startAgents = async () => {
  try {
    const directClient = new DirectClient();
    let serverPort = parseInt(settings.SERVER_PORT || "3000");
    const args = parseArguments();

    // Load characters from arguments or use default
    let charactersArg = args.characters || args.character;
    let characters = [];

    console.log("charactersArg", charactersArg);
    if (charactersArg) {
      characters = await loadCharacters(charactersArg);
    }
    console.log(
      "character names",
      characters.map((c) => c.name)
    );
    try {
      // Start each character's agent
      for (const character of characters) {
        await startAgent(character, directClient as DirectClient);
      }
    } catch (error) {
      elizaLogger.error("Error starting agents:", error);
    }

    // Find available port if default is in use
    while (!(await checkPortAvailable(serverPort))) {
      elizaLogger.warn(
        `Port ${serverPort} is in use, trying ${serverPort + 1}`
      );
      serverPort++;
    }

    // Add startAgent functionality to directClient
    directClient.startAgent = async (character: Character) => {
      return startAgent(character, directClient);
    };

    directClient.start(serverPort);

    if (serverPort !== parseInt(settings.SERVER_PORT || "3000")) {
      elizaLogger.log(`Server started on alternate port ${serverPort}`);
    }

    elizaLogger.log("Chat started. Type 'exit' to quit.");
    const chat = startChat(characters);
    chat();
  } catch (error) {
    elizaLogger.error("Error starting agents:", error);
  }
};

// Start the application and handle any unhandled errors
startAgents().catch((error) => {
  elizaLogger.error("Unhandled error in startAgents:", error);
  process.exit(1);
});
