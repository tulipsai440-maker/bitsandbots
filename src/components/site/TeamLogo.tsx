import { cn } from "@/lib/utils";
import { photos, SITE_NAME, SITE_TAGLINE } from "@/lib/photos";

const LOGO_SRC = photos.logo;

type TeamLogoProps = {
  variant?: "light" | "dark";
  size?: "sm" | "md";
  className?: string;
  priority?: boolean;
};

const sizeConfig = {
  sm: { box: "h-14 w-14 p-1.5", render: 112, display: 56 },
  md: { box: "h-[5.25rem] w-[5.25rem] p-2 md:h-24 md:w-24 md:p-2.5", render: 192, display: 96 },
} as const;

export function TeamLogo({ variant = "light", size = "md", className, priority = false }: TeamLogoProps) {
  const cfg = sizeConfig[size];

  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-white",
        "ring-1 ring-black/[0.06]",
        cfg.box,
        variant === "light"
          ? "shadow-[0_3px_14px_rgba(27,54,40,0.14)]"
          : "shadow-[0_6px_20px_rgba(0,0,0,0.35)] ring-cream/30",
        className,
      )}
    >
      <img
        src={LOGO_SRC}
        alt={`${SITE_TAGLINE} — ${SITE_NAME}`}
        width={cfg.render}
        height={cfg.render}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        className="h-full w-full object-contain object-center"
      />
    </span>
  );
}

/** @deprecated Use TeamLogo */
export const TroopLogo = TeamLogo;
