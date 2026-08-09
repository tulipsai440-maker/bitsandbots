import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { SITE_NAME } from "@/lib/photos";
import { CORE_VALUES, type CoreValue } from "@/lib/core-values";

export const Route = createFileRoute("/core-values")({
  head: () => ({
    meta: [
      { title: `Core Values — ${SITE_NAME}` },
      {
        name: "description",
        content: `How ${SITE_NAME} lives the FIRST LEGO League Core Values in meetings and competitions.`,
      },
      { property: "og:title", content: `Core Values — ${SITE_NAME}` },
      {
        property: "og:description",
        content: "Discovery, Innovation, Impact, Inclusion, Teamwork, and Fun.",
      },
    ],
  }),
  component: CoreValuesPage,
});

function CoreValuesPage() {
  return (
    <SiteLayout>
      <PageHero
        title="Core Values"
        align="center"
        description={`The FIRST Core Values guide how ${SITE_NAME} learns, competes, and works with others. Official definitions below are from FIRST / FIRST LEGO League.`}
      />

      <section className="py-14 md:py-16">
        <div className="container-page">
          <p className="mx-auto max-w-3xl text-center text-sm leading-relaxed text-muted-foreground">
            Our community expresses the FIRST philosophies of Gracious Professionalism® and
            Coopertition® through the FIRST Core Values.{" "}
            <a
              href="https://www.firstlegoleague.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-forest underline-offset-4 hover:underline"
            >
              Learn more at FIRST LEGO League
            </a>
            .
          </p>

          <div className="mx-auto mt-12 flex max-w-3xl flex-col gap-6">
            {CORE_VALUES.map((value) => (
              <CoreValueCard key={value.id} value={value} />
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function CoreValueCard({ value }: { value: CoreValue }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-6 shadow-sm ring-1 ring-border/50 sm:p-8">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-forest">Core Value</p>
      <h2 className="mt-2 font-display text-2xl leading-tight text-foreground sm:text-3xl">
        {value.name}
      </h2>
      <p className="mt-3 text-base font-medium leading-relaxed text-foreground sm:text-lg">
        {value.definition}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
        <span className="font-medium text-foreground">At {SITE_NAME}: </span>
        {value.howWeLiveIt}
      </p>
    </article>
  );
}
