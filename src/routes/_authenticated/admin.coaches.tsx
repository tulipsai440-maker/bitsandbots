import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/coaches")({
  beforeLoad: () => {
    throw redirect({ to: "/coaches", search: { edit: "1" } });
  },
});
