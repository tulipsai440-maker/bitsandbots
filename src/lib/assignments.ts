import { supabase } from "@/integrations/supabase/client";
import { resolveTenantIdForFetch } from "@/lib/tenant/resolve";
import { tenantIdForQuery } from "@/lib/tenant/tenant-id";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type AssignmentStatus = "todo" | "doing" | "done";

export type AssignmentRow = {
  id: string;
  title: string;
  description: string;
  linkUrl: string | null;
  dueDate: string;
  createdAt: string;
};

export type AssignmentTaskAdmin = {
  taskId: string;
  teamMemberId: string;
  memberName: string;
  status: AssignmentStatus;
  note: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  updatedAt: string;
};

export type AssignmentWithProgress = AssignmentRow & {
  tasks: AssignmentTaskAdmin[];
  doneCount: number;
  totalCount: number;
};

export type RosterMember = {
  id: string;
  name: string;
  hasPin: boolean;
  sortOrder: number;
};

export type MyAssignmentTask = {
  taskId: string;
  assignmentId: string;
  title: string;
  description: string;
  linkUrl: string | null;
  dueDate: string;
  status: AssignmentStatus;
  note: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  updatedAt: string;
};

export const ASSIGNMENT_ATTACHMENTS_BUCKET = "assignment-attachments";
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const SESSION_KEY = "bnb_assignment_session";

function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (error && typeof error === "object" && "message" in error) {
    return new Error(String((error as { message: unknown }).message));
  }
  return new Error(String(error ?? "Request failed"));
}

export function assignmentsErrorMessage(error: unknown): string {
  return toError(error).message;
}

export function isAssignmentsSetupMissing(error: unknown): boolean {
  const err = error as { code?: string; message?: string };
  const message = toError(error).message.toLowerCase();
  // Missing attachment columns is a partial upgrade — not a full setup miss.
  if (
    message.includes("attachment_url") ||
    message.includes("attachment_name") ||
    err.code === "42703"
  ) {
    return false;
  }
  return (
    err.code === "PGRST205" ||
    err.code === "PGRST202" ||
    err.code === "42P01" ||
    message.includes("could not find the table") ||
    message.includes("could not find the function") ||
    (message.includes("schema cache") &&
      (message.includes("assignment") || message.includes("member_pin"))) ||
    (message.includes("does not exist") &&
      (message.includes("relation") || message.includes("function")) &&
      message.includes("assignment"))
  );
}

/** True when base assignments work but attachment columns/RPCs are not upgraded yet. */
export function isAssignmentAttachmentsUpgradeMissing(error: unknown): boolean {
  const err = error as { code?: string; message?: string };
  const message = toError(error).message.toLowerCase();
  return (
    err.code === "42703" ||
    message.includes("attachment_url") ||
    message.includes("attachment_name")
  );
}

