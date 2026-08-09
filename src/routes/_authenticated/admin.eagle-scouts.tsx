import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy admin route — Bits & Bots uses Admin → Our Team. */
export const Route = createFileRoute("/_authenticated/admin/eagle-scouts")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/team" });
  },
});
