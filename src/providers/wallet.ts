import {
  IAgentRuntime,
  Memory,
  Provider,
  State,
  elizaLogger,
} from "@elizaos/core";
import { Connection, PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import NodeCache from "node-cache";
import { getWalletKey } from "../utils/keypairUtils";

// Provider configuration
const PROVIDER_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
  DEFAULT_RPC: "https://api.mainnet-beta.solana.com",
  HELIUS_ENDPOINT: "https://rpc.helius-rpc.com",
  TOKEN_ADDRESSES: {
    MEARTH: "86Hne9YD8ToaNddSe45koHVTbgQaUbn57BGH6k9Wpump",
  },
};

export class WalletProvider {
  private cache: NodeCache;

  constructor(
    private connection: Connection,
    private walletPublicKey: PublicKey
  ) {
    this.cache = new NodeCache({ stdTTL: 300 }); // Cache TTL set to 5 minutes
  }

  async getFormattedMearthBalance(runtime: IAgentRuntime): Promise<string> {
    try {
      const accounts = await this.getTokenAccounts(
        this.walletPublicKey.toBase58()
      );

      let totalBalance = new BigNumber(0);
      let formattedOutput = `Wallet Address: ${this.walletPublicKey.toBase58()}\n\n`;

      if (accounts.length === 0) {
        return formattedOutput + "No MEARTH tokens found in wallet";
      }

      for (const account of accounts) {
        const parsedInfo = account.account.data.parsed.info;
        const balance = new BigNumber(parsedInfo.tokenAmount.amount).dividedBy(
          Math.pow(10, parsedInfo.tokenAmount.decimals)
        );

        totalBalance = totalBalance.plus(balance);
      }

      formattedOutput += `MEARTH Balance: ${totalBalance.toFixed(6)} MEARTH\n`;
      return formattedOutput;
    } catch (error) {
      elizaLogger.error("Error formatting MEARTH balance:", error);
      return "Unable to fetch MEARTH balance. Please try again later.";
    }
  }

  private async getTokenAccounts(walletAddress: string) {
    try {
      const accounts = await this.connection.getParsedTokenAccountsByOwner(
        new PublicKey(walletAddress),
        {
          programId: new PublicKey(PROVIDER_CONFIG.TOKEN_ADDRESSES.MEARTH),
        }
      );
      return accounts.value;
    } catch (error) {
      elizaLogger.error("Error fetching token accounts:", error);
      return [];
    }
  }
}

const walletProvider: Provider = {
  get: async (
    runtime: IAgentRuntime,
    _message: Memory,
    _state?: State
  ): Promise<string | null> => {
    try {
      const { publicKey } = await getWalletKey(runtime, false);

      const connection = new Connection(
        runtime.getSetting("SOLANA_RPC_URL") || PROVIDER_CONFIG.DEFAULT_RPC
      );

      const provider = new WalletProvider(connection, publicKey);

      return await provider.getFormattedMearthBalance(runtime);
    } catch (error) {
      elizaLogger.error("Error in wallet provider:", error);
      return null;
    }
  },
};

// Module exports
export { walletProvider };
