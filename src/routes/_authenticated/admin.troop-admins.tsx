import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/troop-admins")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/team-admins" });
  },
});
