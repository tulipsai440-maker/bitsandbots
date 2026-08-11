import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/sponsors")({
  beforeLoad: () => {
    throw redirect({ to: "/sponsors", search: { edit: "1" } });
  },
});
