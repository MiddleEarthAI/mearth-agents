import {
  IAgentRuntime,
  Memory,
  State,
  getEmbeddingZeroVector,
  elizaLogger,
} from "@elizaos/core";

import { Scraper, Tweet } from "agent-twitter-client";

import { EventEmitter } from "events";

import { TwitterConfig } from "./environment";

export function extractAnswer(text: string): string {
  const startIndex = text.indexOf("Answer: ") + 8;
  const endIndex = text.indexOf("<|endoftext|>", 11);
  return text.slice(startIndex, endIndex);
}

type TwitterProfile = {
  id: string;
  username: string;
  screenName: string;
  bio: string;
  nicknames: string[];
};

export class TwitterClientBase extends EventEmitter {
  static _twitterClients: { [accountIdentifier: string]: Scraper } = {};
  twitterClient: Scraper;
  runtime: IAgentRuntime;
  twitterConfig: TwitterConfig;
  directions: string;
  lastCheckedTweetId: bigint | null = null;
  temperature: number = 0.5;
  profile: TwitterProfile | null;

  async cacheTweet(tweet: Tweet): Promise<void> {
    if (!tweet) {
      console.warn("Tweet is undefined, skipping cache");
      return;
    }

    this.runtime.cacheManager.set(`twitter/tweets/${tweet.id}`, tweet);
  }

  async getCachedTweet(tweetId: string): Promise<Tweet | undefined> {
    const cached = await this.runtime.cacheManager.get<Tweet>(
      `twitter/tweets/${tweetId}`
    );

    return cached;
  }

  async getTweet(tweetId: string): Promise<Tweet> {
    const cachedTweet = await this.getCachedTweet(tweetId);

    if (cachedTweet) {
      return cachedTweet;
    }
  }

  callback: (self: TwitterClientBase) => any = null;

  onReady() {
    throw new Error("Not implemented in base class, please call from subclass");
  }

  constructor(runtime: IAgentRuntime, twitterConfig: TwitterConfig) {
    super();
    this.runtime = runtime;
    this.twitterConfig = twitterConfig;
    const username = twitterConfig.TWITTER_USERNAME as string;

    if (TwitterClientBase._twitterClients[username]) {
      this.twitterClient = TwitterClientBase._twitterClients[username];
    } else {
      this.twitterClient = new Scraper();
      TwitterClientBase._twitterClients[username] = this.twitterClient;
    }

    this.directions =
      "- " +
      this.runtime.character.style.all.join("\n- ") +
      "- " +
      this.runtime.character.style.post.join();
  }

