import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy admin route — Bits & Bots uses Admin → Coaches. */
export const Route = createFileRoute("/_authenticated/admin/scoutmasters")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/coaches" });
  },
});
