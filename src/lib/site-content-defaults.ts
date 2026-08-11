import {
  BIOGLOW_DOCUMENTS,
  BIOGLOW_PLAYLIST_ID,
  BIOGLOW_PLAYLIST_URL,
  BIOGLOW_RESOURCES_URL,
  BIOGLOW_VIDEOS,
  type SeasonDocument,
  type SeasonVideo,
} from "@/lib/season-videos";
import type { NavLinkItem } from "@/lib/site-settings";

/** Default accent gold — matches src/styles.css */
export const DEFAULT_ACCENT_COLOR = "#bd9c3a";

export type SeasonVideoGroup = {
  key: SeasonVideo["group"];
  title: string;
  copy: string;
};

export type QuickLinkCard = {
  id: string;
  label: string;
  href: string;
  desc: string;
};

export const DEFAULT_SEASON_VIDEO_GROUPS: SeasonVideoGroup[] = [
  { key: "season", title: "Start here", copy: "Watch the season introduction first." },
  { key: "game", title: "Robot Game", copy: "Missions and how to set up the field." },
  { key: "roles", title: "Game roles", copy: "Driver, Operator, Specialist, and Technician." },
];

export const DEFAULT_GENERIC_COACH_BIO =
  "Guides the team through Robot Design & Code, the Innovation Project, and Core Values—helping every practice stay focused, kind, and ambitious.";

export const DEFAULT_GENERIC_MEMBER_BIO =
  "Builds, codes, and contributes ideas during practice—learning Robot Game missions, the Innovation Project, and Core Values with the team.";

export const DEFAULT_QUICK_LINKS: QuickLinkCard[] = [
  {
    id: "season-videos",
    label: "Season videos",
    href: "/videos",
    desc: "Season intro, missions, field setup, role videos, and official PDFs.",
  },
  {
    id: "season-resources",
    label: "Season resources",
    href: BIOGLOW_RESOURCES_URL,
    desc: "Official LEGO Education materials for Future Edition (grades 3–8).",
  },
  ...BIOGLOW_DOCUMENTS.map((doc) => ({
    id: doc.id,
    label: doc.title,
    href: doc.href,
    desc: doc.blurb,
  })),
  {
    id: "season-playlist",
    label: "Full season playlist",
    href: BIOGLOW_PLAYLIST_URL,
    desc: "Official FIRST LEGO League YouTube playlist for Future Edition.",
  },
  {
    id: "fll",
    label: "FIRST LEGO League",
    href: "https://www.firstlegoleague.org/",
    desc: "Official FLL program site — seasons, challenges, and team resources.",
  },
  {
    id: "first-inspires",
    label: "FIRST Inspires",
    href: "https://www.firstinspires.org/",
    desc: "Home of FIRST robotics programs for youth of all ages.",
  },
  {
    id: "fll-challenge",
    label: "Season Challenge",
    href: "https://www.firstinspires.org/robotics/fll",
    desc: "Learn about the current FIRST LEGO League challenge theme.",
  },
  {
    id: "core-values-official",
    label: "Core Values",
    href: "https://www.firstinspires.org/robotics/fll/core-values",
    desc: "Discovery, Innovation, Impact, Inclusion, Teamwork, and Fun.",
  },
  {
    id: "team-resources",
    label: "Team Resources",
    href: "https://www.firstinspires.org/resource-library",
    desc: "Guides, updates, and materials for FLL teams and coaches.",
  },
  {
    id: "calendar",
    label: "Team calendar",
    href: "/calendar",
    desc: "Upcoming practices, Zoom calls, and team events.",
  },
  {
    id: "gallery",
    label: "Photo Gallery",
    href: "/gallery",
    desc: "Photos from practices, builds, and events.",
  },
];

export type SeasonContentDefaults = {
  seasonName: string;
  seasonPlaylistId: string;
  seasonPlaylistUrl: string;
  seasonResourcesUrl: string;
  seasonDocuments: SeasonDocument[];
  seasonVideos: SeasonVideo[];
  seasonVideoGroups: SeasonVideoGroup[];
  quickLinks: QuickLinkCard[];
};

export const DEFAULT_SEASON_CONTENT: SeasonContentDefaults = {
  seasonName: "BIOGLOW",
  seasonPlaylistId: BIOGLOW_PLAYLIST_ID,
  seasonPlaylistUrl: BIOGLOW_PLAYLIST_URL,
  seasonResourcesUrl: BIOGLOW_RESOURCES_URL,
  seasonDocuments: BIOGLOW_DOCUMENTS,
  seasonVideos: BIOGLOW_VIDEOS,
  seasonVideoGroups: DEFAULT_SEASON_VIDEO_GROUPS,
  quickLinks: DEFAULT_QUICK_LINKS,
};

/** Internal nav button on homepage / CTA */
export type NavButton = {
  label: string;
  path: string;
};

export const DEFAULT_HERO_BUTTONS = {
  primary: { label: "Meet the team", path: "/about" },
  secondary: { label: "Watch season videos", path: "/videos" },
} as const;

export const DEFAULT_CTA_BUTTONS = {
  primary: { label: "Calendar", path: "/calendar" },
  secondary: { label: "Our Team", path: "/about" },
} as const;

export const DEFAULT_CORE_VALUES_OFFICIAL_BLURB =
  "Our community expresses the FIRST philosophies of Gracious Professionalism® and Coopertition® through the FIRST Core Values.";

export const DEFAULT_FOOTER_MEET_TEAM_LABEL = "Meet our team";

export function navButtonFromPath(label: string, path: string): NavLinkItem {
  if (path.startsWith("http")) {
    return { kind: "external", label, href: path };
  }
  return { kind: "internal", label, to: path.startsWith("/") ? path : `/${path}` };
}
