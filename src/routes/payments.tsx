import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { PaymentsPanel } from "@/components/site/PaymentsPanel";

export const Route = createFileRoute("/payments")({
  head: () => ({
    meta: [
      { title: "Online Payments — Troop 2001 Naples" },
      {
        name: "description",
        content: "Pay Troop 2001 dues and activity fees with Zelle or Venmo.",
      },
    ],
  }),
  component: PaymentsPage,
});

function PaymentsPage() {
  return (
    <SiteLayout>
      <PageHero
        title="Online payments"
        align="center"
        description="Pay dues, camp fees, and activity costs with Zelle or Venmo."
      />
      <div className="container-page pb-4">
        <Link
          to="/quick-links"
          className="inline-flex items-center gap-2 text-sm font-medium text-forest hover:underline"
        >
          <ArrowLeft size={16} /> Back to quick links
        </Link>
      </div>
      <PaymentsPanel compact />
      <div className="pb-16" />
    </SiteLayout>
  );
}
