import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import {
  ExternalLink,
  FileText,
  CreditCard,
  Globe,
  Shield,
  Award,
  BookOpen,
  MapPin,
  ClipboardList,
  Newspaper,
  Images,
} from "lucide-react";
import type { ComponentType } from "react";

export const Route = createFileRoute("/quick-links")({
  head: () => ({
    meta: [
      { title: "Quick Links — Troop 2001 Naples" },
      {
        name: "description",
        content: "Essential scouting resources: health forms, payments, Scoutbook, TroopTrack, and more.",
      },
      { property: "og:title", content: "Troop 2001 Quick Links" },
      { property: "og:description", content: "Essential scouting resources for Troop 2001 families." },
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
    label: "Health Forms",
    href: "https://filestore.scouting.org/filestore/healthsafety/pdf/680-001_ab.pdf",
    icon: FileText,
    desc: "Annual Health & Medical Record — Parts A & B (PDF from Scouting America).",
  },
  {
    label: "Scouting America",
    href: "https://www.scouting.org/",
    icon: Globe,
    desc: "National Scouting America website.",
  },
  {
    label: "Gulf Coast Council",
    href: "https://www.gulfcoastcouncil.org/",
    icon: MapPin,
    desc: "Our local Scouts BSA council.",
  },
  {
    label: "Scoutbook",
    href: "https://scoutbook.scouting.org/",
    icon: BookOpen,
    desc: "Advancement tracking and unit management.",
  },
  {
    label: "TroopTrack",
    href: "https://www.trooptrack.com/",
    icon: ClipboardList,
    desc: "Attendance, calendar, and communications.",
  },
  {
    label: "Youth Protection Training",
    href: "https://www.scouting.org/training/youth-protection/",
    icon: Shield,
    desc: "Required training for adult leaders.",
  },
  {
    label: "Merit Badge Resources",
    href: "https://www.scouting.org/skills/merit-badges/",
    icon: Award,
    desc: "Merit badge worksheets, pamphlets, and counselors.",
  },
  {
    label: "Guide to Safe Scouting",
    href: "https://www.scouting.org/health-and-safety/gss/",
    icon: Shield,
    desc: "Health and safety guidelines for all activities.",
  },
  {
    label: "Online Payments",
    href: "/payments",
    icon: CreditCard,
    desc: "Pay dues and camp fees with Zelle or Venmo.",
  },
  {
    label: "Camping Checklist",
    href: "https://www.scouting.org/outdoor-programs/camping/",
    icon: ClipboardList,
    desc: "Official camping resources and packing guidance from Scouting America.",
  },
  {
    label: "Forms",
    href: "https://www.scouting.org/resources/forms/",
    icon: FileText,
    desc: "National BSA forms library — applications, permits, and more.",
  },
  {
    label: "Newsletter",
    href: "/#announcements",
    icon: Newspaper,
    desc: "Troop updates on the home page announcements sidebar.",
  },
  {
    label: "Photo Gallery",
    href: "/gallery",
    icon: Images,
    desc: "Photos from campouts, ceremonies, and service projects.",
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
        description="Forms, payments, Scoutbook, and other resources for Troop 2001 families."
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
