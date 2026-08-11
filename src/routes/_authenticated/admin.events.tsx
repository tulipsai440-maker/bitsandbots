import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/events")({
  beforeLoad: () => {
    throw redirect({ to: "/calendar", search: { edit: "1" } });
  },
});
