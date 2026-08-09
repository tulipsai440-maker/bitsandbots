-- Unique team bios — run in SQL Editor:
-- https://supabase.com/dashboard/project/njhiqsbykiggxqkjrxse/sql/new

UPDATE public.team_members
SET description = 'Joy loves coding—debugging mission runs and making the robot''s programs sharper every week.',
    updated_at = now()
WHERE name ILIKE '%Joy%' OR name ILIKE '%Trivarn%';

UPDATE public.team_members
SET description = 'Alex likes design—sketching mechanisms and shaping how the robot looks and works on the table.',
    updated_at = now()
WHERE name ILIKE '%Alexander%' OR name ILIKE '%Alok%';

UPDATE public.team_members
SET description = 'Vihas loves exploring innovation—digging into the season theme and chasing bold Innovation Project ideas.',
    updated_at = now()
WHERE name ILIKE '%Vihas%';

UPDATE public.team_members
SET description = 'Aarav loves building apps—turning team ideas into tools the squad can actually use.',
    updated_at = now()
WHERE name ILIKE '%Aarav%';

UPDATE public.team_members
SET description = 'Aarohi enjoys creativity—bringing fresh ideas to builds, presentations, and outreach.',
    updated_at = now()
WHERE name ILIKE '%Aarohi%';

UPDATE public.team_members
SET description = 'Harshitha loves working with the team—keeping everyone connected and moving forward together.',
    updated_at = now()
WHERE name ILIKE '%Harshitha%' OR name ILIKE '%Harshita%';
