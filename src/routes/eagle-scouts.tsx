import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy URL — redirects to Our Team. */
export const Route = createFileRoute("/eagle-scouts")({
  beforeLoad: () => {
    throw redirect({ to: "/about" });
  },
});
