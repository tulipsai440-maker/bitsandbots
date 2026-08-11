import { cn } from "@/lib/utils";
import { EditableBlock, EditableText } from "@/components/admin/inline-edit/EditableText";
import type { SiteSettings } from "@/lib/site-settings";

type StringSettingKey = {
  [K in keyof SiteSettings]: SiteSettings[K] extends string ? K : never;
}[keyof SiteSettings];

export function EditablePageHero({
  title,
  titleKey,
  titleLabel = "Page title",
  description,
  descriptionKey,
  descriptionLabel = "Page description",
  eyebrow,
  eyebrowKey,
  eyebrowLabel = "Eyebrow",
  align = "left",
  descriptionClassName,
}: {
  title: string;
  titleKey?: StringSettingKey;
  titleLabel?: string;
  description?: string;
  descriptionKey?: StringSettingKey;
  descriptionLabel?: string;
  eyebrow?: string;
  eyebrowKey?: StringSettingKey;
  eyebrowLabel?: string;
  align?: "left" | "center";
  descriptionClassName?: string;
}) {
  const centered = align === "center";

  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-background">
      <div className={cn("container-page py-12 md:py-16", centered && "text-center")}>
        {eyebrow && eyebrowKey ? (
          <EditableText settingKey={eyebrowKey} label={eyebrowLabel} className="eyebrow mb-4 block">
            {eyebrow}
          </EditableText>
        ) : eyebrow ? (
          <div className="eyebrow mb-4">{eyebrow}</div>
        ) : null}

        <h1 className={cn("max-w-3xl text-4xl leading-[1.05] text-foreground md:text-6xl", centered && "mx-auto")}>
          {titleKey ? (
            <EditableText settingKey={titleKey} label={titleLabel}>
              {title}
            </EditableText>
          ) : (
            title
          )}
        </h1>

        {description && descriptionKey ? (
          <EditableBlock
            settingKey={descriptionKey}
            label={descriptionLabel}
            className={cn("mt-5 max-w-3xl", centered && "mx-auto text-center")}
          >
            <p
              className={cn(
                "text-base leading-relaxed text-muted-foreground md:text-lg text-pretty",
                centered && "mx-auto text-center",
                descriptionClassName,
              )}
            >
              {description}
            </p>
          </EditableBlock>
        ) : description ? (
          <p
            className={cn(
              "mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg text-pretty",
              centered && "mx-auto text-center",
              descriptionClassName,
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
    </section>
  );
}
