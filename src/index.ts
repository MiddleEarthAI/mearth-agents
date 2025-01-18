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
import net from "net";
import { initializeDbCache } from "./cache/index.ts";
import { initializeClients } from "./clients/index.ts";

import {
  getTokenForProvider,
  loadCharacters,
  parseArguments,
} from "./config/index.ts";

import { initializeDatabase } from "./database/index.ts";

import {
  battleStateProvider,
  gameMechanicsProvider,
  gameStateProvider,
} from "./providers/index.ts";
import { moveAction } from "./actions/movement.ts";
import { MearthManager } from "./mearthManager.ts";

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

  const runtime = new AgentRuntime({
    databaseAdapter: db,
    token,
    modelProvider: ModelProviderName.ANTHROPIC,
    evaluators: [],
    character,
    plugins: [
      bootstrapPlugin,
      nodePlugin,
      // character.settings?.secrets?.WALLET_PUBLIC_KEY ? solanaPlugin : null,
    ].filter(Boolean),
    providers: [battleStateProvider, gameStateProvider, gameMechanicsProvider],
    actions: [moveAction],
    services: [],
    managers: [],
    cacheManager: cache,
  });

  // Add MearthManager after runtime is created
  runtime.registerMemoryManager(
    new MearthManager({
      tableName: "mearth",
      runtime,
    })
  );

  return runtime;
}

// Initializes and starts an agent for a given character
async function startAgent(character: Character, directClient: DirectClient) {
  try {
    // Set default ID and username if not provided
    character.id ??= stringToUuid(character.name);
    character.username ??= character.name;

    const token = getTokenForProvider(ModelProviderName.ANTHROPIC, character);

    const db = initializeDatabase();

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
  } catch (error) {
    elizaLogger.error("Error starting agents:", error);
  }
};

// Start the application and handle any unhandled errors
startAgents().catch((error) => {
  elizaLogger.error("Unhandled error in startAgents:", error);
  process.exit(1);
});
