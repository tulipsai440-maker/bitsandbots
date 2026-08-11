import { supabase } from "@/integrations/supabase/client";
import { isDemoMode, usesDemoPlaceholders } from "@/lib/demo/app-mode";
import { DEMO_COACHES } from "@/lib/demo/demo-fallbacks";
import { shouldUseDemoAssets } from "@/lib/demo/demo-tenant";
import { withTenantFilter } from "@/lib/tenant/query";
import { resolveTenantIdForFetch } from "@/lib/tenant/resolve";

export type Coach = {
  id: string;
  name: string;
  photoUrl?: string;
  description?: string;
  sortOrder?: number;
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

export function coachDisplayBio(description?: string | null, fallback?: string): string {
  const trimmed = description?.trim();
  return trimmed || fallback?.trim() || GENERIC_COACH_BIO;
}

type CoachRow = {
  id: string;
  name: string;
  email: string | null;
  description: string | null;
  photo_url: string | null;
  sort_order: number;
};

export async function fetchCoaches(): Promise<Coach[]> {
  const useDemoFallbacks = await shouldUseDemoAssets();
  try {
    const tenantId = await resolveTenantIdForFetch();
    let query = supabase
      .from("coaches")
      .select("id, name, description, photo_url, sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    query = withTenantFilter(query, tenantId);

    const { data, error } = await query;

    if (error) throw error;
    if (!data?.length) return useDemoFallbacks ? DEMO_COACHES : COACHES;

    return (data as Omit<CoachRow, "email">[]).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      photoUrl: row.photo_url ?? undefined,
      sortOrder: row.sort_order,
    }));
  } catch (error) {
    console.error("[coaches]", error);
    return useDemoFallbacks ? DEMO_COACHES : COACHES;
  }
}
