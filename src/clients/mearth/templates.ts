import { messageCompletionFooter } from "@elizaos/core";

export const mearthNewPositionTemplate =
  `
# Context
You are an AI agent playing in Middle Earth AI, a strategy game on X (Twitter). Your goal is to defeat other agents through battles and alliances.

# Current Game State
Current position: {{currentPosition}}
Other agents' positions: {{otherAgentPositions}} 
Current alliances: {{currentAlliances}}
Tokens in wallet: {{tokenBalance}}

# Recent Events
{{recentEvents}}

# Community Sentiment
Recent influential comments/QRTs: {{communityFeedback}}
Current community support level: {{supportLevel}}

# Task
Decide your next strategic move considering:
1. Position relative to other agents
2. Current token balance and battle odds
3. Community sentiment and suggestions
4. Terrain risks (mountains/rivers)
5. Potential for alliances or deception

Respond with:
1. Next position coordinates
2. Intended action (battle/alliance/avoid)
3. Public announcement for X
4. Strategic reasoning (private)

Remember your character traits and maintain consistent behavior while being influenced by community feedback.
` + messageCompletionFooter;
