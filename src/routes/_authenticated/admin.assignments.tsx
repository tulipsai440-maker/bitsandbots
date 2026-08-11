import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/assignments")({
  beforeLoad: () => {
    throw redirect({ to: "/assignments" });
  },
});
