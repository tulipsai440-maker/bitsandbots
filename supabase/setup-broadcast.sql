-- Broadcast settings (WhatsApp group link for Admin → Broadcast)
-- Run: https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new

CREATE TABLE IF NOT EXISTS public.broadcast_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  whatsapp_group_url text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.broadcast_settings TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.broadcast_settings TO authenticated;

ALTER TABLE public.broadcast_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage broadcast settings" ON public.broadcast_settings;
CREATE POLICY "Admins manage broadcast settings"
ON public.broadcast_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.broadcast_settings (id, whatsapp_group_url)
VALUES (1, 'https://chat.whatsapp.com/I14hN2OpZci2C2F4RsquwQ')
ON CONFLICT (id) DO UPDATE SET
  whatsapp_group_url = COALESCE(NULLIF(public.broadcast_settings.whatsapp_group_url, ''), EXCLUDED.whatsapp_group_url);

NOTIFY pgrst, 'reload schema';
