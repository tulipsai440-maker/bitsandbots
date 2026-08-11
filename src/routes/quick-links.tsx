import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy URL — quick links now live on Resources. */
export const Route = createFileRoute("/quick-links")({
  beforeLoad: () => {
    throw redirect({ to: "/resources" });
  },
});
