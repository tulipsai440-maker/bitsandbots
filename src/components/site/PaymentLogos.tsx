export function ZelleLogo({ className = "h-8" }: { className?: string }) {
  return (
    <div className={className} aria-label="Zelle">
      <span
        className="font-sans text-[2rem] font-bold leading-none tracking-tight text-[#6D1ED4] md:text-[2.25rem]"
        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      >
        Zelle<sup className="ml-0.5 text-[0.45em] font-normal">®</sup>
      </span>
    </div>
  );
}

export function VenmoLogo({ className = "h-8" }: { className?: string }) {
  return (
    <div className={className} aria-label="Venmo">
      <span
        className="font-sans text-[2rem] font-bold lowercase leading-none tracking-tight text-[#008CFF] md:text-[2.25rem]"
        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      >
        venmo
      </span>
    </div>
  );
}
