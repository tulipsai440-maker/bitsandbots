import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";
import { supabase } from "@/integrations/supabase/client";

function AuthenticatedPending() {
  return (
    <SiteLayout>
      <div className="container-page py-20 text-muted-foreground">Loading admin…</div>
    </SiteLayout>
  );
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  pendingComponent: AuthenticatedPending,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: () => <Outlet />,
});
