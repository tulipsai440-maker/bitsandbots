import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy URL — season videos now live on Resources. */
export const Route = createFileRoute("/videos")({
  beforeLoad: () => {
    throw redirect({ to: "/resources" });
  },
});