export function getStoredAssignmentSession(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function storeAssignmentSession(token: string) {
  localStorage.setItem(SESSION_KEY, token);
}

export function clearAssignmentSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/** Admin: create one assignment and fan out tasks to selected teammates (default: all). */
export async function createAssignment(input: {
  title: string;
  description: string;
  linkUrl?: string | null;
  dueDate: string;
  memberIds: string[];
}): Promise<string> {
  if (!input.title.trim()) throw new Error("Title is required");
  if (!input.dueDate) throw new Error("Due date is required");
  if (!input.memberIds.length) throw new Error("Select at least one teammate");

  const { data: userData } = await supabase.auth.getUser();

  const { data: assignment, error } = await db
    .from("assignments")
    .insert({
      title: input.title.trim(),
      description: input.description.trim(),
      link_url: input.linkUrl?.trim() || null,
      due_date: input.dueDate,
      created_by: userData.user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;

  const rows = input.memberIds.map((team_member_id) => ({
    assignment_id: assignment.id,
    team_member_id,
    status: "todo",
    note: "",
  }));

  const { error: taskError } = await db.from("assignment_tasks").insert(rows);
  if (taskError) {
    await db.from("assignments").delete().eq("id", assignment.id);
    throw taskError;
  }

  return assignment.id as string;
}

export async function deleteAssignment(id: string): Promise<void> {
  const { error } = await db.from("assignments").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchAssignmentsAdmin(): Promise<AssignmentWithProgress[]> {
  const { data: assignments, error } = await db
    .from("assignments")
    .select("id, title, description, link_url, due_date, created_at")
    .order("due_date", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;

  let tasks: Record<string, unknown>[] | null = null;
  {
    const withAttachments = await db
      .from("assignment_tasks")
      .select(
        "id, assignment_id, team_member_id, status, note, attachment_url, attachment_name, updated_at",
      );

    if (withAttachments.error && isAssignmentAttachmentsUpgradeMissing(withAttachments.error)) {
      const fallback = await db
        .from("assignment_tasks")
        .select("id, assignment_id, team_member_id, status, note, updated_at");
      if (fallback.error) throw fallback.error;
      tasks = fallback.data ?? [];
    } else if (withAttachments.error) {
      throw withAttachments.error;
    } else {
      tasks = withAttachments.data ?? [];
    }
  }

  const { data: members, error: memberError } = await supabase
    .from("team_members")
    .select("id, name");

  if (memberError) throw memberError;

  const nameById = new Map((members ?? []).map((m) => [m.id as string, m.name as string]));

  return (assignments ?? []).map((row: Record<string, unknown>) => {
    const rowTasks = (tasks ?? [])
      .filter((t) => t.assignment_id === row.id)
      .map((t) => ({
        taskId: t.id as string,
        teamMemberId: t.team_member_id as string,
        memberName: nameById.get(t.team_member_id as string) ?? "Unknown",
        status: t.status as AssignmentStatus,
        note: (t.note as string) ?? "",
        attachmentUrl: (t.attachment_url as string | null) ?? null,
        attachmentName: (t.attachment_name as string | null) ?? null,
        updatedAt: t.updated_at as string,
      }))
      .sort((a: AssignmentTaskAdmin, b: AssignmentTaskAdmin) =>
        a.memberName.localeCompare(b.memberName),
      );

    const doneCount = rowTasks.filter((t: AssignmentTaskAdmin) => t.status === "done").length;

    return {
      id: row.id as string,
      title: row.title as string,
      description: (row.description as string) ?? "",
      linkUrl: (row.link_url as string | null) ?? null,
      dueDate: row.due_date as string,
      createdAt: row.created_at as string,
      tasks: rowTasks,
      doneCount,
      totalCount: rowTasks.length,
    };
  });
}

export async function adminResetMemberPin(memberId: string): Promise<void> {
  const { error } = await db.rpc("admin_reset_member_pin", {
    p_member_id: memberId,
  });
  if (error) throw error;
}

export async function fetchAssignmentRoster(): Promise<RosterMember[]> {
  const tenantId = (await resolveTenantIdForFetch()) ?? (await tenantIdForQuery());
  return fetchAssignmentRosterForTenant(tenantId);
}

async function fetchAssignmentRosterForTenant(tenantId: string): Promise<RosterMember[]> {
  const { data, error } = await db.rpc("list_assignment_roster", {
    p_tenant_id: tenantId,
  });
  if (error) throw error;

  return (data ?? []).map(
    (row: { id: string; name: string; has_pin: boolean; sort_order: number | null }) => ({
      id: row.id,
      name: row.name,
      hasPin: Boolean(row.has_pin),
      sortOrder: row.sort_order ?? 0,
    }),
  );
}

/** Soft check — true when kid file uploads need setup-assignment-attachments.sql. */
export async function needsAssignmentAttachmentsUpgrade(): Promise<boolean> {
  const { error } = await db
    .from("assignment_tasks")
    .select("attachment_url")
    .limit(1);
  if (!error) return false;
  return isAssignmentAttachmentsUpgradeMissing(error);
}

export const ASSIGNMENT_ATTACHMENTS_SETUP_SQL = `-- Assignment attachments (kid uploads → admin can view)
-- Run once: https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new

ALTER TABLE public.assignment_tasks
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_name text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assignment-attachments',
  'assignment-attachments',
  true,
  10485760,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read assignment attachments" ON storage.objects;
CREATE POLICY "Public read assignment attachments"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'assignment-attachments');

DROP POLICY IF EXISTS "Anyone can upload assignment attachments" ON storage.objects;
CREATE POLICY "Anyone can upload assignment attachments"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'assignment-attachments');

DROP POLICY IF EXISTS "Admins delete assignment attachments" ON storage.objects;
CREATE POLICY "Admins delete assignment attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'assignment-attachments'
  AND public.has_role(auth.uid(), 'admin')
);

NOTIFY pgrst, 'reload schema';
`;

export async function setMemberPin(memberId: string, pin: string): Promise<string> {
  const { data, error } = await db.rpc("set_member_pin", {
    p_member_id: memberId,
    p_pin: pin,
  });
  if (error) throw error;
  const token = data as string;
  storeAssignmentSession(token);
  return token;
}

export async function loginMemberPin(memberId: string, pin: string): Promise<string> {
  const { data, error } = await db.rpc("login_member_pin", {
    p_member_id: memberId,
    p_pin: pin,
  });
  if (error) throw error;
  const token = data as string;
  storeAssignmentSession(token);
  return token;
}

export async function fetchMyAssignmentProfile(
  token: string,
): Promise<{ id: string; name: string } | null> {
  const { data, error } = await db.rpc("my_assignment_profile", {
    p_token: token,
  });
  if (error) throw error;
  const row = (data as { id: string; name: string }[] | null)?.[0];
  return row ? { id: row.id, name: row.name } : null;
}

export async function fetchMyAssignmentTasks(token: string): Promise<MyAssignmentTask[]> {
  const { data, error } = await db.rpc("list_my_assignment_tasks", {
    p_token: token,
  });
  if (error) throw error;
  return (data ?? []).map(
    (row: {
      task_id: string;
      assignment_id: string;
      title: string;
      description: string;
      link_url: string | null;
      due_date: string;
      status: AssignmentStatus;
      note: string;
      attachment_url: string | null;
      attachment_name: string | null;
      updated_at: string;
    }) => ({
      taskId: row.task_id,
      assignmentId: row.assignment_id,
      title: row.title,
      description: row.description ?? "",
      linkUrl: row.link_url,
      dueDate: row.due_date,
      status: row.status,
      note: row.note ?? "",
      attachmentUrl: row.attachment_url ?? null,
      attachmentName: row.attachment_name ?? null,
      updatedAt: row.updated_at,
    }),
  );
}

export function validateAssignmentAttachment(file: File): string | null {
  if (!ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
    return "Use a PDF, Word doc, text file, or image (JPG, PNG, WebP, GIF).";
  }
  if (file.size > MAX_ATTACHMENT_BYTES) return "File must be 10 MB or smaller.";
  return null;
}

function attachmentExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && fromName.length <= 8) return fromName.replace(/[^a-z0-9]/g, "") || "bin";
  if (file.type === "application/pdf") return "pdf";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "bin";
}

export async function uploadAssignmentAttachment(
  file: File,
  taskId: string,
): Promise<{ url: string; name: string }> {
  const validation = validateAssignmentAttachment(file);
  if (validation) throw new Error(validation);

  const safeName = file.name.replace(/[^\w.\- ()]+/g, "_").slice(0, 120);
  const path = `tasks/${taskId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${attachmentExtension(file)}`;

  const { error } = await supabase.storage.from(ASSIGNMENT_ATTACHMENTS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("bucket") || msg.includes("not found")) {
      throw new Error(
        "Attachment storage is not set up yet. Ask a coach to run supabase/setup-assignment-attachments.sql.",
      );
    }
    throw error;
  }

  const { data } = supabase.storage.from(ASSIGNMENT_ATTACHMENTS_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, name: safeName || file.name };
}

export async function updateMyAssignmentTask(
  token: string,
  taskId: string,
  status: AssignmentStatus,
  note: string,
  attachment?: { url: string | null; name: string | null },
): Promise<void> {
  const trimmedNote = note.trim();
  if (!trimmedNote) {
    throw new Error("Please add a note before saving");
  }

  const withAttachments = await db.rpc("update_my_assignment_task", {
    p_token: token,
    p_task_id: taskId,
    p_status: status,
    p_note: trimmedNote,
    p_attachment_url: attachment?.url ?? null,
    p_attachment_name: attachment?.name ?? null,
  });

  if (!withAttachments.error) return;

  const msg = String(withAttachments.error.message || "").toLowerCase();
  const missingFn =
    msg.includes("could not find the function") ||
    msg.includes("schema cache") ||
    msg.includes("p_attachment");

  if (!missingFn) throw withAttachments.error;

  // Fallback if setup-assignment-attachments.sql has not been run yet
  const { error } = await db.rpc("update_my_assignment_task", {
    p_token: token,
    p_task_id: taskId,
    p_status: status,
    p_note: trimmedNote,
  });
  if (error) throw error;
  if (attachment?.url) {
    throw new Error(
      "Status saved, but attachments need setup-assignment-attachments.sql run in Supabase.",
    );
  }
}

export async function logoutAssignmentSession(token: string): Promise<void> {
  try {
    await db.rpc("logout_member_session", { p_token: token });
  } finally {
    clearAssignmentSession();
  }
}

export async function adminReopenAssignmentTask(taskId: string): Promise<void> {
  const { error } = await db.rpc("admin_reopen_assignment_task", { p_task_id: taskId });
  if (!error) return;
  if (isAdminAssignmentRpcMissing(error)) {
    const { error: upd } = await db.from("assignment_tasks").update({ status: "todo" }).eq("id", taskId);
    if (upd) throw upd;
    return;
  }
  throw error;
}

/** Admin: reopen all completed tasks on an assignment. Returns count reopened. */
export async function adminReopenAssignment(assignmentId: string): Promise<number> {
  const { data, error } = await db.rpc("admin_reopen_assignment", {
    p_assignment_id: assignmentId,
  });
  if (!error) return (data as number) ?? 0;
  if (isAdminAssignmentRpcMissing(error)) {
    const { data: rows, error: upd } = await db
      .from("assignment_tasks")
      .update({ status: "todo" })
      .eq("assignment_id", assignmentId)
      .eq("status", "done")
      .select("id");
    if (upd) throw upd;
    return rows?.length ?? 0;
  }
  throw error;
}

/** Admin: change a teammate's task status. */
export async function adminSetAssignmentTaskStatus(
  taskId: string,
  status: AssignmentStatus,
): Promise<void> {
  const { error } = await db.rpc("admin_set_assignment_task_status", {
    p_task_id: taskId,
    p_status: status,
  });
  if (!error) return;
  if (isAdminAssignmentRpcMissing(error)) {
    const { error: upd } = await db.from("assignment_tasks").update({ status }).eq("id", taskId);
    if (upd) throw upd;
    return;
  }
  throw error;
}

function isAdminAssignmentRpcMissing(error: unknown): boolean {
  const msg = assignmentsErrorMessage(error).toLowerCase();
  return (
    msg.includes("could not find the function") ||
    (msg.includes("schema cache") && msg.includes("admin_"))
  );
}
