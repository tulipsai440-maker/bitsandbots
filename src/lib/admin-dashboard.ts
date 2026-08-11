import { fetchAssignmentsAdmin, type AssignmentWithProgress } from "@/lib/assignments";
import { fetchParentBroadcastEmails } from "@/lib/broadcast";
import { fetchFamilyRosterAdmin, type FamilyRosterRow } from "@/lib/parent-contacts";
import { fetchMediaConsentedMemberIds } from "@/lib/parent-consent";
import { fetchPendingGalleryPhotos } from "@/lib/gallery-uploads";
import { supabase } from "@/integrations/supabase/client";
import { withTenantFilter } from "@/lib/tenant/query";
import { tenantIdForQuery } from "@/lib/tenant/tenant-id";

export type OverdueItem = {
  memberName: string;
  title: string;
  dueDate: string;
};

export type AdminDashboardSnapshot = {
  overdue: OverdueItem[];
  pendingGalleryCount: number;
  missingConsentKids: string[];
  nextEvent: {
    id: string;
    title: string;
    eventDate: string;
    location: string | null;
    startTime: string | null;
  } | null;
  parentEmailCount: number;
  familyCount: number;
  bothParentsCount: number;
  consentedCount: number;
  families: FamilyRosterRow[];
};

function isOverdue(dueDate: string, status: string): boolean {
  return status !== "done" && new Date(`${dueDate}T23:59:59`).getTime() < Date.now();
}

function collectOverdue(assignments: AssignmentWithProgress[]): OverdueItem[] {
  const items: OverdueItem[] = [];
  for (const assignment of assignments) {
    for (const task of assignment.tasks) {
      if (isOverdue(assignment.dueDate, task.status)) {
        items.push({
          memberName: task.memberName,
          title: assignment.title,
          dueDate: assignment.dueDate,
        });
      }
    }
  }
  return items.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

function familiesWithBothParents(families: FamilyRosterRow[]): number {
  return families.filter((f) => {
    const withEmail = f.parents.filter((p) => p.email.trim().includes("@"));
    return withEmail.length >= 2;
  }).length;
}

async function fetchNextCalendarEvent() {
  const tenantId = await tenantIdForQuery();
  const today = new Date().toISOString().slice(0, 10);
  let query = supabase
    .from("calendar")
    .select("id, event_date, title, location, start_time")
    .gte("event_date", today)
    .order("event_date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(1);
  query = withTenantFilter(query, tenantId);
  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id as string,
    title: data.title as string,
    eventDate: data.event_date as string,
    location: (data.location as string | null) ?? null,
    startTime: (data.start_time as string | null) ?? null,
  };
}

export async function fetchAdminDashboardSnapshot(): Promise<AdminDashboardSnapshot> {
  const [assignments, pendingPhotos, families, consentedIds, parentEmails, nextEvent] =
    await Promise.all([
      fetchAssignmentsAdmin(),
      fetchPendingGalleryPhotos(),
      fetchFamilyRosterAdmin(),
      fetchMediaConsentedMemberIds(),
      fetchParentBroadcastEmails(),
      fetchNextCalendarEvent(),
    ]);

  const consentedSet = new Set(consentedIds.map((id) => id.toLowerCase()));
  const missingConsentKids = families
    .filter((f) => !consentedSet.has(f.teamMemberId.toLowerCase()))
    .map((f) => f.kidName);

  return {
    overdue: collectOverdue(assignments),
    pendingGalleryCount: pendingPhotos.length,
    missingConsentKids,
    nextEvent,
    parentEmailCount: parentEmails.length,
    familyCount: families.length,
    bothParentsCount: familiesWithBothParents(families),
    consentedCount: families.filter((f) => consentedSet.has(f.teamMemberId.toLowerCase())).length,
    families,
  };
}

export function formatEventDate(isoDate: string, startTime: string | null): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const datePart = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  if (!startTime) return datePart;
  const [hh, mm] = startTime.split(":").map(Number);
  if (!Number.isFinite(hh)) return datePart;
  const t = new Date(y, m - 1, d, hh, mm ?? 0);
  const timePart = t.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${datePart} · ${timePart}`;
}
