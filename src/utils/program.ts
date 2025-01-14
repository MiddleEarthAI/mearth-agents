import * as anchor from "@coral-xyz/anchor";
import base58 from "bs58";
import type { MiddleEarthAiProgram } from "../constants/middle_earth_ai_program";
import idl from "../constants/middle_earth_ai_program.json";

const defaultPrivateKey = process.env.DEFAULT_PRIVATE_KEY;
const solanaRpcUrl = process.env.SOLANA_RPC_URL;

if (!solanaRpcUrl || !defaultPrivateKey) {
  throw new Error("Missing required environment variables");
}

const connection = new anchor.web3.Connection(solanaRpcUrl);

// Convert private key string to Uint8Array
const privateKeyArray = base58.decode(defaultPrivateKey);
const keypair = anchor.web3.Keypair.fromSecretKey(
  new Uint8Array(privateKeyArray)
);

const wallet = new anchor.Wallet(keypair);

const provider = new anchor.AnchorProvider(connection, wallet, {
  commitment: "confirmed",
  skipPreflight: true,
});

anchor.setProvider(provider);

export const program = new anchor.Program<MiddleEarthAiProgram>(
  idl as MiddleEarthAiProgram
);

export async function getProgramForPrivateKey(privateKey: string) {
  if (!privateKey) {
    throw new Error("Private key is required");
  }
  const privateKeyArray = base58.decode(privateKey);
  const keypair = anchor.web3.Keypair.fromSecretKey(
    new Uint8Array(privateKeyArray)
  );
  const wallet = new anchor.Wallet(keypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    skipPreflight: true,
  });
  anchor.setProvider(provider);
  const program = new anchor.Program<MiddleEarthAiProgram>(
    idl as MiddleEarthAiProgram
  );
  return program;
}
