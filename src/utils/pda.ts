import { PublicKey } from "@solana/web3.js";

/**
 * Get the PDA for a game account
 * @param gameId - The unique identifier for the game
 * @param programId - The program ID
 * @returns [PublicKey, number] - The PDA public key and bump seed
 */
export const getGamePDA = (
  gameId: number,
  programId: PublicKey
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("game"), Buffer.from(new Uint8Array([gameId]))],
    programId
  );
};

/**
 * Get the PDA for a stake info account
 * @param agent - The agent public key
 * @param authority - The authority public key
 * @param programId - The program ID
 * @returns [PublicKey, number] - The PDA public key and bump seed
 */
export const getStakeInfoPDA = (
  agent: PublicKey,
  authority: PublicKey,
  programId: PublicKey
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("stake"), agent.toBuffer(), authority.toBuffer()],
    programId
  );
};

/**
 * Get the PDA for an agent's vault authority
 * @param agent - The agent public key
 * @param programId - The program ID
 * @returns [PublicKey, number] - The PDA public key and bump seed
 */
export const getAgentVaultAuthorityPDA = (
  agent: PublicKey,
  programId: PublicKey
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), agent.toBuffer()],
    programId
  );
};

/**
 * Get the PDA for an agent's token vault
 * @param agent - The agent public key
 * @param mint - The token mint public key
 * @param programId - The program ID
 * @returns [PublicKey, number] - The PDA public key and bump seed
 */
export const getAgentVaultPDA = (
  agent: PublicKey,
  mint: PublicKey,
  programId: PublicKey
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), agent.toBuffer(), mint.toBuffer()],
    programId
  );
};
