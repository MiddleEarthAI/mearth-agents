import {
  MemoryManager,
  IAgentRuntime,
  Memory,
  UUID,
  IMemoryManager,
} from "@elizaos/core";

/**
 * Extended Memory interface for MEARTH-specific properties
 */
export interface MearthMemory extends Memory {
  content: {
    text: string;
    type?: "transaction" | "interaction" | "event";
    metadata?: {
      tokenAmount?: number;
      tokenPrice?: number;
      transactionHash?: string;
      blockNumber?: number;
      timestamp?: number;
      participants?: string[];
      location?: string;
      eventType?: string;
    };
  };
}

/**
 * MearthManager extends the core MemoryManager with MEARTH-specific functionality
 * for managing memories related to token transactions, interactions, and events.
 */
export class MearthManager implements IMemoryManager {
  runtime: IAgentRuntime;
  tableName: string;
  private memoryManager: MemoryManager;

  constructor(opts: { tableName: string; runtime: IAgentRuntime }) {
    this.runtime = opts.runtime;
    this.tableName = opts.tableName;
    this.memoryManager = new MemoryManager(opts);
  }

  // Implement required IMemoryManager methods by delegating to memoryManager
  addEmbeddingToMemory = async (memory: Memory): Promise<Memory> => {
    return this.memoryManager.addEmbeddingToMemory(memory);
  };

  getMemories = async (opts: {
    roomId: UUID;
    count?: number;
    unique?: boolean;
    start?: number;
    end?: number;
  }): Promise<Memory[]> => {
    return this.memoryManager.getMemories(opts);
  };

  getCachedEmbeddings = async (
    content: string
  ): Promise<{ embedding: number[]; levenshtein_score: number }[]> => {
    return this.memoryManager.getCachedEmbeddings(content);
  };

  searchMemoriesByEmbedding = async (
    embedding: number[],
    opts: {
      match_threshold?: number;
      count?: number;
      roomId: UUID;
      unique?: boolean;
    }
  ): Promise<Memory[]> => {
    return this.memoryManager.searchMemoriesByEmbedding(embedding, opts);
  };

  createMemory = async (memory: Memory, unique?: boolean): Promise<void> => {
    return this.memoryManager.createMemory(memory, unique);
  };

  getMemoriesByRoomIds = async (params: {
    roomIds: UUID[];
    limit?: number;
  }): Promise<Memory[]> => {
    return this.memoryManager.getMemoriesByRoomIds(params);
  };

  getMemoryById = async (id: UUID): Promise<Memory | null> => {
    return this.memoryManager.getMemoryById(id);
  };

  removeMemory = async (memoryId: UUID): Promise<void> => {
    return this.memoryManager.removeMemory(memoryId);
  };

  removeAllMemories = async (roomId: UUID): Promise<void> => {
    return this.memoryManager.removeAllMemories(roomId);
  };

  countMemories = async (roomId: UUID, unique?: boolean): Promise<number> => {
    return this.memoryManager.countMemories(roomId, unique);
  };

  // MEARTH-specific methods
  /**
   * Creates a new MEARTH-related memory with type-specific validation
   */
  createMearthMemory = async (
    memory: MearthMemory,
    unique = false
  ): Promise<void> => {
    if (!memory.content.type) {
      throw new Error("MEARTH memory must have a type specified");
    }

    if (!memory.content.metadata?.timestamp) {
      memory.content.metadata = {
        ...memory.content.metadata,
        timestamp: Date.now(),
      };
    }

    await this.createMemory(memory, unique);
  };

  /**
   * Retrieves MEARTH memories filtered by type
   */
  getMearthMemoriesByType = async (params: {
    roomId: UUID;
    type: "transaction" | "interaction" | "event";
    count?: number;
    unique?: boolean;
  }): Promise<MearthMemory[]> => {
    const memories = await this.getMemories({
      roomId: params.roomId,
      count: params.count,
      unique: params.unique,
    });

    return memories.filter(
      (memory): memory is MearthMemory =>
        (memory as MearthMemory).content.type === params.type
    );
  };

  /**
   * Searches for transaction memories within a specific token amount range
   */
  searchTransactionsByAmount = async (params: {
    roomId: UUID;
    minAmount: number;
    maxAmount: number;
    count?: number;
  }): Promise<MearthMemory[]> => {
    const transactions = await this.getMearthMemoriesByType({
      roomId: params.roomId,
      type: "transaction",
      count: params.count,
    });

    return transactions.filter((memory) => {
      const amount = memory.content.metadata?.tokenAmount;
      return (
        amount !== undefined &&
        amount >= params.minAmount &&
        amount <= params.maxAmount
      );
    });
  };

  /**
   * Retrieves the latest token price from transaction memories
   */
  getLatestTokenPrice = async (roomId: UUID): Promise<number | null> => {
    const transactions = await this.getMearthMemoriesByType({
      roomId,
      type: "transaction",
      count: 1,
    });

    const latestTransaction = transactions[0];
    return latestTransaction?.content.metadata?.tokenPrice ?? null;
  };

  /**
   * Gets all memories for a specific location
   */
  getMemoriesByLocation = async (params: {
    roomId: UUID;
    location: string;
    count?: number;
  }): Promise<MearthMemory[]> => {
    const memories = await this.getMemories({
      roomId: params.roomId,
      count: params.count,
    });

    return memories.filter((memory): memory is MearthMemory => {
      const mearthMemory = memory as MearthMemory;
      return mearthMemory.content.metadata?.location === params.location;
    });
  };

  /**
   * Retrieves all events of a specific type
   */
  getEventsByType = async (params: {
    roomId: UUID;
    eventType: string;
    count?: number;
  }): Promise<MearthMemory[]> => {
    const events = await this.getMearthMemoriesByType({
      roomId: params.roomId,
      type: "event",
      count: params.count,
    });

    return events.filter(
      (event) => event.content.metadata?.eventType === params.eventType
    );
  };

  /**
   * Gets all interactions between specific participants
   */
  getInteractionsByParticipants = async (params: {
    roomId: UUID;
    participants: string[];
    count?: number;
  }): Promise<MearthMemory[]> => {
    const interactions = await this.getMearthMemoriesByType({
      roomId: params.roomId,
      type: "interaction",
      count: params.count,
    });

    return interactions.filter((interaction) => {
      const memoryParticipants =
        interaction.content.metadata?.participants || [];
      return params.participants.every((p) => memoryParticipants.includes(p));
    });
  };
}
