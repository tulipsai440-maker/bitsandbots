import { supabase } from "@/integrations/supabase/client";

export type Coach = {
  id: string;
  name: string;
  /** Optional photo URL — leave empty for placeholder */
  photoUrl?: string;
  /** Short bio — leave empty for placeholder copy */
  description?: string;
};

const GENERIC_COACH_BIO =
  "Guides the team through Robot Design & Code, the Innovation Project, and Core Values—helping every practice stay focused, kind, and ambitious.";

/** Static fallback if Supabase table is empty/unavailable */
export const COACHES: Coach[] = [
  {
    id: "jaime-zabala",
    name: "Jaime Zabala",
    description: GENERIC_COACH_BIO,
  },
  {
    id: "suresh-bheemanapalli",
    name: "Suresh Bheemanapalli",
    description: GENERIC_COACH_BIO,
  },
];

export function coachDisplayBio(description?: string | null): string {
  const trimmed = description?.trim();
  return trimmed || GENERIC_COACH_BIO;
}

type CoachRow = {
  id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  sort_order: number;
};

export async function fetchCoaches(): Promise<Coach[]> {
  try {
    const { data, error } = await supabase
      .from("coaches")
      .select("id, name, description, photo_url, sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;
    if (!data?.length) return COACHES;

    return (data as CoachRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      description: coachDisplayBio(row.description),
      photoUrl: row.photo_url ?? undefined,
    }));
  } catch (error) {
    console.error("[coaches]", error);
    return COACHES;
  }
}
