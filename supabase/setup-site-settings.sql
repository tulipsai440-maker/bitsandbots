  -- Site-wide copy, navigation, and content (singleton row + outreach stories)
  -- Run: https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new

  CREATE TABLE IF NOT EXISTS public.site_settings (
    id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    site_name text NOT NULL,
    site_tagline text NOT NULL,
    brand_color text NOT NULL DEFAULT '#1f3d1f',
    founded_year text NOT NULL,
    site_url text NOT NULL DEFAULT 'https://fllbots.com',
    practice_title text NOT NULL DEFAULT 'Team practice',
    practice_summary text NOT NULL,
    practice_place text NOT NULL,
    zoom_title text NOT NULL DEFAULT 'Zoom call',
    zoom_summary text NOT NULL,
    zoom_place text NOT NULL,
    zoom_url text,
    meetings_blurb text NOT NULL,
    meeting_summary text NOT NULL,
    about_blurb text NOT NULL,
    about_hero_description text NOT NULL,
    join_hero_description text NOT NULL,
    join_next_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
    hero_subtext text NOT NULL,
    season_eyebrow text NOT NULL,
    season_story_title text NOT NULL,
    season_story_body text NOT NULL,
    season_story_link_label text NOT NULL,
    what_we_do_title text NOT NULL,
    what_we_do_subtitle text NOT NULL,
    homepage_pillars jsonb NOT NULL DEFAULT '[]'::jsonb,
    cta_title text NOT NULL,
    cta_body text NOT NULL,
    core_values_intro text NOT NULL,
    core_values jsonb NOT NULL DEFAULT '[]'::jsonb,
    nav_links jsonb NOT NULL DEFAULT '[]'::jsonb,
    footer_explore_links jsonb NOT NULL DEFAULT '[]'::jsonb,
    footer_external_links jsonb NOT NULL DEFAULT '[]'::jsonb,
    visit_bar_links jsonb NOT NULL DEFAULT '[]'::jsonb,
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS public.outreach_stories (
    id text PRIMARY KEY,
    sort_order int NOT NULL DEFAULT 0,
    title text NOT NULL,
    description text NOT NULL,
    image_key text NOT NULL,
    default_image_url text NOT NULL,
    default_image_alt text NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  GRANT SELECT ON public.site_settings TO anon, authenticated;
  GRANT ALL ON public.site_settings TO service_role;
  GRANT SELECT ON public.outreach_stories TO anon, authenticated;
  GRANT ALL ON public.outreach_stories TO service_role;

  ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.outreach_stories ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Site settings are publicly readable" ON public.site_settings;
  CREATE POLICY "Site settings are publicly readable"
  ON public.site_settings FOR SELECT TO anon, authenticated
  USING (true);

  DROP POLICY IF EXISTS "Admins manage site settings" ON public.site_settings;
  CREATE POLICY "Admins manage site settings"
  ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

  DROP POLICY IF EXISTS "Outreach stories are publicly readable" ON public.outreach_stories;
  CREATE POLICY "Outreach stories are publicly readable"
  ON public.outreach_stories FOR SELECT TO anon, authenticated
  USING (true);

  DROP POLICY IF EXISTS "Admins manage outreach stories" ON public.outreach_stories;
  CREATE POLICY "Admins manage outreach stories"
  ON public.outreach_stories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

  GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_stories TO authenticated;

  DROP TRIGGER IF EXISTS site_settings_set_updated_at ON public.site_settings;
  CREATE TRIGGER site_settings_set_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

  DROP TRIGGER IF EXISTS outreach_stories_set_updated_at ON public.outreach_stories;
  CREATE TRIGGER outreach_stories_set_updated_at
  BEFORE UPDATE ON public.outreach_stories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

  -- Seed defaults (matches src/lib/site-settings.ts)
  INSERT INTO public.site_settings (
    id,
    site_name,
    site_tagline,
    brand_color,
    founded_year,
    site_url,
    practice_summary,
    practice_place,
    zoom_summary,
    zoom_place,
    meetings_blurb,
    meeting_summary,
    about_blurb,
    about_hero_description,
    join_hero_description,
    join_next_steps,
    hero_subtext,
    season_eyebrow,
    season_story_title,
    season_story_body,
    season_story_link_label,
    what_we_do_title,
    what_we_do_subtitle,
    homepage_pillars,
    cta_title,
    cta_body,
    core_values_intro,
    core_values,
    nav_links,
    footer_explore_links,
    footer_external_links,
    visit_bar_links
  ) VALUES (
    1,
    'Bits & Bots',
    'Community Robotics Team · Collier County',
    '#1f3d1f',
    '2024',
    'https://fllbots.com',
    'Sundays · 3:00–5:00 PM',
    'TBD',
    'Wednesdays · 6:00–6:30 PM',
    'Online · Zoom',
    'Team practice Sundays 3:00–5:00 PM (location TBD), plus a Wednesday Zoom call 6:00–6:30 PM.',
    'Sundays 3–5 · Wednesdays Zoom 6–6:30',
    'We are a community robotics team from Collier County, Florida, competing in FIRST LEGO League Challenge. Each season we research a real-world theme, design and program LEGO robots for the Robot Game, and practice Core Values like discovery, innovation, impact, inclusion, teamwork, and fun.',
    'Bits & Bots is a FIRST LEGO League team founded in 2024. Team practice Sundays 3:00–5:00 PM (location TBD), plus a Wednesday Zoom call 6:00–6:30 PM.',
    'Send a short message and a coach will follow up. You can also visit a Sunday team practice.',
    '["A coach replies within a few days.","We''ll invite you to a Sunday practice to visit.","No special gear needed for your first visit.","FIRST LEGO League Challenge is typically for ages 9–16 (grades 4–8)."]'::jsonb,
    'We research the season challenge, build robots that score on the table, and practice Core Values every Sunday—then take that energy into outreach.',
    'This season',
    'Built for the challenge—shared beyond the table',
    'Bits & Bots is a FIRST LEGO League Challenge team. We split practice between the Innovation Project, Robot Design & Code, and Core Values—then mentor newer teams and run workshops so more kids can try FLL.',
    'How we show up in the community',
    'How FLL Challenge works for us',
    'Three parts. One team. Every meeting leans into at least one of them.',
    '[{"title":"Innovation Project","copy":"Dig into the season theme, find a real problem worth solving, and present a solution we''re proud to defend."},{"title":"Robot Design & Code","copy":"Design mechanisms, write mission runs, and keep refining until the robot does the job on its own."},{"title":"Core Values","copy":"Discovery, Innovation, Impact, Inclusion, Teamwork, and Fun—how we treat each other when the run fails and when it lands.","href":"/core-values","linkLabel":"Read our Core Values →"}]'::jsonb,
    'Come to a practice',
    'Team practice Sundays 3:00–5:00 PM (location TBD), plus a Wednesday Zoom call 6:00–6:30 PM. Watch a mission run, hear an Innovation idea, or just say hello.',
    'The FIRST Core Values guide how Bits & Bots learns, competes, and works with others. Official definitions below are from FIRST / FIRST LEGO League.',
    '[{"id":"discovery","name":"Discovery","definition":"We explore new skills and ideas.","howWeLiveIt":"In meetings and at competitions, Bits & Bots teammates try new builds, coding approaches, and research methods. We treat every practice as a chance to learn something we did not know before."},{"id":"innovation","name":"Innovation","definition":"We use creativity and persistence to solve problems.","howWeLiveIt":"When a mission or project challenge stalls, we brainstorm together, test ideas, and keep iterating. Creativity and steady effort matter more than getting it right on the first try."},{"id":"impact","name":"Impact","definition":"We apply what we learn to improve our world.","howWeLiveIt":"Our Innovation Project and community workshops connect season learning to real people. We look for ways our ideas and outreach can help others beyond the robot table."},{"id":"inclusion","name":"Inclusion","definition":"We respect each other and embrace our differences.","howWeLiveIt":"Everyone on Bits & Bots has a voice in planning, building, and presenting. We welcome different strengths and make space for every teammate to contribute."},{"id":"teamwork","name":"Teamwork","definition":"We are stronger when we work together.","howWeLiveIt":"Practices and competition days are shared work. We divide roles, support one another under pressure, and celebrate progress as a team—not as individuals competing for credit."},{"id":"fun","name":"Fun","definition":"We enjoy and celebrate what we do!","howWeLiveIt":"We keep meetings energetic, cheer for hard-earned improvements, and enjoy the friendships that grow through FIRST LEGO League. Learning sticks best when the season feels joyful."}]'::jsonb,
    '[{"kind":"internal","label":"Our Team","to":"/about"},{"kind":"internal","label":"Coaches","to":"/coaches"},{"kind":"internal","label":"Calendar","to":"/calendar"},{"kind":"internal","label":"Assignments","to":"/assignments"},{"kind":"internal","label":"Videos","to":"/videos"},{"kind":"external","label":"Resources","href":"https://education.lego.com/en-us/first-lego-league/season-materials/#future-edition-3-8"},{"kind":"internal","label":"Gallery","to":"/gallery"},{"kind":"internal","label":"Outreach","to":"/outreach"}]'::jsonb,
    '[{"kind":"internal","label":"Our Team","to":"/about"},{"kind":"internal","label":"Coaches","to":"/coaches"},{"kind":"internal","label":"Calendar","to":"/calendar"},{"kind":"internal","label":"Assignments","to":"/assignments"},{"kind":"internal","label":"Gallery","to":"/gallery"},{"kind":"internal","label":"Videos","to":"/videos"},{"kind":"internal","label":"Outreach","to":"/outreach"},{"kind":"internal","label":"Sponsors","to":"/sponsors"},{"kind":"internal","label":"Core Values","to":"/core-values"},{"kind":"internal","label":"Quick Links","to":"/quick-links"}]'::jsonb,
    '[{"kind":"external","label":"FIRST LEGO League","href":"https://www.firstlegoleague.org/"},{"kind":"external","label":"FIRST Inspires","href":"https://www.firstinspires.org/"}]'::jsonb,
    '[{"kind":"internal","label":"Calendar","to":"/calendar"},{"kind":"internal","label":"Assignments","to":"/assignments"}]'::jsonb
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.outreach_stories (id, sort_order, title, description, image_key, default_image_url, default_image_alt) VALUES
    ('mentoring-teams', 0, 'Mentoring new FLL teams', 'Bits & Bots has mentored and helped found two new FIRST LEGO League teams. We share meeting routines, robot-game basics, and Core Values practices so new coaches and students can start their season with confidence.', 'outreachMentoring', '/photos/outreach/mentoring-teams.png', 'Mentors and youth building LEGO robots together'),
    ('india-fest', 1, 'India Fest workshops', 'At community celebrations such as India Fest, our team runs hands-on workshops where visitors can try simple builds, learn about FIRST LEGO League, and see how robotics connects creativity, coding, and teamwork.', 'outreachIndiaFest', '/photos/outreach/india-fest.png', 'Community festival with STEM activity tables'),
    ('steam-expo', 2, 'STEAM Expo at Collier County', 'We host workshops at STEAM Expo events in Collier County, inviting families to explore robotics stations, ask questions about FIRST LEGO League, and discover how youth can learn STEM through friendly competition and collaboration.', 'outreachSteamExpo', '/photos/outreach/steam-expo.png', 'STEAM expo with robotics and science stations')
  ON CONFLICT (id) DO NOTHING;

  NOTIFY pgrst, 'reload schema';
