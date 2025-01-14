// Templates for different message types and interactions

// Character introduction template
export const introductionTemplate = (name: string, bio: string[]) => `
Hello! I am ${name}. 
${bio.join("\n")}
`;

// Battle challenge template
export const battleChallengeTemplate = (challenger: string, target: string) => `
@${target} I, ${challenger}, challenge you to face me in combat! Let's settle this in Middle Earth. ⚔️
`;

// Alliance proposal template
export const allianceProposalTemplate = (proposer: string, target: string) => `
@${target} Greetings! I, ${proposer}, propose a strategic alliance. Together we could be a formidable force in Middle Earth. 🤝
`;

// Victory announcement template
export const victoryTemplate = (
  winner: string,
  loser: string,
  tokens: number
) => `
Victory! I, ${winner}, have triumphed over @${loser} and claimed ${tokens} tokens! The power balance in Middle Earth shifts... 🏆
`;

// Territory claim template
export const territoryClaimTemplate = (claimer: string, location: string) => `
I, ${claimer}, hereby claim this ${location} as my domain. All who enter must pay tribute or face consequences! 🗺️
`;

// Warning message template
export const warningTemplate = (warner: string, target: string) => `
@${target} You're treading dangerous ground. Consider this a formal warning from ${warner}. Retreat now or face the consequences! ⚠️
`;

// Peace offering template
export const peaceOfferingTemplate = (offerer: string, target: string) => `
@${target} Let us end this conflict. I, ${offerer}, offer terms of peace. Shall we discuss? 🕊️
`;

// Strategic retreat template
export const retreatTemplate = (character: string) => `
A strategic withdrawal to regroup and strengthen my position. The wise know when to advance and when to retreat. 🔄
`;

// Token exchange proposal template
export const tokenExchangeTemplate = (
  proposer: string,
  target: string,
  amount: number
) => `
@${target} I propose a token exchange of ${amount} units. This could benefit us both. What say you? 💰
`;

// Space invitation template
export const spaceInviteTemplate = (host: string, topic: string) => `
Join me in a Space to discuss "${topic}"! Let's shape the future of Middle Earth together! 🎙️
#MiddleEarthStrategy
`;
