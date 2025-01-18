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

export const mearthActionTemplate = `
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

You MUST choose one of these actions:
- MOVE: Move to new coordinates
- BATTLE: Initiate battle with nearby agent
- ALLIANCE: Propose alliance with nearby agent
- DECEIVE: Announce false move to mislead others

Response format should be formatted in a JSON block like this:
\`\`\`json
{ "user": "{{agentName}}", "text": "string", "action": "string" }
\`\`\`
`;

// JSON block pattern for parsing
export const mearthJsonBlockPattern = /```json\n([\s\S]*?)\n```/;

// Template for generating Mearth movement actions
export const mearthMovementTemplate = `
# Context
{{recentActions}}

# Character Info
{{characterInfo}}

# Current Position
x: {{position.x}}, y: {{position.y}}
Terrain: {{terrain}}

# Task
Generate a movement action for the character that:
1. Is appropriate for the current terrain
2. Maintains realistic movement speed
3. Considers nearby agents and terrain features
4. Follows game mechanics rules

Respond in JSON format with movement direction and speed.
\`\`\`json
{
    "move": {
        "direction": "string", 
        "speed": number
    }
}
\`\`\``;

// Template for battle actions
export const mearthBattleTemplate = `
# Context
{{recentBattles}}
{{nearbyAgents}}

# Character Stats
Health: {{stats.health}}
Tokens: {{stats.tokens}}

# Task
Generate a battle action that:
1. Evaluates risk vs reward
2. Considers character's current status
3. Follows battle mechanics rules
4. Sets appropriate token stakes

Respond in JSON format with battle parameters.
\`\`\`json
{
    "battle": {
        "targetAgent": "string",
        "probability": number,
        "tokensAtRisk": number
    }
}
\`\`\``;

// Template for strategy actions
export const mearthStrategyTemplate = `
# Context
{{gameState}}
{{alliances}}
{{threats}}

# Task
Generate a strategic action that:
1. Advances character goals
2. Manages relationships with other agents
3. Considers long-term consequences
4. Maintains character consistency

Respond in JSON format with strategy details.
\`\`\`json
{
    "strategy": {
        "isDeceptive": boolean,
        "targetCommunity": "string",
        "message": "string"
    }
}
\`\`\``;
