import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import {
  ExternalLink,
  Globe,
  BookOpen,
  ClipboardList,
  Newspaper,
  Images,
  Trophy,
  Lightbulb,
  Play,
  FileText,
} from "lucide-react";
import type { ComponentType } from "react";
import { SITE_NAME } from "@/lib/photos";
import { BIOGLOW_DOCUMENTS, BIOGLOW_PLAYLIST_URL, BIOGLOW_RESOURCES_URL } from "@/lib/season-videos";

export const Route = createFileRoute("/quick-links")({
  head: () => ({
    meta: [
      { title: `Quick Links — ${SITE_NAME}` },
      {
        name: "description",
        content: `Helpful FIRST LEGO League links and resources for ${SITE_NAME} families.`,
      },
      { property: "og:title", content: `${SITE_NAME} Quick Links` },
      { property: "og:description", content: `Essential FLL resources for ${SITE_NAME} families.` },
    ],
  }),
  component: QuickLinksPage,
});

type LinkItem = {
  label: string;
  href: string;
  icon: ComponentType<{ size?: number }>;
  desc: string;
};

const links: LinkItem[] = [
  {
    label: "BIOGLOW videos",
    href: "/videos",
    icon: Play,
    desc: "Season intro, missions, field setup, role videos, and official PDFs.",
  },
  {
    label: "Season resources",
    href: BIOGLOW_RESOURCES_URL,
    icon: BookOpen,
    desc: "Official LEGO Education materials for Future Edition (grades 3–8).",
  },
  ...BIOGLOW_DOCUMENTS.map((doc) => ({
    label: doc.title,
    href: doc.href,
    icon: FileText,
    desc: doc.blurb,
  })),
  {
    label: "Full BIOGLOW playlist",
    href: BIOGLOW_PLAYLIST_URL,
    icon: Play,
    desc: "Official FIRST LEGO League YouTube playlist for Future Edition.",
  },
  {
    label: "FIRST LEGO League",
    href: "https://www.firstlegoleague.org/",
    icon: Trophy,
    desc: "Official FLL program site — seasons, challenges, and team resources.",
  },
  {
    label: "FIRST Inspires",
    href: "https://www.firstinspires.org/",
    icon: Globe,
    desc: "Home of FIRST robotics programs for youth of all ages.",
  },
  {
    label: "Season Challenge",
    href: "https://www.firstinspires.org/robotics/fll",
    icon: Lightbulb,
    desc: "Learn about the current FIRST LEGO League challenge theme.",
  },
  {
    label: "Core Values",
    href: "https://www.firstinspires.org/robotics/fll/core-values",
    icon: BookOpen,
    desc: "Discovery, Innovation, Impact, Inclusion, Teamwork, and Fun.",
  },
  {
    label: "Team Resources",
    href: "https://www.firstinspires.org/resource-library",
    icon: ClipboardList,
    desc: "Guides, updates, and materials for FLL teams and coaches.",
  },
  {
    label: "Team calendar",
    href: "/calendar",
    icon: Newspaper,
    desc: "Upcoming practices, Zoom calls, and team events.",
  },
  {
    label: "Photo Gallery",
    href: "/gallery",
    icon: Images,
    desc: "Photos from practices, builds, and events.",
  },
];

function QuickLinkCard({ item }: { item: LinkItem }) {
  const Icon = item.icon;
  const external = item.href.startsWith("http");
  const inner = (
    <>
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-forest/10 text-forest">
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="font-display text-lg">{item.label}</div>
          {external && <ExternalLink size={13} className="text-muted-foreground" />}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
      </div>
    </>
  );
  const className =
    "group flex gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-forest";

  if (external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }

  if (item.href.startsWith("/#")) {
    return (
      <a href={item.href} className={className}>
        {inner}
      </a>
    );
  }

  return (
    <Link to={item.href} className={className}>
      {inner}
    </Link>
  );
}

function QuickLinksPage() {
  return (
    <SiteLayout>
      <PageHero
        title="Quick links"
        align="center"
        description={`FIRST LEGO League resources and helpful links for ${SITE_NAME} families.`}
      />
      <section className="py-16">
        <div className="container-page grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((item) => (
            <QuickLinkCard key={item.label} item={item} />
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
