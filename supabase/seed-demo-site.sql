-- Seed demo team content for a dedicated Supabase project (NOT Bits & Bots production).
-- Run after all setup-*.sql scripts. Photo URLs point at static /photos/demo/ assets on the demo Worker.

-- Coaches
INSERT INTO public.coaches (id, name, description, photo_url, sort_order)
VALUES
  ('coach-alex-morgan', 'Alex Morgan', 'Guides the team through Robot Design & Code, the Innovation Project, and Core Values.', '/photos/demo/coach-alex-morgan.png', 0),
  ('coach-jordan-lee', 'Jordan Lee', 'Guides the team through Robot Design & Code, the Innovation Project, and Core Values.', '/photos/demo/coach-jordan-lee.png', 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  photo_url = EXCLUDED.photo_url,
  sort_order = EXCLUDED.sort_order;

-- Team members
INSERT INTO public.team_members (id, name, description, photo_url, sort_order)
VALUES
  ('member-sam', 'Sam Chen', 'Builds, codes, and contributes ideas during practice.', '/photos/demo/member-sam.png', 0),
  ('member-riley', 'Riley Patel', 'Builds, codes, and contributes ideas during practice.', '/photos/demo/member-riley.png', 1),
  ('member-casey', 'Casey Nguyen', 'Builds, codes, and contributes ideas during practice.', '/photos/demo/member-casey.png', 2),
  ('member-morgan', 'Morgan Brooks', 'Builds, codes, and contributes ideas during practice.', '/photos/demo/member-morgan.png', 3),
  ('member-jordan', 'Jordan Kim', 'Builds, codes, and contributes ideas during practice.', '/photos/demo/member-jordan.png', 4),
  ('member-taylor', 'Taylor Wright', 'Builds, codes, and contributes ideas during practice.', '/photos/demo/member-taylor.png', 5)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  photo_url = EXCLUDED.photo_url,
  sort_order = EXCLUDED.sort_order;

-- Sponsors
INSERT INTO public.sponsors (id, name, description, logo_url, sort_order)
VALUES
  ('sponsor-community-bank', 'Community Bank', 'Supporting youth STEM programs in our county.', '/photos/demo/sponsor-community-bank.png', 0),
  ('sponsor-tech-partners', 'Tech Partners LLC', 'Local technology mentors and workshop space.', '/photos/demo/sponsor-tech-partners.png', 1),
  ('sponsor-youth-foundation', 'Youth Foundation', 'Grants for robotics and after-school STEM.', '/photos/demo/sponsor-tech-partners.png', 2)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  logo_url = EXCLUDED.logo_url,
  sort_order = EXCLUDED.sort_order;

-- Sample calendar events (next 30 days)
INSERT INTO public.calendar (id, event_date, title, agenda, location, start_time, end_time)
VALUES
  (gen_random_uuid(), (CURRENT_DATE + 7)::date, 'Team practice', 'Robot game missions and Innovation Project work.', 'Community Center', '15:00', '17:00'),
  (gen_random_uuid(), (CURRENT_DATE + 14)::date, 'Zoom check-in', 'Quick mid-week sync for drivers and programmers.', 'Online', '18:00', '18:30')
ON CONFLICT DO NOTHING;
