import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteLayout } from "@/components/site/Layout";
import { EditablePageHero } from "@/components/admin/inline-edit/EditablePageHero";
import { EditableOutreachStory } from "@/components/admin/inline-edit/EditableOutreachStory";
import { shouldUseDemoAssets } from "@/lib/demo/demo-tenant";
import { DEMO_OUTREACH_STORIES } from "@/lib/demo/demo-defaults";
import {
  buildDefaultSiteImageOverrides,
  fetchSiteImageOverrides,
  resolveSiteImage,
  type SiteImageKey,
} from "@/lib/site-images";
import { outreachItemsFromDefaults } from "@/lib/outreach";
import { useSiteContent, useSiteSettings } from "@/lib/site-settings-context";

export const Route = createFileRoute("/outreach")({
  loader: async () => ({ isDemo: await shouldUseDemoAssets() }),
  component: OutreachPage,
});

function OutreachPage() {
  const { isDemo } = Route.useLoaderData();
  const { outreachHeroDescription, outreachPageTitle } = useSiteSettings();
  const { outreachStories } = useSiteContent();
  const [imageOverrides, setImageOverrides] = useState(buildDefaultSiteImageOverrides());

  useEffect(() => {
    fetchSiteImageOverrides().then(setImageOverrides).catch(() => setImageOverrides(buildDefaultSiteImageOverrides()));
  }, []);

  const items = useMemo(() => {
    const stories = isDemo ? DEMO_OUTREACH_STORIES : outreachStories;
    const defaults = outreachItemsFromDefaults();
    return stories.map((story) => {
      const imageKey = story.imageKey as SiteImageKey;
      const image = resolveSiteImage(imageKey, imageOverrides);
      const demoStory = DEMO_OUTREACH_STORIES.find((s) => s.id === story.id);
      const fallback = defaults.find((item) => item.id === story.id);
      const demoUrl = demoStory?.defaultImageUrl;
      return {
        story,
        imageUrl: isDemo
          ? demoUrl || image.url
          : image.isOverride
            ? image.url
            : story.defaultImageUrl || fallback?.imageUrl || image.url,
        imageAlt: image.alt || story.defaultImageAlt,
      };
    });
  }, [outreachStories, imageOverrides, isDemo]);

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
