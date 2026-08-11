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
  Link2,
} from "lucide-react";
import type { ComponentType } from "react";
import { brandingRouteLoader, routeTeamName } from "@/lib/team-branding";
import { useSiteSettings } from "@/lib/site-settings-context";
import type { QuickLinkCard } from "@/lib/site-settings";

export const Route = createFileRoute("/quick-links")({
  loader: brandingRouteLoader,
  head: ({ loaderData }) => {
    const name = routeTeamName(loaderData);
    return {
      meta: [
        { title: `Quick Links — ${name}` },
        {
          name: "description",
          content: `Helpful FIRST LEGO League links and resources for ${name} families.`,
        },
        { property: "og:title", content: `${name} Quick Links` },
        { property: "og:description", content: `Essential FLL resources for ${name} families.` },
      ],
    };
  },
  component: QuickLinksPage,
});

type LinkItem = QuickLinkCard & { icon: ComponentType<{ size?: number }> };

function iconForLink(link: QuickLinkCard): ComponentType<{ size?: number }> {
  if (link.href.includes("youtube") || link.href === "/videos") return Play;
  if (link.href.includes("lego.com") || link.href.includes("education")) return BookOpen;
  if (link.href.endsWith(".pdf") || link.label.toLowerCase().includes("notebook") || link.label.toLowerCase().includes("rulebook")) {
    return FileText;
  }
  if (link.href.includes("firstlegoleague")) return Trophy;
  if (link.href.includes("firstinspires.org/robotics/fll/core-values")) return BookOpen;
  if (link.href.includes("firstinspires.org/robotics/fll")) return Lightbulb;
  if (link.href.includes("resource-library")) return ClipboardList;
  if (link.href === "/calendar") return Newspaper;
  if (link.href === "/gallery") return Images;
  if (link.href.includes("firstinspires.org")) return Globe;
  return Link2;
}

function QuickLinkCardView({ item }: { item: LinkItem }) {
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
    <Link to={item.href as "/"} className={className}>
      {inner}
    </Link>
  );
}

function QuickLinksPage() {
  const { quickLinks, quickLinksHeroTitle, quickLinksHeroDescription } = useSiteSettings();
  const links: LinkItem[] = quickLinks.map((link) => ({ ...link, icon: iconForLink(link) }));

  return (
    <SiteLayout>
      <PageHero title={quickLinksHeroTitle} align="center" description={quickLinksHeroDescription} />
      <section className="py-16">
        <div className="container-page grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((item) => (
            <QuickLinkCardView key={item.id} item={item} />
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
