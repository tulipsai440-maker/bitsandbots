import { useState } from "react";
import { ImageIcon } from "lucide-react";

type Props = {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
  label?: string;
};

export function TroopPhoto({ src, alt, className, width, height, loading = "lazy", label }: Props) {
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
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
