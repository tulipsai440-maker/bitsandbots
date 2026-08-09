import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { SITE_NAME } from "@/lib/photos";
import { fetchSponsors, type Sponsor } from "@/lib/sponsors";
import { Building2 } from "lucide-react";

export const Route = createFileRoute("/sponsors")({
  head: () => ({
    meta: [
      { title: `Sponsors — ${SITE_NAME}` },
      {
        name: "description",
        content: `Partners and sponsors who support ${SITE_NAME} in FIRST LEGO League.`,
      },
      { property: "og:title", content: `Sponsors — ${SITE_NAME}` },
      { property: "og:description", content: `Thank you to the sponsors supporting ${SITE_NAME}.` },
    ],
  }),
  loader: async () => ({
    sponsors: await fetchSponsors(),
  }),
  component: SponsorsPage,
});

function SponsorsPage() {
  const { sponsors } = Route.useLoaderData();

  return (
    <SiteLayout>
      <PageHero
        title="Sponsors"
        align="center"
        description={`Community partners help ${SITE_NAME} build, compete, and share FIRST LEGO League with others.`}
      />

      <section className="py-14 md:py-16">
        <div className="container-page">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sponsors.map((sponsor) => (
              <SponsorCard key={sponsor.id} sponsor={sponsor} />
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function SponsorCard({ sponsor }: { sponsor: Sponsor }) {
  const description =
    sponsor.description?.trim() ||
    "Logo and description coming soon. This space is reserved for a Bits & Bots sponsor.";

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-border/50">
      <div className="relative aspect-[4/3] overflow-hidden bg-sand">
        {sponsor.logoUrl ? (
          <img
            src={sponsor.logoUrl}
            alt={sponsor.name}
            className="h-full w-full object-contain p-6"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-forest/15 via-sand to-navy/10 px-4 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full border border-dashed border-forest/30 bg-white/70 text-forest">
              <Building2 size={28} />
            </div>
            <div className="text-xs text-muted-foreground">Logo placeholder</div>
          </div>
        )}
      </div>
      <div className="p-5">
        <h2 className="font-display text-xl leading-tight text-foreground">{sponsor.name}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </article>
  );
}
