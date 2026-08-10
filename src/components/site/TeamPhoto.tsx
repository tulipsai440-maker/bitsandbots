import { useState } from "react";
import { ImageIcon } from "lucide-react";

type Props = {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
  label?: string;
};

export function TeamPhoto({
  src,
  alt,
  className,
  width,
  height,
  loading = "lazy",
  fetchPriority,
  label,
}: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`grid place-items-center bg-gradient-to-br from-forest via-forest-deep to-navy text-cream/70 ${className ?? ""}`}
        role="img"
        aria-label={alt}
      >
        <div className="px-4 text-center">
          <ImageIcon size={28} className="mx-auto opacity-60" />
          <p className="mt-2 text-xs uppercase tracking-widest opacity-80">{label ?? "Photo coming soon"}</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      fetchPriority={fetchPriority}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

/** @deprecated Use TeamPhoto */
export const TroopPhoto = TeamPhoto;
