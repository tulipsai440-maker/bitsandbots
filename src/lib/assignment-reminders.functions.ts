import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { sendOverdueAssignmentReminders } from "@/lib/assignment-reminders";

const schema = z.object({
  accessToken: z.string().min(20, "Not signed in"),
});

async function assertAdmin(accessToken: string) {
  const url = process.env.SUPABASE_URL?.trim();
  const anon =
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !anon) {
    throw new Error("Server is not configured (missing Supabase env).");
  }

  const client = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await client.auth.getUser(accessToken);
  if (userError || !userData.user) throw new Error("Not signed in — refresh and try again.");

  const { data: isAdmin, error: roleError } = await client.rpc("has_role", {
    _user_id: userData.user.id,
    _role: "admin",
  });
  if (roleError || !isAdmin) throw new Error("Admin access required.");

  return userData.user;
}

/** Admin-only: send overdue reminders now (same as daily cron). */
export const runOverdueAssignmentReminders = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    await assertAdmin(data.accessToken);
    return sendOverdueAssignmentReminders();
  });
