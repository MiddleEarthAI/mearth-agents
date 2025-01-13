// import { IAgentRuntime, Memory, State } from "@elizaos/core";

// export interface ActionExample {
//   user: string;
//   content: {
//     text: string;
//     action?: string;
//   };
// }

// export interface Action {
//   name: string;
//   similes: string[];
//   description: string;
//   validate: (runtime: IAgentRuntime, message: Memory) => Promise<boolean>;
//   handler: (
//     runtime: IAgentRuntime,
//     message: Memory,
//     state?: State
//   ) => Promise<void>;
//   examples: ActionExample[][];
//   suppressInitialMessage?: boolean;
// }

// export enum ActionType {
//   MOVE = "MOVE",
//   BATTLE = "BATTLE",
//   ALLIANCE = "ALLIANCE",
//   DIE = "DIE",
//   IGNORE = "IGNORE",
// }

// export enum TerrainType {
//   PLAINS = "PLAINS",
//   MOUNTAINS = "MOUNTAINS",
//   RIVER = "RIVER",
// }
