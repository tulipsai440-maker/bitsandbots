import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/calendar")({
  beforeLoad: () => {
    throw redirect({ to: "/calendar", search: { edit: "1" } });
  },
});
