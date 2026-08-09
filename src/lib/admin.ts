import { supabase } from "@/integrations/supabase/client";

/**
 * Admin access is NOT based on password.
 * Password only signs the user in. Admin requires a row in
 * public.user_roles with role = 'admin' for that auth.users.id.
 *
 * Prefer has_role (SECURITY DEFINER) so RLS cannot block the check.
 * Fallback: SELECT own row (RLS allows auth.uid() = user_id).
 */
export async function checkIsAdmin(): Promise<boolean> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return false;

  const userId = userData.user.id;

  const { data: rpcData, error: rpcError } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });

  if (!rpcError && typeof rpcData === "boolean") {
    return rpcData;
  }

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) {
    console.error("[checkIsAdmin]", error.message, rpcError?.message);
    return false;
  }

  return !!data;
}
