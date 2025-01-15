import * as anchor from "@coral-xyz/anchor";
import type { MiddleEarthAiProgram } from "../constants/middle_earth_ai_program";
import idl from "../constants/middle_earth_ai_program.json";
import { initWalletProvider } from "../providers/wallet";
import { IAgentRuntime } from "@elizaos/core";

export async function getProgram(runtime: IAgentRuntime) {
  const { connection, keyPair } = await initWalletProvider(runtime);

  const wallet = new anchor.Wallet(keyPair);

  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    skipPreflight: true,
  });

  anchor.setProvider(provider);

  return new anchor.Program<MiddleEarthAiProgram>(idl as MiddleEarthAiProgram);
}
