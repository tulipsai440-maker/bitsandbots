-- Tenant-scoped RLS for authenticated writes (run after setup-multi-tenant.sql)
-- SQL Editor: https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new
--
-- Public SELECT stays open (anon reads all rows) — the SPA filters by tenant_id in queries.
-- This patch stops authenticated users from writing across tenants.
-- Platform super-admins (user_roles.admin) still pass has_tenant_role via OR in that helper.

-- ========== team_members / coaches / sponsors / calendar ==========

DROP POLICY IF EXISTS "Authenticated users can manage team members" ON public.team_members;
CREATE POLICY "Tenant admins manage team members"
ON public.team_members FOR ALL TO authenticated
USING (public.has_tenant_role(tenant_id, auth.uid(), 'admin'))
WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can manage coaches" ON public.coaches;
CREATE POLICY "Tenant admins manage coaches"
ON public.coaches FOR ALL TO authenticated
USING (public.has_tenant_role(tenant_id, auth.uid(), 'admin'))
WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage sponsors" ON public.sponsors;
DROP POLICY IF EXISTS "Authenticated users can manage sponsors" ON public.sponsors;
CREATE POLICY "Tenant admins insert sponsors"
ON public.sponsors FOR INSERT TO authenticated
WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), 'admin'));
CREATE POLICY "Tenant admins update sponsors"
ON public.sponsors FOR UPDATE TO authenticated
USING (public.has_tenant_role(tenant_id, auth.uid(), 'admin'))
WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), 'admin'));
CREATE POLICY "Tenant admins delete sponsors"
ON public.sponsors FOR DELETE TO authenticated
USING (public.has_tenant_role(tenant_id, auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage calendar" ON public.calendar;
DROP POLICY IF EXISTS "Authenticated users can manage calendar" ON public.calendar;
DROP POLICY IF EXISTS "Auth can insert calendar" ON public.calendar;
DROP POLICY IF EXISTS "Auth can update calendar" ON public.calendar;
DROP POLICY IF EXISTS "Auth can delete calendar" ON public.calendar;
CREATE POLICY "Tenant admins insert calendar"
ON public.calendar FOR INSERT TO authenticated
WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), 'admin'));
CREATE POLICY "Tenant admins update calendar"
ON public.calendar FOR UPDATE TO authenticated
USING (public.has_tenant_role(tenant_id, auth.uid(), 'admin'))
WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), 'admin'));
CREATE POLICY "Tenant admins delete calendar"
ON public.calendar FOR DELETE TO authenticated
USING (public.has_tenant_role(tenant_id, auth.uid(), 'admin'));

-- ========== site_settings / outreach / broadcast ==========

DROP POLICY IF EXISTS "Admins manage site settings" ON public.site_settings;
CREATE POLICY "Tenant admins manage site settings"
ON public.site_settings FOR ALL TO authenticated
USING (public.has_tenant_role(tenant_id, auth.uid(), 'admin'))
WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage outreach stories" ON public.outreach_stories;
CREATE POLICY "Tenant admins manage outreach stories"
ON public.outreach_stories FOR ALL TO authenticated
USING (public.has_tenant_role(tenant_id, auth.uid(), 'admin'))
WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage broadcast settings" ON public.broadcast_settings;
CREATE POLICY "Tenant admins manage broadcast settings"
ON public.broadcast_settings FOR ALL TO authenticated
USING (public.has_tenant_role(tenant_id, auth.uid(), 'admin'))
WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), 'admin'));

-- ========== site_images / gallery ==========

DROP POLICY IF EXISTS "Admins manage site images" ON public.site_images;
CREATE POLICY "Tenant admins manage site images"
ON public.site_images FOR ALL TO authenticated
USING (public.has_tenant_role(tenant_id, auth.uid(), 'admin'))
WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage gallery photos" ON public.gallery_photos;
CREATE POLICY "Tenant admins manage gallery photos"
ON public.gallery_photos FOR ALL TO authenticated
USING (public.has_tenant_role(tenant_id, auth.uid(), 'admin'))
WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), 'admin'));

-- ========== assignments ==========

DROP POLICY IF EXISTS "Admins manage assignments" ON public.assignments;
CREATE POLICY "Tenant admins manage assignments"
ON public.assignments FOR ALL TO authenticated
USING (public.has_tenant_role(tenant_id, auth.uid(), 'admin'))
WITH CHECK (public.has_tenant_role(tenant_id, auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage assignment tasks" ON public.assignment_tasks;
CREATE POLICY "Tenant admins manage assignment tasks"
ON public.assignment_tasks FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.assignments a
    WHERE a.id = assignment_id
      AND public.has_tenant_role(a.tenant_id, auth.uid(), 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.assignments a
    WHERE a.id = assignment_id
      AND public.has_tenant_role(a.tenant_id, auth.uid(), 'admin')
  )
);

DROP POLICY IF EXISTS "Admins manage member pins" ON public.member_pins;
CREATE POLICY "Tenant admins manage member pins"
ON public.member_pins FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.id = team_member_id
      AND public.has_tenant_role(tm.tenant_id, auth.uid(), 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.id = team_member_id
      AND public.has_tenant_role(tm.tenant_id, auth.uid(), 'admin')
  )
);

-- ========== parent contacts ==========

DROP POLICY IF EXISTS "Admins manage participant details" ON public.participant_details;
CREATE POLICY "Tenant admins manage participant details"
ON public.participant_details FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.id = team_member_id
      AND public.has_tenant_role(tm.tenant_id, auth.uid(), 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.id = team_member_id
      AND public.has_tenant_role(tm.tenant_id, auth.uid(), 'admin')
  )
);

DROP POLICY IF EXISTS "Admins manage parent contacts" ON public.parent_contacts;
CREATE POLICY "Tenant admins manage parent contacts"
ON public.parent_contacts FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.id = team_member_id
      AND public.has_tenant_role(tm.tenant_id, auth.uid(), 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.id = team_member_id
      AND public.has_tenant_role(tm.tenant_id, auth.uid(), 'admin')
  )
);

DROP POLICY IF EXISTS "Admins manage parent media consents" ON public.parent_media_consents;
CREATE POLICY "Tenant admins manage parent media consents"
ON public.parent_media_consents FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.id = team_member_id
      AND public.has_tenant_role(tm.tenant_id, auth.uid(), 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.id = team_member_id
      AND public.has_tenant_role(tm.tenant_id, auth.uid(), 'admin')
  )
);

NOTIFY pgrst, 'reload schema';
