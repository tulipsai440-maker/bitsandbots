-- Tenant-scoped assignment roster (superseded by patch-tenant-rpcs.sql)
-- Kept for reference; run patch-tenant-rpcs.sql instead (includes this + other RPCs).

CREATE OR REPLACE FUNCTION public.list_assignment_roster(p_tenant_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  name text,
  has_pin boolean,
  sort_order int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    t.id,
    t.name,
    EXISTS (
      SELECT 1 FROM public.member_pins p WHERE p.team_member_id = t.id
    ) AS has_pin,
    t.sort_order
  FROM public.team_members t
  WHERE t.tenant_id = COALESCE(
    p_tenant_id,
    'a1111111-1111-1111-1111-111111111111'::uuid
  )
  ORDER BY t.sort_order ASC, t.name ASC;
$$;

REVOKE EXECUTE ON FUNCTION public.list_assignment_roster(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_assignment_roster(uuid) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
