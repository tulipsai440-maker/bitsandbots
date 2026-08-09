/**
 * Official FIRST Core Values wording from FIRST / FIRST LEGO League.
 * Source: https://help.firstinspires.org/s/article/What-are-the-FIRST-Core-Values
 * and https://www.firstlegoleague.org/
 */
export type CoreValue = {
  id: string;
  name: string;
  /** Official FIRST definition */
  definition: string;
  /** How Bits & Bots practices this value */
  howWeLiveIt: string;
};

export const CORE_VALUES: CoreValue[] = [
  {
    id: "discovery",
    name: "Discovery",
    definition: "We explore new skills and ideas.",
    howWeLiveIt:
      "In meetings and at competitions, Bits & Bots teammates try new builds, coding approaches, and research methods. We treat every practice as a chance to learn something we did not know before.",
  },
  {
    id: "innovation",
    name: "Innovation",
    definition: "We use creativity and persistence to solve problems.",
    howWeLiveIt:
      "When a mission or project challenge stalls, we brainstorm together, test ideas, and keep iterating. Creativity and steady effort matter more than getting it right on the first try.",
  },
  {
    id: "impact",
    name: "Impact",
    definition: "We apply what we learn to improve our world.",
    howWeLiveIt:
      "Our Innovation Project and community workshops connect season learning to real people. We look for ways our ideas and outreach can help others beyond the robot table.",
  },
  {
    id: "inclusion",
    name: "Inclusion",
    definition: "We respect each other and embrace our differences.",
    howWeLiveIt:
      "Everyone on Bits & Bots has a voice in planning, building, and presenting. We welcome different strengths and make space for every teammate to contribute.",
  },
  {
    id: "teamwork",
    name: "Teamwork",
    definition: "We are stronger when we work together.",
    howWeLiveIt:
      "Practices and competition days are shared work. We divide roles, support one another under pressure, and celebrate progress as a team—not as individuals competing for credit.",
  },
  {
    id: "fun",
    name: "Fun",
    definition: "We enjoy and celebrate what we do!",
    howWeLiveIt:
      "We keep meetings energetic, cheer for hard-earned improvements, and enjoy the friendships that grow through FIRST LEGO League. Learning sticks best when the season feels joyful.",
  },
];
