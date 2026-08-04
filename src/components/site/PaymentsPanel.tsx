import { Copy, ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { troopPayments } from "@/lib/payments";
import { VenmoLogo, ZelleLogo } from "@/components/site/PaymentLogos";

async function copyText(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error("Could not copy — select and copy manually");
  }
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-forest/10 text-xs font-semibold text-forest">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}

export function PaymentsPanel({ compact = false }: { compact?: boolean }) {
  const { zelle, venmo } = troopPayments;

  return (
    <section
      id="payments"
      className={`scroll-mt-28 ${compact ? "py-8" : "border-b border-border/60 bg-gradient-to-b from-sand/80 to-background py-16 md:py-20"}`}
    >
      <div className="container-page">
        {!compact && (
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-forest">Troop 2001 Naples</p>
            <h2 className="mt-2 font-display text-3xl text-foreground md:text-4xl">Pay dues &amp; fees</h2>
            <p className="mt-3 text-base text-muted-foreground">
              Choose <strong className="font-medium text-foreground">Zelle</strong> or{" "}
              <strong className="font-medium text-foreground">Venmo</strong>. Always include your{" "}
              <strong className="font-medium text-foreground">scout&apos;s name</strong> in the memo or note.
            </p>
          </div>
        )}

        <div className={`mx-auto grid max-w-5xl gap-6 ${compact ? "" : "mt-10"} lg:grid-cols-2`}>
          {/* Zelle */}
          <article className="flex flex-col overflow-hidden rounded-3xl border-2 border-[#6D1ED4]/20 bg-card shadow-sm">
            <div className="border-b border-[#6D1ED4]/10 bg-[#6D1ED4]/5 px-6 py-5">
              <ZelleLogo />
              <p className="mt-2 text-sm text-muted-foreground">Send from your bank app</p>
            </div>

            <div className="flex flex-1 flex-col p-6">
              <ol className="space-y-3">
                <Step n={1}>Open Zelle in your bank app (Chase, Wells Fargo, etc.)</Step>
                <Step n={2}>
                  Send to this email — tap <strong className="text-foreground">Copy email</strong> below
                </Step>
                <Step n={3}>Add your scout&apos;s name in the memo (e.g. &quot;Dues — Alex&quot;)</Step>
              </ol>

              <div className="mt-6 rounded-2xl border border-[#6D1ED4]/20 bg-[#6D1ED4]/5 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-[#6D1ED4]">Zelle email</p>
                <p className="mt-2 break-all font-mono text-lg font-semibold text-foreground md:text-xl">
                  {zelle.email}
                </p>
                <button
                  type="button"
                  onClick={() => copyText("Email", zelle.email)}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6D1ED4] px-4 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  <Copy size={18} /> Copy email
                </button>
              </div>

              <p className="mt-4 text-center text-xs text-muted-foreground">{zelle.recipientName}</p>

              <div className="mt-6 rounded-2xl border border-border bg-white p-5">
                <p className="mb-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Or scan to pay with Zelle
                </p>
                <img
                  src={zelle.qrImage}
                  alt="Zelle QR code for naplestroop2001@gmail.com"
                  className="mx-auto w-full max-w-[240px] object-contain"
                />
              </div>
            </div>
          </article>

          {/* Venmo */}
          <article className="flex flex-col overflow-hidden rounded-3xl border-2 border-[#008CFF]/20 bg-card shadow-sm">
            <div className="border-b border-[#008CFF]/10 bg-[#008CFF]/5 px-6 py-5">
              <VenmoLogo />
              <p className="mt-2 text-sm text-muted-foreground">Pay in the Venmo app or website</p>
            </div>

            <div className="flex flex-1 flex-col p-6">
              <ol className="space-y-3">
                <Step n={1}>Tap the blue button below — opens Troop 2001&apos;s Venmo page</Step>
                <Step n={2}>Enter the amount and confirm payment</Step>
                <Step n={3}>Add your scout&apos;s name in the note (e.g. &quot;Campout — Alex&quot;)</Step>
              </ol>

              <div className="mt-6 flex flex-1 flex-col items-center justify-center rounded-2xl border border-[#008CFF]/20 bg-[#008CFF]/5 px-6 py-8 text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-[#008CFF]">Venmo username</p>
                <p className="mt-2 font-display text-3xl text-foreground">{venmo.handle}</p>
                <p className="mt-1 text-sm text-muted-foreground">Troop 2001 Naples</p>
              </div>

              <a
                href={venmo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#008CFF] px-4 py-4 text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
              >
                Pay with Venmo <ExternalLink size={18} />
              </a>

              <button
                type="button"
                onClick={() => copyText("Venmo link", venmo.url)}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Copy size={16} /> Copy Venmo link
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
