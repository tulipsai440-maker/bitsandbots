import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { fetchApprovedScoutmasters, type ScoutmasterRow } from "@/lib/content";
import { photos } from "@/lib/photos";
import { TroopPhoto } from "@/components/site/TroopPhoto";
import { MapPin, Clock, ScrollText, Flag, TreePine } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Troop 2001 — Scouts BSA in Naples, Florida" },
      { name: "description", content: "Troop 2001 was chartered in Naples in 2000. Meet our scoutmasters, find meeting times, and read the Scout Oath and Law." },
      { property: "og:title", content: "About Troop 2001 Naples" },
      { property: "og:description", content: "Our history, mission, values, and leadership team." },
    ],
  }),
  component: AboutPage,
});

const scoutLaw =
  "A Scout is Trustworthy, Loyal, Helpful, Friendly, Courteous, Kind, Obedient, Cheerful, Thrifty, Brave, Clean, and Reverent.";

function AboutPage() {
  const [scoutmasters, setScoutmasters] = useState<ScoutmasterRow[]>([]);
  const [loadingScouts, setLoadingScouts] = useState(true);

  useEffect(() => {
    fetchApprovedScoutmasters()
      .then(setScoutmasters)
      .finally(() => setLoadingScouts(false));
  }, []);

  return (
    <SiteLayout>
      <PageHero
        title="About Troop 2001"
        align="center"
        description="Chartered in Naples in 2000. We meet Wednesdays at North Collier Fire Station #45."
      />

      <section className="pt-14">
        <div className="container-page">
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
            <h2 className="font-display text-2xl text-foreground">Why &ldquo;Troop 2001&rdquo;?</h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              The troop was founded in the year 2000. The scoutmasters thought
              &ldquo;Troop 2001&rdquo; sounded more memorable than &ldquo;Troop 2000,&rdquo;
              so that is the number we kept.
            </p>
          </div>
        </div>
      </section>

      {/* Scout Oath / Law / Outdoor Code */}
      <section className="py-16">
        <div className="container-page grid gap-6 md:grid-cols-3">
          <PillarCard
            icon={<ScrollText />}
            title="Scout Oath"
            image={photos.values.oath}
            imageAlt="Scouts saluting at a flag ceremony"
          >
            <p className="text-sm leading-relaxed text-muted-foreground">
              On my honor I will do my best to do my duty to God and my country and to obey the Scout
              Law; to help other people at all times; to keep myself physically strong, mentally
              awake, and morally straight.
            </p>
          </PillarCard>

          <PillarCard
            icon={<Flag />}
            title="Scout Law"
            image={photos.values.law}
            imageAlt="Scouts standing together at camp"
          >
            <p className="text-sm leading-relaxed text-foreground">{scoutLaw}</p>
          </PillarCard>

          <PillarCard
            icon={<TreePine />}
            title="Outdoor Code"
            image={photos.values.outdoorCode}
            imageAlt="Troop 2001 scouts outdoors"
          >
            <p className="text-sm leading-relaxed text-muted-foreground">
              As an American, I will do my best to be clean in my outdoor manners, be careful with
              fire, be considerate in the outdoors, and be conservation-minded.
            </p>
          </PillarCard>
        </div>
      </section>

      {/* Scoutmasters */}
      <section className="py-20">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h2 className="font-display text-4xl md:text-5xl">Scoutmasters</h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Volunteer leaders who have run meetings, campouts, and Eagle boards over the years.
              </p>
            </div>
          </div>

          {loadingScouts && <p className="mt-8 text-sm text-muted-foreground">Loading scoutmasters…</p>}
          {!loadingScouts && scoutmasters.length === 0 && (
            <p className="mt-8 text-sm text-muted-foreground">Scoutmaster profiles will appear here once approved.</p>
          )}
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {scoutmasters.map((s) => (
              <ScoutmasterCard key={s.id} scoutmaster={s} />
            ))}
          </div>
        </div>
      </section>

      {/* Meeting location */}
      <section className="border-t border-border/60 bg-sand py-20 pb-24">
        <div className="container-page grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="font-display text-4xl md:text-5xl">Meeting location</h2>
            <p className="mt-4 text-muted-foreground">
              Wednesday meetings are open to scouts, parents, and visitors.
            </p>
            <ul className="mt-6 space-y-3 text-foreground">
              <li className="flex gap-3"><MapPin className="mt-0.5 shrink-0 text-forest" size={20} /><span>North Collier Fire Station #45<br/>1885 Veterans Park Dr, Naples, FL 34109</span></li>
              <li className="flex gap-3"><Clock className="mt-0.5 shrink-0 text-forest" size={20} /><span>Every Wednesday at 7:00 PM</span></li>
            </ul>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
            <iframe
              title="Meeting location map"
              className="h-[380px] w-full"
              loading="lazy"
              src="https://www.google.com/maps?q=1885+Veterans+Park+Dr,+Naples,+FL+34109&output=embed"
            />
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function ScoutmasterCard({ scoutmaster: s }: { scoutmaster: ScoutmasterRow }) {
  const initials = s.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <article className="group mx-auto w-full max-w-[168px] overflow-hidden rounded-xl border border-border bg-card shadow-sm ring-1 ring-border/50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[3/4] max-h-36 overflow-hidden bg-sand">
        {s.photo_url ? (
          <TroopPhoto
            src={s.photo_url}
            alt={`${s.name}, Scoutmaster in Class A uniform`}
            width={300}
            height={400}
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
            label={s.name}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-forest via-forest-deep to-navy">
            <span className="font-display text-3xl text-cream/80">{initials}</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-forest-deep/40 to-transparent" />
      </div>
      <div className="p-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-forest">{s.years}</div>
        <h3 className="mt-0.5 font-display text-base leading-tight text-foreground">{s.name}</h3>
        {s.bio && (
          <p className="mt-1.5 line-clamp-3 text-[11px] leading-relaxed text-muted-foreground">{s.bio}</p>
        )}
      </div>
    </article>
  );
}

function PillarCard({
  icon,
  title,
  image,
  imageAlt,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  image?: string;
  imageAlt?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {image && (
        <div className="relative h-20 overflow-hidden bg-sand sm:h-24">
          <TroopPhoto
            src={image}
            alt={imageAlt ?? title}
            width={640}
            height={240}
            className="h-full w-full object-cover object-center"
            label={title}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
        </div>
      )}
      <div className="p-6">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-forest/10 text-forest">{icon}</div>
        <h3 className="mt-4 font-display text-2xl">{title}</h3>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}
