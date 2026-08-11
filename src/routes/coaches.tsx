import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/site/Layout";
import { EditablePageHero } from "@/components/admin/inline-edit/EditablePageHero";
import {
  EditableCoachCard,
  InlineAddButton,
  InlineAddPersonDialog,
  useInlineEditRefresh,
} from "@/components/admin/inline-edit/EditablePersonCard";
import { deleteCoach, saveCoach } from "@/lib/coaches-admin";
import { coachDisplayBio, fetchCoaches, type Coach } from "@/lib/coaches";
import { useSiteSettings } from "@/lib/site-settings-context";
import { parseAdminEditSearch } from "@/lib/admin-route-search";

export const Route = createFileRoute("/coaches")({
  validateSearch: parseAdminEditSearch,
  loader: async () => ({
    coaches: await fetchCoaches(),
  }),
  component: CoachesPage,
});

function CoachesPage() {
  const { coaches } = Route.useLoaderData();
  const { coachesHeroDescription, coachesPageTitle, genericCoachBio } = useSiteSettings();
  const refresh = useInlineEditRefresh();
  const [showAdd, setShowAdd] = useState(false);

  async function handleSave(payload: {
    id?: string;
    name: string;
    description?: string | null;
    photoUrl?: string | null;
    sortOrder?: number;
  }) {
    await saveCoach(payload);
    await refresh();
  }

  async function handleDelete(id: string) {
    await deleteCoach(id);
    await refresh();
  }

  return (
    <SiteLayout>
      <EditablePageHero
        title={coachesPageTitle}
        titleKey="coachesPageTitle"
        titleLabel="Coaches page title"
        align="center"
        description={coachesHeroDescription}
        descriptionKey="coachesHeroDescription"
        descriptionLabel="Coaches page intro"
      />

      <section className="py-14 md:py-16">
        <div className="container-page">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <InlineAddButton label="Add coach" onClick={() => setShowAdd(true)} />
          </div>
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            {coaches.map((coach) => (
              <EditableCoachCard
                key={coach.id}
                coach={toInlinePerson(coach)}
                displayDescription={coachDisplayBio(coach.description, genericCoachBio)}
                onSave={handleSave}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      </section>

      <InlineAddPersonDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        title="Add coach"
        photoKind="coaches"
        onSave={handleSave}
      />
    </SiteLayout>
  );
}

function toInlinePerson(coach: Coach & { sortOrder?: number }) {
  return {
    id: coach.id,
    name: coach.name,
    description: coach.description,
    photoUrl: coach.photoUrl,
    sortOrder: coach.sortOrder,
  };
}