  async init() {
    const username = this.twitterConfig.TWITTER_USERNAME as string;
    const password = this.twitterConfig.TWITTER_PASSWORD as string;
    const email = this.twitterConfig.TWITTER_EMAIL as string;
    let retries = this.twitterConfig.TWITTER_RETRY_LIMIT as number;
    const twitter2faSecret = this.twitterConfig.TWITTER_2FA_SECRET as string;

    if (!username) {
      throw new Error("Twitter username not configured");
    }

    const cachedCookies = await this.getCachedCookies(username);

    if (cachedCookies) {
      elizaLogger.info("Using cached cookies");
      await this.setCookiesFromArray(cachedCookies);
    }

    elizaLogger.log("Waiting for Twitter login");
    while (retries > 0) {
      try {
        if (await this.twitterClient.isLoggedIn()) {
          // cookies are valid, no login required
          elizaLogger.info("Successfully logged in.");
          break;
        } else {
          await this.twitterClient.login(
            username,
            password,
            email,
            twitter2faSecret
          );
          if (await this.twitterClient.isLoggedIn()) {
            // fresh login, store new cookies
            elizaLogger.info("Successfully logged in.");
            elizaLogger.info("Caching cookies");
            await this.cacheCookies(
              username,
              await this.twitterClient.getCookies()
            );
            break;
          }
        }
      } catch (error) {
        elizaLogger.error(`Login attempt failed: ${error.message}`);
      }

      retries--;
      elizaLogger.error(
        `Failed to login to Twitter. Retrying... (${retries} attempts left)`
      );

      if (retries === 0) {
        elizaLogger.error("Max retries reached. Exiting login process.");
        throw new Error("Twitter login failed after maximum retries.");
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    // Initialize Twitter profile
    this.profile = await this.fetchProfile(username);

    if (this.profile) {
      elizaLogger.log("Twitter user ID:", this.profile.id);
      elizaLogger.log(
        "Twitter loaded:",
        JSON.stringify(this.profile, null, 10)
      );
      // Store profile info for use in responses
      this.runtime.character.twitterProfile = {
        id: this.profile.id,
        username: this.profile.username,
        screenName: this.profile.screenName,
        bio: this.profile.bio,
        nicknames: this.profile.nicknames,
      };
    } else {
      throw new Error("Failed to load profile");
    }

    await this.loadLatestCheckedTweetId();
  }

  async fetchOwnPosts(count: number): Promise<Tweet[]> {
    elizaLogger.debug("fetching own posts");
    const homeTimeline = await this.twitterClient.getUserTweets(
      this.profile.id,
      count
    );
    return homeTimeline.tweets;
  }

  /**
   * Fetch timeline for twitter account, optionally only from followed accounts
   */
  async fetchHomeTimeline(
    count: number,
    following?: boolean
  ): Promise<Tweet[]> {
    elizaLogger.debug("fetching home timeline");
    const homeTimeline = following
      ? await this.twitterClient.fetchFollowingTimeline(count, [])
      : await this.twitterClient.fetchHomeTimeline(count, []);

    elizaLogger.debug(homeTimeline, { depth: Infinity });
    const processedTimeline = homeTimeline
      .filter((t) => t.__typename !== "TweetWithVisibilityResults") // what's this about?
      .map((tweet) => {
        //console.log("tweet is", tweet);
        const obj = {
          id: tweet.id,
          name: tweet.name ?? tweet?.user_results?.result?.legacy.name,
          username:
            tweet.username ??
            tweet.core?.user_results?.result?.legacy.screen_name,
          text: tweet.text ?? tweet.legacy?.full_text,
          inReplyToStatusId:
            tweet.inReplyToStatusId ??
            tweet.legacy?.in_reply_to_status_id_str ??
            null,
          timestamp: new Date(tweet.legacy?.created_at).getTime() / 1000,
          createdAt:
            tweet.createdAt ??
            tweet.legacy?.created_at ??
            tweet.core?.user_results?.result?.legacy.created_at,
          userId: tweet.userId ?? tweet.legacy?.user_id_str,
          conversationId:
            tweet.conversationId ?? tweet.legacy?.conversation_id_str,
          permanentUrl: `https://x.com/${tweet.core?.user_results?.result?.legacy?.screen_name}/status/${tweet.rest_id}`,
          hashtags: tweet.hashtags ?? tweet.legacy?.entities.hashtags,
          mentions: tweet.mentions ?? tweet.legacy?.entities.user_mentions,
          photos:
            tweet.legacy?.entities?.media
              ?.filter((media) => media.type === "photo")
              .map((media) => ({
                id: media.id_str,
                url: media.media_url_https, // Store media_url_https as url
                alt_text: media.alt_text,
              })) || [],
          thread: tweet.thread || [],
          urls: tweet.urls ?? tweet.legacy?.entities.urls,
          videos:
            tweet.videos ??
            tweet.legacy?.entities.media?.filter(
              (media) => media.type === "video"
            ) ??
            [],
        };
        //console.log("obj is", obj);
        return obj;
      });
    //elizaLogger.debug("process homeTimeline", processedTimeline);
    return processedTimeline;
  }

  async fetchTimelineForActions(count: number): Promise<Tweet[]> {
    elizaLogger.debug("fetching timeline for actions");

    const agentUsername = this.twitterConfig.TWITTER_USERNAME;

    const homeTimeline =
      this.twitterConfig.ACTION_TIMELINE_TYPE === "Following"
        ? await this.twitterClient.fetchFollowingTimeline(count, [])
        : await this.twitterClient.fetchHomeTimeline(count, []);

    return homeTimeline
      .map((tweet) => ({
        id: tweet.rest_id,
        name: tweet.core?.user_results?.result?.legacy?.name,
        username: tweet.core?.user_results?.result?.legacy?.screen_name,
        text: tweet.legacy?.full_text,
        inReplyToStatusId: tweet.legacy?.in_reply_to_status_id_str,
        timestamp: new Date(tweet.legacy?.created_at).getTime() / 1000,
        userId: tweet.legacy?.user_id_str,
        conversationId: tweet.legacy?.conversation_id_str,
        permanentUrl: `https://twitter.com/${tweet.core?.user_results?.result?.legacy?.screen_name}/status/${tweet.rest_id}`,
        hashtags: tweet.legacy?.entities?.hashtags || [],
        mentions: tweet.legacy?.entities?.user_mentions || [],
        photos:
          tweet.legacy?.entities?.media
            ?.filter((media) => media.type === "photo")
            .map((media) => ({
              id: media.id_str,
              url: media.media_url_https, // Store media_url_https as url
              alt_text: media.alt_text,
            })) || [],
        thread: tweet.thread || [],
        urls: tweet.legacy?.entities?.urls || [],
        videos:
          tweet.legacy?.entities?.media?.filter(
            (media) => media.type === "video"
          ) || [],
      }))
      .filter((tweet) => tweet.username !== agentUsername) // do not perform action on self-tweets
      .slice(0, count);
    // TODO: Once the 'count' parameter is fixed in the 'fetchTimeline' method of the 'agent-twitter-client',
    // this workaround can be removed.
    // Related issue: https://github.com/elizaos/agent-twitter-client/issues/43
  }

  async setCookiesFromArray(cookiesArray: any[]) {
    const cookieStrings = cookiesArray.map(
      (cookie) =>
        `${cookie.key}=${cookie.value}; Domain=${cookie.domain}; Path=${
          cookie.path
        }; ${cookie.secure ? "Secure" : ""}; ${
          cookie.httpOnly ? "HttpOnly" : ""
        }; SameSite=${cookie.sameSite || "Lax"}`
    );
    await this.twitterClient.setCookies(cookieStrings);
  }

  async saveRequestMessage(message: Memory, state: State) {
    if (message.content.text) {
      const recentMessage = await this.runtime.messageManager.getMemories({
        roomId: message.roomId,
        count: 1,
        unique: false,
      });

      if (
        recentMessage.length > 0 &&
        recentMessage[0].content === message.content
      ) {
        elizaLogger.debug("Message already saved", recentMessage[0].id);
      } else {
        await this.runtime.messageManager.createMemory({
          ...message,
          embedding: getEmbeddingZeroVector(),
        });
      }

      await this.runtime.evaluate(message, {
        ...state,
        twitterClient: this.twitterClient,
      });
    }
  }

  async loadLatestCheckedTweetId(): Promise<void> {
    const latestCheckedTweetId = await this.runtime.cacheManager.get<string>(
      `twitter/${this.profile.username}/latest_checked_tweet_id`
    );

    if (latestCheckedTweetId) {
      this.lastCheckedTweetId = BigInt(latestCheckedTweetId);
    }
  }

  async cacheLatestCheckedTweetId() {
    if (this.lastCheckedTweetId) {
      await this.runtime.cacheManager.set(
        `twitter/${this.profile.username}/latest_checked_tweet_id`,
        this.lastCheckedTweetId.toString()
      );
    }
  }

  async getCachedTimeline(): Promise<Tweet[] | undefined> {
    return await this.runtime.cacheManager.get<Tweet[]>(
      `twitter/${this.profile.username}/timeline`
    );
  }

  async cacheTimeline(timeline: Tweet[]) {
    await this.runtime.cacheManager.set(
      `twitter/${this.profile.username}/timeline`,
      timeline,
      { expires: Date.now() + 10 * 1000 }
    );
  }

  async cacheMentions(mentions: Tweet[]) {
    await this.runtime.cacheManager.set(
      `twitter/${this.profile.username}/mentions`,
      mentions,
      { expires: Date.now() + 10 * 1000 }
    );
  }

  async getCachedCookies(username: string) {
    return await this.runtime.cacheManager.get<any[]>(
      `twitter/${username}/cookies`
    );
  }

  async cacheCookies(username: string, cookies: any[]) {
    await this.runtime.cacheManager.set(`twitter/${username}/cookies`, cookies);
  }

  async fetchProfile(username: string): Promise<TwitterProfile> {
    try {
      const profile = await this.twitterClient.getProfile(username);
      return {
        id: profile.userId,
        username,
        screenName: profile.name || this.runtime.character.name,
        bio:
          profile.biography || typeof this.runtime.character.bio === "string"
            ? (this.runtime.character.bio as string)
            : this.runtime.character.bio.length > 0
            ? this.runtime.character.bio[0]
            : "",
        nicknames: this.runtime.character.twitterProfile?.nicknames || [],
      } satisfies TwitterProfile;
    } catch (error) {
      console.error("Error fetching Twitter profile:", error);
      throw error;
    }
  }
}
