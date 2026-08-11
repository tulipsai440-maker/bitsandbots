import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteLayout } from "@/components/site/Layout";
import { EditablePageHero } from "@/components/admin/inline-edit/EditablePageHero";
import { EditableOutreachStory } from "@/components/admin/inline-edit/EditableOutreachStory";
import {
  buildDefaultSiteImageOverrides,
  fetchSiteImageOverrides,
  resolveSiteImage,
  type SiteImageKey,
} from "@/lib/site-images";
import { outreachItemsFromDefaults } from "@/lib/outreach";
import { useSiteContent, useSiteSettings } from "@/lib/site-settings-context";

export const Route = createFileRoute("/outreach")({
  component: OutreachPage,
});

function OutreachPage() {
  const { outreachHeroDescription, outreachPageTitle } = useSiteSettings();
  const { outreachStories } = useSiteContent();
  const [imageOverrides, setImageOverrides] = useState(buildDefaultSiteImageOverrides());

  useEffect(() => {
    fetchSiteImageOverrides().then(setImageOverrides).catch(() => setImageOverrides(buildDefaultSiteImageOverrides()));
  }, []);

  const items = useMemo(() => {
    const defaults = outreachItemsFromDefaults();
    return outreachStories.map((story) => {
      const imageKey = story.imageKey as SiteImageKey;
      const image = resolveSiteImage(imageKey, imageOverrides);
      const fallback = defaults.find((item) => item.id === story.id);
      return {
        story,
        imageUrl: image.isOverride ? image.url : story.defaultImageUrl || fallback?.imageUrl || image.url,
        imageAlt: image.alt || story.defaultImageAlt,
      };
    });
  }, [outreachStories, imageOverrides]);

  return (
    <SiteLayout>
      <EditablePageHero
        title={outreachPageTitle}
        titleKey="outreachPageTitle"
        titleLabel="Outreach page title"
        align="center"
        description={outreachHeroDescription}
        descriptionKey="outreachHeroDescription"
        descriptionLabel="Outreach page intro"
      />

      <section className="py-14 md:py-16">
        <div className="container-page">
          <div className="mx-auto flex max-w-4xl flex-col gap-12">
            {items.map(({ story, imageUrl, imageAlt }, index) => (
              <EditableOutreachStory
                key={story.id}
                story={story}
                reverse={index % 2 === 1}
                imageUrl={imageUrl}
                imageAlt={imageAlt}
              />
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
