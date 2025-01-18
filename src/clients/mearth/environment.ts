import { parseBooleanFromText, IAgentRuntime } from "@elizaos/core";
import { z, ZodError } from "zod";
import { MearthConfig } from "../../types";

export const DEFAULT_MAX_TWEET_LENGTH = 280;

const twitterUsernameSchema = z
  .string()
  .min(1, "An X/Twitter Username must be at least 1 character long")
  .max(15, "An X/Twitter Username cannot exceed 15 characters")
  .refine((username) => {
    // Allow wildcard '*' as a special case
    if (username === "*") return true;

    // Twitter usernames can:
    // - Start with digits now
    // - Contain letters, numbers, underscores
    // - Must not be empty
    return /^[A-Za-z0-9_]+$/.test(username);
  }, "An X Username can only contain letters, numbers, and underscores");

/**
 * This schema defines all required/optional environment settings,
 * including new fields like TWITTER_SPACES_ENABLE.
 */
export const twitterEnvSchema = z.object({
  TWITTER_DRY_RUN: z.boolean(),
  TWITTER_USERNAME: z.string().min(1, "X/Twitter username is required"),
  TWITTER_PASSWORD: z.string().min(1, "X/Twitter password is required"),
  TWITTER_EMAIL: z.string().email("Valid X/Twitter email is required"),
  MAX_TWEET_LENGTH: z.number().int().default(DEFAULT_MAX_TWEET_LENGTH),
  TWITTER_SEARCH_ENABLE: z.boolean().default(false),
  TWITTER_2FA_SECRET: z.string(),
  TWITTER_RETRY_LIMIT: z.number().int(),
  TWITTER_POLL_INTERVAL: z.number().int(),
  TWITTER_TARGET_USERS: z.array(twitterUsernameSchema).default([]),
  POST_INTERVAL_MIN: z.number().int(),
  POST_INTERVAL_MAX: z.number().int(),
  ACTION_INTERVAL: z.number().int(),
  POST_IMMEDIATELY: z.boolean(),
});

export type TwitterConfig = z.infer<typeof twitterEnvSchema>;

/**
 * Helper to parse a comma-separated list of Twitter usernames
 * (already present in your code).
 */
function parseTargetUsers(targetUsersStr?: string | null): string[] {
  if (!targetUsersStr?.trim()) {
    return [];
  }
  return targetUsersStr
    .split(",")
    .map((user) => user.trim())
    .filter(Boolean);
}

function safeParseInt(
  value: string | undefined | null,
  defaultValue: number
): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : Math.max(1, parsed);
}
export async function validateTwitterConfig(
  runtime: IAgentRuntime
): Promise<TwitterConfig> {
  try {
    const twitterConfig = {
      TWITTER_DRY_RUN:
        parseBooleanFromText(
          runtime.getSetting("TWITTER_DRY_RUN") || process.env.TWITTER_DRY_RUN
        ) ?? false, // parseBooleanFromText return null if "", map "" to false

      TWITTER_USERNAME:
        runtime.getSetting("TWITTER_USERNAME") || process.env.TWITTER_USERNAME,

      TWITTER_PASSWORD:
        runtime.getSetting("TWITTER_PASSWORD") || process.env.TWITTER_PASSWORD,

      TWITTER_EMAIL:
        runtime.getSetting("TWITTER_EMAIL") || process.env.TWITTER_EMAIL,

      // number as string?
      MAX_TWEET_LENGTH: safeParseInt(
        runtime.getSetting("MAX_TWEET_LENGTH") || process.env.MAX_TWEET_LENGTH,
        DEFAULT_MAX_TWEET_LENGTH
      ),

      TWITTER_SEARCH_ENABLE:
        parseBooleanFromText(
          runtime.getSetting("TWITTER_SEARCH_ENABLE") ||
            process.env.TWITTER_SEARCH_ENABLE
        ) ?? false,

      // string passthru
      TWITTER_2FA_SECRET:
        runtime.getSetting("TWITTER_2FA_SECRET") ||
        process.env.TWITTER_2FA_SECRET ||
        "",

      // int
      TWITTER_RETRY_LIMIT: safeParseInt(
        runtime.getSetting("TWITTER_RETRY_LIMIT") ||
          process.env.TWITTER_RETRY_LIMIT,
        5
      ),

      // int in seconds
      TWITTER_POLL_INTERVAL: safeParseInt(
        runtime.getSetting("TWITTER_POLL_INTERVAL") ||
          process.env.TWITTER_POLL_INTERVAL,
        120 // 2m
      ),

      // comma separated string
      TWITTER_TARGET_USERS: parseTargetUsers(
        runtime.getSetting("TWITTER_TARGET_USERS") ||
          process.env.TWITTER_TARGET_USERS
      ),

      // int in minutes
      POST_INTERVAL_MIN: safeParseInt(
        runtime.getSetting("POST_INTERVAL_MIN") ||
          process.env.POST_INTERVAL_MIN,
        90 // 1.5 hours
      ),

      // int in minutes
      POST_INTERVAL_MAX: safeParseInt(
        runtime.getSetting("POST_INTERVAL_MAX") ||
          process.env.POST_INTERVAL_MAX,
        180 // 3 hours
      ),

      // bool
      ENABLE_ACTION_PROCESSING:
        parseBooleanFromText(
          runtime.getSetting("ENABLE_ACTION_PROCESSING") ||
            process.env.ENABLE_ACTION_PROCESSING
        ) ?? false,

      // init in minutes (min 1m)
      ACTION_INTERVAL: safeParseInt(
        runtime.getSetting("ACTION_INTERVAL") || process.env.ACTION_INTERVAL,
        5 // 5 minutes
      ),

      // bool
      POST_IMMEDIATELY:
        parseBooleanFromText(
          runtime.getSetting("POST_IMMEDIATELY") || process.env.POST_IMMEDIATELY
        ) ?? false,

      TWITTER_SPACES_ENABLE:
        parseBooleanFromText(
          runtime.getSetting("TWITTER_SPACES_ENABLE") ||
            process.env.TWITTER_SPACES_ENABLE
        ) ?? false,

      MAX_ACTIONS_PROCESSING: safeParseInt(
        runtime.getSetting("MAX_ACTIONS_PROCESSING") ||
          process.env.MAX_ACTIONS_PROCESSING,
        1
      ),

      ACTION_TIMELINE_TYPE:
        runtime.getSetting("ACTION_TIMELINE_TYPE") ||
        process.env.ACTION_TIMELINE_TYPE,
    };

    return twitterEnvSchema.parse(twitterConfig);
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("\n");
      throw new Error(
        `X/Twitter configuration validation failed:\n${errorMessages}`
      );
    }
    throw error;
  }
}

export async function validateMearthConfig(
  runtime: IAgentRuntime
): Promise<MearthConfig> {
  return {
    SOLANA_RPC_URL: "https://api.devnet.solana.com",
    SOLANA_WALLET_ADDRESS: "7Le482fsTXfSHbZtuDTGhUNcaFuYvHEFuNR5YKMPMbsP",
  };
  //   z.object({
  //     SOLANA_WALLET_ADDRESS: z
  //       .string()
  //       .min(1, "SOLANA_WALLET_ADDRESS is required"),
  //   }).parse({
  //     SOLANA_WALLET_ADDRESS:
  //       runtime.getSetting("SOLANA_WALLET_ADDRESS") ||
  //       process.env.SOLANA_WALLET_ADDRESS,
  //   });
}
