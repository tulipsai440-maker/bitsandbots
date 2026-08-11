/** Official BIOGLOW Future Edition videos (FIRST LEGO League playlist). */
export const BIOGLOW_PLAYLIST_ID = "PLN4Ga33Nt9wI";
export const BIOGLOW_PLAYLIST_URL =
  "https://www.youtube.com/playlist?list=PLN4Ga33Nt9wI";

/** Official LEGO Education season materials (Future Edition 3–8). */
export const BIOGLOW_RESOURCES_URL =
  "https://education.lego.com/en-us/first-lego-league/season-materials/#future-edition-3-8";

export type SeasonDocument = {
  id: string;
  title: string;
  blurb: string;
  href: string;
};

/** Core PDFs coaches and kids open most often. */
export const BIOGLOW_DOCUMENTS: SeasonDocument[] = [
  {
    id: "engineering-notebook",
    title: "Engineering Notebook",
    blurb: "Session-by-session guide through the BIOGLOW season.",
    href: "https://assets.education.lego.com/v3/assets/blt293eea581807678a/blt1873dd3748b033da/6a69a0045f29185e1313a711/fll-future-3-8-bioglow-EN.pdf?locale=en-us",
  },
  {
    id: "rulebook",
    title: "Rulebook",
    blurb: "Official rules, requirements, and permitted materials.",
    href: "https://assets.education.lego.com/v3/assets/blt293eea581807678a/blt0ab6a9966c6b1311/6a69a004d2b04f14a12a973f/fll-future-3-8-bioglow-rulebook.pdf?locale=en-us",
  },
  {
    id: "game-missions",
    title: "Game Missions",
    blurb: "All missions at a glance, including points for each.",
    href: "https://assets.education.lego.com/v3/assets/blt293eea581807678a/blt459e8bb5a19be9e2/6a69a003c5cd7b190e301570/fll-future-3-8-bioglow-game-missions.pdf?locale=en-us",
  },
  {
    id: "rubric",
    title: "Judging Rubric",
    blurb: "How judges score project and engineering design.",
    href: "https://assets.education.lego.com/v3/assets/blt293eea581807678a/blt1b8554fe4725d8ab/6a69a0038e0e241a1a7177cd/fll-future-3-8-judging-rubric.pdf?locale=en-us",
  },
  {
    id: "scoresheet",
    title: "Score Sheet",
    blurb: "Official scoresheet for recording game results.",
    href: "https://assets.education.lego.com/v3/assets/blt293eea581807678a/blt227e82bbf933aaa2/6a69a003b469f6a7193cd8f2/fll-future-3-8-bioglow-scoresheet.pdf?locale=en-us",
  },
];

export type SeasonVideo = {
  id: string;
  title: string;
  /** Short line shown under the title */
  blurb: string;
  /** Optional grouping for the page */
  group: "season" | "game" | "roles";
};

export function youtubeWatchUrl(videoId: string, playlistId = BIOGLOW_PLAYLIST_ID): string {
  return `https://www.youtube.com/watch?v=${videoId}&list=${playlistId}`;
}

export function youtubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/** Ordered for team learning — intro first, then game, then roles. */
export const BIOGLOW_VIDEOS: SeasonVideo[] = [
  {
    id: "vHT9L_x9P_E",
    title: "BIOGLOW Season Introduction",
    blurb: "Overview of the Future Edition season, project, and game.",
    group: "season",
  },
  {
    id: "JDJch3tYZok",
    title: "Game Missions",
    blurb: "Learn the missions and how they are scored.",
    group: "game",
  },
  {
    id: "YXyhSA-sfQg",
    title: "Field Setup",
    blurb: "Official video for setting up the BIOGLOW game field.",
    group: "game",
  },
  {
    id: "Vlngofa75Cs",
    title: "Driver Role",
    blurb: "Drive the base, collect tokens, and complete missions.",
    group: "roles",
  },
  {
    id: "k3mS-j4F880",
    title: "Operator Role",
    blurb: "Operate tools to place resources on the field.",
    group: "roles",
  },
  {
    id: "oiCQPNKU6HU",
    title: "Specialist Role",
    blurb: "Coordinate the Grand Tree and resource flow.",
    group: "roles",
  },
  {
    id: "sfmWY0_PiUM",
    title: "Technician Role",
    blurb: "Design technical solutions and deliver keystone species.",
    group: "roles",
  },
];
