import { supabase } from "@/integrations/supabase/client";

export type TeamMember = {
  id: string;
  name: string;
  /** Optional photo URL — leave empty for placeholder */
  photoUrl?: string;
  /** Short bio — leave empty for placeholder copy */
  description?: string;
  sortOrder?: number;
};

const GENERIC_BIO =
  "Builds, codes, and contributes ideas during practice—learning Robot Game missions, the Innovation Project, and Core Values with the team.";

/** Unique bios keyed by lowercase name / nickname fragments */
const UNIQUE_BIOS: Array<{ match: RegExp; bio: string }> = [
  {
    match: /\bjoy\b|trivarn/i,
    bio: "Joy loves coding—debugging mission runs and making the robot’s programs sharper every week.",
  },
  {
    match: /\balex\b|alexander|alok/i,
    bio: "Alex likes design—sketching mechanisms and shaping how the robot looks and works on the table.",
  },
  {
    match: /vihas/i,
    bio: "Vihas loves exploring innovation—digging into the season theme and chasing bold Innovation Project ideas.",
  },
  {
    match: /aarav|arav/i,
    bio: "Aarav loves building apps—turning team ideas into tools the squad can actually use.",
  },
  {
    match: /aarohi|arhoee|arohi/i,
    bio: "Aarohi enjoys creativity—bringing fresh ideas to builds, presentations, and outreach.",
  },
  {
    match: /harshitha|harshita/i,
    bio: "Harshitha loves working with the team—keeping everyone connected and moving forward together.",
  },
];

function uniqueBioForName(name: string): string | undefined {
  return UNIQUE_BIOS.find((entry) => entry.match.test(name))?.bio;
}

/** Static fallback if Supabase table is empty/unavailable */
export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "trivarn-bheemanapalli",
    name: "Trivarn Bheemanapalli (Joy)",
    description: uniqueBioForName("Joy")!,
  },
  {
    id: "alexander-zabala",
    name: "Alexander Zabala (Alok)",
    description: uniqueBioForName("Alex")!,
  },
  {
    id: "tejasri-pandiri",
    name: "Tejasri Pandiri",
    description: GENERIC_BIO,
  },
  {
    id: "vihas-koyyalmudi",
    name: "Vihas Koyyalmudi",
    description: uniqueBioForName("Vihas")!,
  },
  {
    id: "harshitha-naveenkumar",
    name: "Harshitha Naveenkumar",
    description: uniqueBioForName("Harshitha")!,
  },
  {
    id: "aarav-jalwankar",
    name: "Aarav Jalwankar",
    description: uniqueBioForName("Aarav")!,
  },
  {
    id: "aarohi-jalwankar",
    name: "Aarohi Jalwankar",
    description: uniqueBioForName("Aarohi")!,
  },
];

export function teamMemberDisplayBio(description?: string | null, name?: string, fallback?: string): string {
  const trimmed = description?.trim();
  if (trimmed) return trimmed;
  if (name) {
    const unique = uniqueBioForName(name);
    if (unique) return unique;
  }
  return fallback?.trim() || GENERIC_BIO;
}

type TeamMemberRow = {
  id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  sort_order: number;
};

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  try {
    const { data, error } = await supabase
      .from("team_members")
      .select("id, name, description, photo_url, sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;
    if (!data?.length) return TEAM_MEMBERS;

    return (data as TeamMemberRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      photoUrl: row.photo_url ?? undefined,
      sortOrder: row.sort_order,
    }));
  } catch (error) {
    console.error("[team_members]", error);
    return TEAM_MEMBERS;
  }
}
