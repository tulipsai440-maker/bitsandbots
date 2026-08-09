import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { FOUNDED_YEAR, MEETINGS_BLURB, PRACTICE_PLACE, PRACTICE_SUMMARY, SITE_NAME, SITE_TAGLINE, ZOOM_PLACE, ZOOM_SUMMARY } from "@/lib/photos";
import { fetchTeamMembers, teamMemberDisplayBio, type TeamMember } from "@/lib/team-members";
import { MapPin, Clock, UserRound } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: `Our Team — ${SITE_NAME}` },
      {
        name: "description",
        content: `Meet the ${SITE_NAME} FIRST LEGO League teammates. Founded in ${FOUNDED_YEAR}.`,
      },
      { property: "og:title", content: `Our Team — ${SITE_NAME}` },
      { property: "og:description", content: "Team members and weekly practice details." },
    ],
  }),
  loader: async () => ({
    members: await fetchTeamMembers(),
  }),
  component: AboutPage,
});

function AboutPage() {
  const { members } = Route.useLoaderData();

  return (
    <SiteLayout>
      <PageHero
        title="Our Team"
        align="center"
        description={`${SITE_NAME} is a FIRST LEGO League team founded in ${FOUNDED_YEAR}. ${MEETINGS_BLURB}`}
      />

      <section className="pt-10">
        <div className="container-page">
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
            <h2 className="font-display text-2xl text-foreground">About {SITE_NAME}</h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              We are a community robotics team from Collier County, Florida, competing in FIRST LEGO
              League Challenge. Each season we research a real-world theme, design and program LEGO
              robots for the Robot Game, and practice Core Values like discovery, innovation, impact,
              inclusion, teamwork, and fun.
            </p>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16">
        <div className="container-page">
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl md:text-5xl">Team members</h2>
            <p className="mt-3 text-muted-foreground">
              Meet the builders behind Bits &amp; Bots. Bios and photos can be updated anytime in Admin.
            </p>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {members.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-sand py-14 md:py-16">
        <div className="container-page">
          <h2 className="font-display text-4xl md:text-5xl">Meeting details</h2>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Weekly team practice in person, plus a short midweek Zoom check-in.
          </p>
          <ul className="mt-6 space-y-3 text-foreground">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 shrink-0 text-forest" size={20} />
              <span>
                Team practice · {PRACTICE_SUMMARY} · {PRACTICE_PLACE}
              </span>
            </li>
            <li className="flex gap-3">
              <Clock className="mt-0.5 shrink-0 text-forest" size={20} />
              <span>
                Zoom call · {ZOOM_SUMMARY} · {ZOOM_PLACE}
              </span>
            </li>
          </ul>
        </div>
      </section>
    </SiteLayout>
  );
}

function memberInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function TeamMemberCard({ member }: { member: TeamMember }) {
  const initials = memberInitials(member.name);
  const description = teamMemberDisplayBio(member.description, member.name);

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-border/50">
      <div className="relative aspect-[4/5] overflow-hidden bg-sand">
        {member.photoUrl ? (
          <img
            src={member.photoUrl}
            alt={member.name}
            className="h-full w-full object-cover object-top"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-forest/15 via-sand to-navy/10 px-4 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full border border-dashed border-forest/30 bg-white/70 text-forest">
              <span className="font-display text-2xl">{initials}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <UserRound size={14} /> Photo placeholder
            </div>
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-display text-xl leading-tight text-foreground">{member.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </article>
  );
}
