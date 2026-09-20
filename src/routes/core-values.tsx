import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteLayout } from "@/components/site/Layout";

import { EditablePageHero } from "@/components/admin/inline-edit/EditablePageHero";

import { EditableCoreValueCard } from "@/components/admin/inline-edit/EditableCoreValueCard";
import { EditableText } from "@/components/admin/inline-edit/EditableText";

import { useSiteSettings } from "@/lib/site-settings-context";
import { displayTeamNameText } from "@/lib/site-settings";



export const Route = createFileRoute("/core-values")({

  component: CoreValuesPage,

});

function CoreValuesNotFound() {
  return (
    <SiteLayout>
      <div className="flex flex-1 items-center justify-center px-4 py-24">
        <div className="max-w-md text-center">
          <p className="mb-3 text-sm text-muted-foreground">404</p>
          <h1 className="font-display text-5xl text-foreground">Page not found</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            That address is not on this site. Use the menu or return to the homepage.
          </p>
          <div className="mt-6">
            <Link to="/" className="btn-primary">
              Return home
            </Link>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}



function CoreValuesPage() {

  const { siteName, coreValuesIntro, coreValues, coreValuesPageTitle, coreValuesOfficialBlurb, showCoreValuesNav } = useSiteSettings();

  /** Tenants with Core Values turned off get a not-found page instead of the content. */
  if (!showCoreValuesNav) return <CoreValuesNotFound />;

  return (

    <SiteLayout>

      <EditablePageHero

        title={coreValuesPageTitle}
        titleKey="coreValuesPageTitle"
        titleLabel="Core Values page title"

        align="center"

        description={displayTeamNameText(coreValuesIntro, siteName)}

        descriptionKey="coreValuesIntro"

        descriptionLabel="Core values intro"

      />



      <section className="py-14 md:py-16">

        <div className="container-page">

          <p className="mx-auto max-w-3xl text-center text-sm leading-relaxed text-muted-foreground">

            <EditableText settingKey="coreValuesOfficialBlurb" label="Official Core Values blurb" multiline>
              {coreValuesOfficialBlurb}
            </EditableText>{" "}

            <a

              href="https://www.firstinspires.org/"

              target="_blank"

              rel="noopener noreferrer"

              className="font-medium text-forest underline-offset-2 hover:underline"

            >

              Learn more at FIRST

            </a>

            .

          </p>



          <div className="mx-auto mt-12 grid max-w-4xl gap-8">

            {coreValues.map((value) => (

              <EditableCoreValueCard

                key={value.id}

                value={value}

                displayHowWeLiveIt={displayTeamNameText(value.howWeLiveIt, siteName)}

              />

            ))}

          </div>

        </div>

      </section>

    </SiteLayout>

  );

}

