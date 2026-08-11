import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/announcements")({
  beforeLoad: () => {
    throw redirect({ to: "/", search: { edit: "1" } });
  },
});
