import { cn } from "@/lib/utils";
import { photos } from "@/lib/photos";

const LOGO_SRC = photos.logo;
const LOGO_WIDTH = 512;

type TroopLogoProps = {
  variant?: "light" | "dark";
  size?: "sm" | "md";
  className?: string;
  priority?: boolean;
};

const sizeConfig = {
  sm: { box: "h-14 w-14 p-1", render: 112, display: 56 },
  md: { box: "h-[5.25rem] w-[5.25rem] p-1.5 md:h-24 md:w-24 md:p-2", render: 192, display: 96 },
} as const;

export function TroopLogo({ variant = "light", size = "md", className, priority = false }: TroopLogoProps) {
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
        srcSet={`${LOGO_SRC} ${LOGO_WIDTH}w`}
        sizes={`(min-width: 768px) ${cfg.display}px, ${Math.round(cfg.display * 0.9)}px`}
        alt="Boy Scouts of America Troop 2001 Naples"
        width={cfg.render}
        height={cfg.render}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        className="h-full w-full object-contain object-center"
        style={{
          imageRendering: "-webkit-optimize-contrast",
        }}
      />
    </span>
  );
}
