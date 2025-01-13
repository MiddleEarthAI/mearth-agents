import { IAgentRuntime, Memory, State } from "@elizaos/core";
import { Evaluator } from "./types";
import { TwitterMetrics } from "../providers/types";

const ENGAGEMENT_THRESHOLDS = {
  FOLLOWER_GROWTH: 10,
  IMPRESSIONS: 1000,
  LIKES: 50,
  REPLIES: 10,
  RETWEETS: 20,
};

export const socialEvaluator: Evaluator = {
  name: "SOCIAL_EVALUATOR",
  description: "Evaluates social media engagement and influence",
  similes: ["ENGAGEMENT_EVAL", "SOCIAL_ANALYSIS", "INFLUENCE_CHECK"],
  alwaysRun: true,
  priority: 2,

  validate: async (runtime: IAgentRuntime, message: Memory) => {
    // try {
    //   const state = await runtime.getState();
    //   return !!state.twitterMetrics;
    // } catch (error) {
    //   console.error("Social evaluation validation error:", error);
    //   return false;
    // }
    return false;
  },

  handler: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    const metrics = state.twitterMetrics as TwitterMetrics;
    if (!metrics) {
      return {
        type: "SOCIAL_EVAL",
        result: "NO_METRICS",
        recommendation: "Unable to evaluate social engagement",
      };
    }

    const engagementScore = calculateEngagementScore(metrics);
    const significantEngagement = hasSignificantEngagement(metrics);

    const analysis = {
      type: "SOCIAL_EVAL",
      result: "METRICS_ANALYZED",
      metrics: {
        followerCount: metrics.followerCount,
        impressions: metrics.impressions,
        likes: metrics.likes,
        replies: metrics.replies,
        retweets: metrics.retweets,
        engagementScore,
        significantEngagement,
      },
      recommendations: generateRecommendations(metrics, engagementScore),
    };

    // // Store analysis in runtime memory
    // await runtime.memoryManager.createMemory({
    //   id: `social-eval-${Date.now()}`,
    //   content: {
    //     text: `Social Influence Report:\n${JSON.stringify(analysis, null, 2)}`,
    //   },
    //   userId: message.userId,
    //   roomId: message.roomId,
    // });

    return analysis;
  },

  examples: [
    {
      context: "Agent experiences high engagement on recent posts",
      messages: [
        {
          user: "user1",
          content: { text: "How's our social influence looking?" },
        },
      ],
      outcome:
        "Detected significant engagement and recommended leveraging the momentum",
      explanation: "High likes and retweets triggered engagement threshold",
    },
    {
      context: "Agent has low engagement period",
      messages: [
        {
          user: "user1",
          content: { text: "Why aren't we getting much attention?" },
        },
      ],
      outcome:
        "Identified engagement issues and suggested improvement strategies",
      explanation: "Below-threshold metrics triggered recovery recommendations",
    },
  ],
};

function calculateEngagementScore(metrics: TwitterMetrics): number {
  const weights = {
    followers: 0.2,
    impressions: 0.2,
    likes: 0.3,
    replies: 0.15,
    retweets: 0.15,
  };

  return (
    (metrics.followerCount / ENGAGEMENT_THRESHOLDS.FOLLOWER_GROWTH) *
      weights.followers +
    (metrics.impressions / ENGAGEMENT_THRESHOLDS.IMPRESSIONS) *
      weights.impressions +
    (metrics.likes / ENGAGEMENT_THRESHOLDS.LIKES) * weights.likes +
    (metrics.replies / ENGAGEMENT_THRESHOLDS.REPLIES) * weights.replies +
    (metrics.retweets / ENGAGEMENT_THRESHOLDS.RETWEETS) * weights.retweets
  );
}

function hasSignificantEngagement(metrics: TwitterMetrics): boolean {
  return (
    metrics.followerCount >= ENGAGEMENT_THRESHOLDS.FOLLOWER_GROWTH ||
    metrics.impressions >= ENGAGEMENT_THRESHOLDS.IMPRESSIONS ||
    metrics.likes >= ENGAGEMENT_THRESHOLDS.LIKES ||
    metrics.replies >= ENGAGEMENT_THRESHOLDS.REPLIES ||
    metrics.retweets >= ENGAGEMENT_THRESHOLDS.RETWEETS
  );
}

function generateRecommendations(
  metrics: TwitterMetrics,
  engagementScore: number
): string[] {
  const recommendations: string[] = [];

  if (engagementScore < 1) {
    recommendations.push("Increase posting frequency to boost visibility");
    recommendations.push(
      "Engage more with other agents to build relationships"
    );
  }

  if (metrics.likes < ENGAGEMENT_THRESHOLDS.LIKES) {
    recommendations.push("Create more engaging content to increase likes");
  }

  if (metrics.replies < ENGAGEMENT_THRESHOLDS.REPLIES) {
    recommendations.push("Ask questions and encourage community discussion");
  }

  if (metrics.retweets < ENGAGEMENT_THRESHOLDS.RETWEETS) {
    recommendations.push("Share more strategic insights to encourage retweets");
  }

  if (engagementScore >= 1) {
    recommendations.push("Leverage current momentum to expand influence");
    recommendations.push(
      "Consider forming alliances with other influential agents"
    );
  }

  return recommendations;
}
