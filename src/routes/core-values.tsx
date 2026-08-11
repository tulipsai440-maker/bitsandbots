import { createFileRoute } from "@tanstack/react-router";

import { SiteLayout } from "@/components/site/Layout";

import { EditablePageHero } from "@/components/admin/inline-edit/EditablePageHero";

import { EditableCoreValueCard } from "@/components/admin/inline-edit/EditableCoreValueCard";
import { EditableText } from "@/components/admin/inline-edit/EditableText";

import { useSiteSettings } from "@/lib/site-settings-context";
import { displayTeamNameText } from "@/lib/site-settings";



export const Route = createFileRoute("/core-values")({

  component: CoreValuesPage,

});



function CoreValuesPage() {

  const { siteName, coreValuesIntro, coreValues, coreValuesPageTitle, coreValuesOfficialBlurb } = useSiteSettings();



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

              href="https://www.firstlegoleague.org/"

              target="_blank"

              rel="noopener noreferrer"

              className="font-medium text-forest underline-offset-2 hover:underline"

            >

              Learn more at FIRST LEGO League

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

