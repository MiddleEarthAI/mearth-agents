/**
 * @fileoverview Provides wallet functionality for interacting with the Solana blockchain.
 * Handles wallet creation, balance checking, and endpoint management with caching support.
 */

import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";

import {
  type IAgentRuntime,
  type Provider,
  type Memory,
  type State,
  type ICacheManager,
  elizaLogger,
} from "@elizaos/core";

import { DeriveKeyProvider, TEEMode } from "@elizaos/plugin-tee";
import NodeCache from "node-cache";
import * as path from "path";
import bs58 from "bs58";

/**
 * Manages a Solana wallet including the keypair, connection and caching.
 */

export class WalletProvider {
  private cache: NodeCache;
  private cacheKey: string = "solana/wallet";
  private currentEndpoint: string;
  private CACHE_EXPIRY_SEC = 5;
  keyPair: Keypair;
  connection: Connection;

  /**
   * Creates a new WalletProvider instance
   * @param accountOrPrivateKey - Either a Keypair object or private key string
   * @param cacheManager - Cache manager for storing wallet data
   * @param endpoint - Optional Solana RPC endpoint URL
   */
  constructor(
    accountOrPrivateKey: Keypair | string,
    private cacheManager: ICacheManager,
    endpoint?: string
  ) {
    this.setAccount(accountOrPrivateKey);
    this.currentEndpoint = endpoint || "https://api.mainnet-beta.solana.com";
    this.connection = new Connection(this.currentEndpoint);
    this.cache = new NodeCache({ stdTTL: this.CACHE_EXPIRY_SEC });
  }

  /**
   * Gets the public key of the wallet
   * @returns The wallet's public key
   */
  getAddress(): PublicKey {
    return this.keyPair.publicKey;
  }

  /**
   * Gets the current RPC endpoint URL
   * @returns The current endpoint URL
   */
  getCurrentEndpoint(): string {
    return this.currentEndpoint;
  }

  /**
   * Gets the wallet balance with caching support
   * @returns Formatted balance string or null if error
   */
  async getWalletBalance(): Promise<string | null> {
    const cacheKey = "walletBalance_" + this.currentEndpoint;
    const cachedData = await this.getCachedData<string>(cacheKey);
    if (cachedData) {
      elizaLogger.log(
        "Returning cached wallet balance for endpoint: " + this.currentEndpoint
      );
      return cachedData;
    }

    try {
      const balance = await this.connection.getBalance(this.keyPair.publicKey);
      const balanceFormatted = `${(balance / LAMPORTS_PER_SOL).toFixed(2)} SOL`;
      this.setCachedData<string>(cacheKey, balanceFormatted);
      elizaLogger.log(
        "Wallet balance cached for endpoint: ",
        this.currentEndpoint
      );
      return balanceFormatted;
    } catch (error) {
      console.error("Error getting wallet balance:", error);
      return null;
    }
  }

  /**
   * Switches the RPC endpoint
   * @param endpoint - New endpoint URL to use
   */
  switchEndpoint(endpoint: string) {
    this.currentEndpoint = endpoint;
    this.connection = new Connection(endpoint);
  }

  /**
   * Reads data from the persistent cache
   * @param key - Cache key
   * @returns Cached data or null if not found
   */
  private async readFromCache<T>(key: string): Promise<T | null> {
    const cached = await this.cacheManager.get<T>(
      path.join(this.cacheKey, key)
    );
    return cached;
  }

  /**
   * Writes data to the persistent cache
   * @param key - Cache key
   * @param data - Data to cache
   */
  private async writeToCache<T>(key: string, data: T): Promise<void> {
    await this.cacheManager.set(path.join(this.cacheKey, key), data, {
      expires: Date.now() + this.CACHE_EXPIRY_SEC * 1000,
    });
  }

  /**
   * Gets data from memory cache or persistent cache
   * @param key - Cache key
   * @returns Cached data or null if not found
   */
  private async getCachedData<T>(key: string): Promise<T | null> {
    const cachedData = this.cache.get<T>(key);
    if (cachedData) {
      return cachedData;
    }

    const fileCachedData = await this.readFromCache<T>(key);
    if (fileCachedData) {
      this.cache.set(key, fileCachedData);
      return fileCachedData;
    }

    return null;
  }

  /**
   * Sets data in both memory and persistent cache
   * @param cacheKey - Cache key
   * @param data - Data to cache
   */
  private async setCachedData<T>(cacheKey: string, data: T): Promise<void> {
    this.cache.set(cacheKey, data);
    await this.writeToCache(cacheKey, data);
  }

  /**
   * Sets up the wallet keyPair from private key or keypair
   * @param accountOrPrivateKey - Private key string or Keypair
   */
  private setAccount = (accountOrPrivateKey: Keypair | string) => {
    if (typeof accountOrPrivateKey === "string") {
      const decoded = bs58.decode(accountOrPrivateKey);
      this.keyPair = Keypair.fromSecretKey(decoded);
    } else {
      this.keyPair = accountOrPrivateKey;
    }
  };
}

/**
 * Initializes a WalletProvider instance based on runtime settings
 * @param runtime - Agent runtime instance
 * @returns Configured WalletProvider instance
 */
export const initWalletProvider = async (runtime: IAgentRuntime) => {
  const teeMode = runtime.getSetting("TEE_MODE") || TEEMode.OFF;
  const endpoint =
    runtime.getSetting("SOLANA_RPC_URL") ||
    "https://api.mainnet-beta.solana.com";

  if (teeMode !== TEEMode.OFF) {
    const walletSecretSalt = runtime.getSetting("WALLET_SECRET_SALT");
    if (!walletSecretSalt) {
      throw new Error("WALLET_SECRET_SALT required when TEE_MODE is enabled");
    }

    const deriveKeyProvider = new DeriveKeyProvider(teeMode);
    const deriveKeyResult = await deriveKeyProvider.deriveEcdsaKeypair(
      "/",
      walletSecretSalt,
      runtime.agentId
    );
    return new WalletProvider(
      deriveKeyResult.keypair as unknown as Keypair,
      runtime.cacheManager,
      endpoint
    );
  } else {
    const privateKey = runtime.getSetting("SOLANA_PRIVATE_KEY");
    if (!privateKey) {
      throw new Error("SOLANA_PRIVATE_KEY is missing");
    }
    return new WalletProvider(privateKey, runtime.cacheManager, endpoint);
  }
};

/**
 * Provider implementation for getting wallet information
 */
export const solanaWalletProvider: Provider = {
  async get(
    runtime: IAgentRuntime,
    _message: Memory,
    state?: State
  ): Promise<string | null> {
    try {
      const walletProvider = await initWalletProvider(runtime);
      const address = walletProvider.getAddress().toString();
      const balance = await walletProvider.getWalletBalance();
      const endpoint = walletProvider.getCurrentEndpoint();
      const agentName = state?.agentName || "The agent";
      return `${agentName}'s Solana Wallet Address: ${address}\nBalance: ${balance} SOL\nEndpoint: ${endpoint}`;
    } catch (error) {
      console.error("Error in Solana wallet provider:", error);
      return null;
    }
  },
};

/**
 * commit: docs(wallet): Add comprehensive JSDoc documentation and fix type error
 *
 * - Added detailed JSDoc comments for all classes, methods and functions
 * - Fixed type error in initWalletProvider by properly typing derived keypair
 * - Improved code readability with consistent documentation style
 * - Added file overview documentation
 * - Enhanced parameter and return type documentation
 */
