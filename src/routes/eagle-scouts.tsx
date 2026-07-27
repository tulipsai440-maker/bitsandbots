import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { ContentSuggestionForm } from "@/components/site/ContentSuggestionForm";
import {
  fetchApprovedEagleScouts,
  rankEagleScouts,
  submitEagleScoutSuggestion,
  type EagleScoutRow,
} from "@/lib/content";
import { Award } from "lucide-react";

export const Route = createFileRoute("/eagle-scouts")({
  head: () => ({
    meta: [
      { title: "Eagle Scouts — Troop 2001 Naples" },
      { name: "description", content: "Meet the Eagle Scouts of Troop 2001 Naples and their service projects." },
      { property: "og:title", content: "Eagle Scouts — Troop 2001 Naples" },
      { property: "og:description", content: "Our Eagle Scout roll of honor." },
    ],
  }),
  loader: async () => {
    try {
      const eagles = await fetchApprovedEagleScouts();
      return { eagles, error: null as string | null };
    } catch (e) {
      return {
        eagles: [] as EagleScoutRow[],
        error: e instanceof Error ? e.message : "Failed to load Eagle Scouts",
      };
    }
  },
  component: EagleScoutsPage,
});

function EagleScoutsPage() {
  const { eagles, error } = Route.useLoaderData();
  const rankedEagles = rankEagleScouts(eagles);
  const eagleCount = rankedEagles.length;

  return (
    <SiteLayout>
      <PageHero
        title="Our Eagle Scouts"
        align="center"
        description={
          eagleCount > 0
            ? `${eagleCount} Eagle Scout${eagleCount === 1 ? "" : "s"} on our roll of honor.`
            : "The troop's Eagle Scout roll of honor."
        }
      />

      <section className="py-16">
        <div className="container-page">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="hidden grid-cols-[72px_100px_1fr_2fr] border-b border-border bg-forest text-cream md:grid">
              <div className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em]">#</div>
              <div className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em]">Year</div>
              <div className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em]">Name</div>
              <div className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em]">Eagle Project</div>
            </div>
            <ul className="divide-y divide-border">
              {rankedEagles.map((e) => (
                <li
                  key={e.id}
                  className="grid gap-2 px-6 py-5 md:grid-cols-[72px_100px_1fr_2fr] md:items-center md:gap-0 md:px-0"
                >
                  <div className="flex items-center gap-3 md:px-6">
                    <span className="font-display text-lg tabular-nums text-gold">#{e.rank}</span>
                  </div>
                  <div className="flex items-center gap-3 md:px-6">
                    <Award size={18} className="text-gold md:hidden" />
                    <span className="font-display text-lg text-forest">{e.year}</span>
                  </div>
                  <div className="font-medium md:px-6">{e.name}</div>
                  <div className="text-sm text-muted-foreground md:px-6">{e.project}</div>
                </li>
              ))}
              {error && <li className="p-6 text-sm text-destructive">{error}</li>}
              {!error && eagles.length === 0 && (
                <li className="p-6 text-sm text-muted-foreground">No Eagle Scouts listed yet.</li>
              )}
            </ul>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New Eagle Scouts are added after their board of review. Submit details below for admin review.
          </p>
        </div>
      </section>

      <section className="border-t border-border/60 bg-sand py-16">
        <div className="container-page max-w-2xl">
          <ContentSuggestionForm
            kind="eagle"
            title="Suggest an Eagle Scout entry"
            description="Alumni and troop leaders can submit Eagle Scout details here. Entries are reviewed before appearing on this page."
            onSubmit={submitEagleScoutSuggestion}
          />
        </div>
      </section>
    </SiteLayout>
  );
}
