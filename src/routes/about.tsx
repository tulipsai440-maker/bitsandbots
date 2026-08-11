import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/site/Layout";
import { EditablePageHero } from "@/components/admin/inline-edit/EditablePageHero";
import { EditableBlock, EditableText } from "@/components/admin/inline-edit/EditableText";
import {
  EditableTeamMemberCard,
  InlineAddButton,
  InlineAddPersonDialog,
  useInlineEditRefresh,
} from "@/components/admin/inline-edit/EditablePersonCard";
import { deleteTeamMember, saveTeamMember } from "@/lib/team-members-admin";
import { fetchTeamMembers, teamMemberDisplayBio, type TeamMember } from "@/lib/team-members";
import { useSiteSettings } from "@/lib/site-settings-context";
import { MapPin, Clock } from "lucide-react";
import { parseAdminEditSearch } from "@/lib/admin-route-search";

export const Route = createFileRoute("/about")({
  validateSearch: parseAdminEditSearch,
  component: AboutPage,
  loader: async () => ({
    members: await fetchTeamMembers(),
  }),
});

function AboutPage() {
  const { members } = Route.useLoaderData();
  const refresh = useInlineEditRefresh();
  const [showAdd, setShowAdd] = useState(false);
  const {
    siteName,
    aboutHeroDescription,
    aboutBlurb,
    aboutPageTitle,
    aboutTeamSectionTitle,
    aboutMeetingsSectionTitle,
    practiceSummary,
    practicePlace,
    zoomSummary,
    zoomPlace,
    genericMemberBio,
  } = useSiteSettings();

  async function handleSave(payload: {
    id?: string;
    name: string;
    description?: string | null;
    photoUrl?: string | null;
    sortOrder?: number;
  }) {
    await saveTeamMember(payload);
    await refresh();
  }

  async function handleDelete(id: string) {
    await deleteTeamMember(id);
    await refresh();
  }

  return (
    <SiteLayout>
      <EditablePageHero
        title={aboutPageTitle}
        titleKey="aboutPageTitle"
        titleLabel="About page title"
        align="center"
        description={aboutHeroDescription}
        descriptionKey="aboutHeroDescription"
        descriptionLabel="About page intro"
      />

      <section className="pt-10">
        <div className="container-page">
          <EditableBlock settingKey="aboutBlurb" label="About blurb" className="rounded-2xl border border-border bg-card p-6 md:p-8">
            <h2 className="font-display text-2xl text-foreground">About {siteName}</h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{aboutBlurb}</p>
          </EditableBlock>
        </div>
      </section>

      <section className="py-14 md:py-16">
        <div className="container-page">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-4xl md:text-5xl">
                <EditableText settingKey="aboutTeamSectionTitle" label="Team section title">
                  {aboutTeamSectionTitle}
                </EditableText>
              </h2>
              <InlineAddButton label="Add teammate" onClick={() => setShowAdd(true)} />
            </div>
            <p className="mt-3 text-muted-foreground">
              Click the pencil on any card to edit name, photo, or bio right here.
            </p>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {members.map((member) => (
              <EditableTeamMemberCard
                key={member.id}
                member={member}
                displayDescription={teamMemberDisplayBio(member.description, member.name, genericMemberBio)}
                onSave={handleSave}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-sand py-14 md:py-16">
        <div className="container-page">
          <h2 className="font-display text-4xl md:text-5xl">
            <EditableText settingKey="aboutMeetingsSectionTitle" label="Meetings section title">
              {aboutMeetingsSectionTitle}
            </EditableText>
          </h2>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Weekly team practice in person, plus a short midweek Zoom check-in.
          </p>
          <ul className="mt-6 space-y-3 text-foreground">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 shrink-0 text-forest" size={20} />
              <span>
                Team practice ·{" "}
                <EditableText settingKey="practiceSummary" label="Practice schedule">
                  {practiceSummary}
                </EditableText>{" "}
                ·{" "}
                <EditableText settingKey="practicePlace" label="Practice location">
                  {practicePlace}
                </EditableText>
              </span>
            </li>
            <li className="flex gap-3">
              <Clock className="mt-0.5 shrink-0 text-forest" size={20} />
              <span>
                Zoom call ·{" "}
                <EditableText settingKey="zoomSummary" label="Zoom schedule">
                  {zoomSummary}
                </EditableText>{" "}
                ·{" "}
                <EditableText settingKey="zoomPlace" label="Zoom location">
                  {zoomPlace}
                </EditableText>
              </span>
            </li>
          </ul>
        </div>
      </section>

      <InlineAddPersonDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        title="Add teammate"
        photoKind="team"
        onSave={handleSave}
      />
    </SiteLayout>
  );
}
