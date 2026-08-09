import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { SITE_NAME } from "@/lib/photos";
import { fetchOutreachItems, OUTREACH_ITEMS, type OutreachItem } from "@/lib/outreach";

export const Route = createFileRoute("/outreach")({
  head: () => ({
    meta: [
      { title: `Outreach — ${SITE_NAME}` },
      {
        name: "description",
        content: `How ${SITE_NAME} mentors new FLL teams and brings robotics workshops to community events.`,
      },
      { property: "og:title", content: `Outreach — ${SITE_NAME}` },
      {
        property: "og:description",
        content: "Mentoring new teams and hosting workshops at community STEM events.",
      },
    ],
  }),
  component: OutreachPage,
});

function OutreachPage() {
  const [items, setItems] = useState<OutreachItem[]>(OUTREACH_ITEMS);

  useEffect(() => {
    fetchOutreachItems().then(setItems).catch(() => setItems(OUTREACH_ITEMS));
  }, []);

  return (
    <SiteLayout>
      <PageHero
        title="Outreach"
        align="center"
        description={`${SITE_NAME} shares FIRST LEGO League beyond our own meetings—mentoring new teams and hosting workshops at community events.`}
      />

      <section className="py-14 md:py-16">
        <div className="container-page">
          <div className="mx-auto flex max-w-4xl flex-col gap-12">
            {items.map((item, index) => (
              <OutreachStory key={item.id} item={item} reverse={index % 2 === 1} />
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function OutreachStory({ item, reverse }: { item: OutreachItem; reverse: boolean }) {
  return (
    <article className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
      <div className={`overflow-hidden rounded-[1.5rem] ${reverse ? "md:order-2" : ""}`}>
        <img
          src={item.imageUrl}
          alt={item.imageAlt}
          className="aspect-[16/10] w-full object-cover md:aspect-[4/3]"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className={reverse ? "md:order-1" : ""}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest">Outreach</p>
        <h2 className="mt-2 font-display text-3xl leading-tight text-foreground md:text-4xl">
          {item.title}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">{item.description}</p>
      </div>
    </article>
  );
}
