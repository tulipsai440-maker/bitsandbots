import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/site/Layout";
import { EditablePageHero } from "@/components/admin/inline-edit/EditablePageHero";
import {
  EditableSponsorCard,
  InlineAddButton,
  InlineAddSponsorDialog,
  useInlineEditRefresh,
} from "@/components/admin/inline-edit/EditablePersonCard";
import { deleteSponsor, fetchSponsors, saveSponsor, type Sponsor } from "@/lib/sponsors";
import { useSiteSettings } from "@/lib/site-settings-context";
import { parseAdminEditSearch } from "@/lib/admin-route-search";

export const Route = createFileRoute("/sponsors")({
  validateSearch: parseAdminEditSearch,
  loader: async () => ({
    sponsors: await fetchSponsors(),
  }),
  component: SponsorsPage,
});

function SponsorsPage() {
  const { sponsors } = Route.useLoaderData();
  const { siteName, sponsorsHeroDescription, sponsorsPageTitle } = useSiteSettings();
  const refresh = useInlineEditRefresh();
  const [showAdd, setShowAdd] = useState(false);

  async function handleSave(payload: {
    id?: string;
    name: string;
    description?: string | null;
    photoUrl?: string | null;
    sortOrder?: number;
  }) {
    await saveSponsor({
      id: payload.id,
      name: payload.name,
      description: payload.description,
      logoUrl: payload.photoUrl,
      sortOrder: payload.sortOrder,
    });
    await refresh();
  }

  async function handleDelete(id: string) {
    await deleteSponsor(id);
    await refresh();
  }

  return (
    <SiteLayout>
      <EditablePageHero
        title={sponsorsPageTitle}
        titleKey="sponsorsPageTitle"
        titleLabel="Sponsors page title"
        align="center"
        description={sponsorsHeroDescription}
        descriptionKey="sponsorsHeroDescription"
        descriptionLabel="Sponsors page intro"
      />

      <section className="py-14 md:py-16">
        <div className="container-page">
          <div className="mb-6">
            <InlineAddButton label="Add sponsor" onClick={() => setShowAdd(true)} />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sponsors.map((sponsor) => (
              <EditableSponsorCard
                key={sponsor.id}
                sponsor={toInlineSponsor(sponsor)}
                displayDescription={sponsorDescription(sponsor, siteName)}
                onSave={handleSave}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      </section>

      <InlineAddSponsorDialog open={showAdd} onOpenChange={setShowAdd} onSave={handleSave} />
    </SiteLayout>
  );
}

function sponsorDescription(sponsor: Sponsor, siteName: string) {
  return (
    sponsor.description?.trim() ||
    `Logo and description coming soon. This space is reserved for a ${siteName} sponsor.`
  );
}

function toInlineSponsor(sponsor: Sponsor) {
  return {
    id: sponsor.id,
    name: sponsor.name,
    description: sponsor.description,
    photoUrl: sponsor.logoUrl,
    sortOrder: sponsor.sortOrder,
  };
}
