import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/Layout";
import { AdminAccessPending } from "@/components/admin/AdminAccessPending";
import { supabase, getSupabaseProjectRef } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/lib/admin";
import {
  demoAdminLoginHint,
  normalizeDemoAdminEmail,
} from "@/lib/demo/demo-admin-login";
import { shouldUseDemoAssets } from "@/lib/demo/demo-tenant";
import { brandingRouteLoader, routeTeamName } from "@/lib/team-branding";
import { toast } from "sonner";

function authCallbackUrl(): string {
  if (typeof window !== "undefined") return `${window.location.origin}/auth`;
  return "/auth";
}

export const Route = createFileRoute("/auth")({
  loader: async () => {
    const isDemo = await shouldUseDemoAssets();
    let demoSlug = "";
    if (isDemo) {
      if (import.meta.env.SSR) {
        const { getTenantContext } = await import("@/lib/tenant/context.server");
        demoSlug = getTenantContext()?.slug ?? "";
      } else if (typeof window !== "undefined") {
        const { resolveTenantFromHost } = await import("@/lib/tenant/resolve");
        const ctx = await resolveTenantFromHost(window.location.host);
        demoSlug = ctx.slug;
      }
    }
    const brandingData = await brandingRouteLoader();
    const teamName = routeTeamName(brandingData);
    return {
      ...brandingData,
      isDemo,
      demoSlug,
      demoLogin: isDemo && demoSlug ? demoAdminLoginHint(demoSlug, teamName) : null,
    };
  },
  head: ({ loaderData }) => {
    const name = routeTeamName(loaderData);
    return {
      meta: [
        { title: `Sign in — ${name}` },
        { name: "description", content: `Sign in to ${name} admin.` },
        { property: "og:title", content: `Sign in — ${name}` },
        { property: "og:description", content: `${name} admin sign in.` },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { isDemo, demoSlug, demoLogin } = Route.useLoaderData();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState(() => (demoLogin?.username ? demoLogin.username : ""));
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [adminPending, setAdminPending] = useState(false);
  const callbackUrl = authCallbackUrl();
  const isDev = import.meta.env.DEV;
  const projectRef = getSupabaseProjectRef();

  useEffect(() => {
    async function resolveSession() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;

      const userEmail = data.session.user.email ?? null;
      setSignedInEmail(userEmail);

      const isAdmin = await checkIsAdmin();
      if (isAdmin) {
        navigate({ to: "/admin" });
        return;
      }

      setAdminPending(true);
    }

    void resolveSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        void (async () => {
          const isAdmin = await checkIsAdmin();
          if (isAdmin) {
            toast.success("Signed in successfully.");
            navigate({ to: "/admin" });
            return;
          }
          setSignedInEmail(session.user.email ?? null);
          setAdminPending(true);
          toast.message("Signed in — waiting for admin access.");
        })();
      }
      if (event === "PASSWORD_RECOVERY") {
        setMessage({
          type: "success",
          text: "Password reset confirmed. Sign in with your new password.",
        });
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [navigate]);

  function authErrorMessage(err: unknown): string {
    const msg = err instanceof Error ? err.message : "Sign in failed";
    if (msg.includes("Invalid login credentials")) {
      return "Wrong email or password. If this is your first time, click “Need an account? Sign up” below.";
    }
    if (msg.includes("Email not confirmed")) {
      return `Email not confirmed yet. Open the confirmation link from your inbox — it should return to ${callbackUrl}.`;
    }
    return msg;
  }

  async function signInWithCredentials(rawEmail: string, rawPassword: string) {
    setBusy(true);
    setMessage(null);
    const trimmedEmail = isDemo
      ? normalizeDemoAdminEmail(rawEmail, demoSlug, demoLogin?.username)
      : rawEmail.trim();
    const trimmedPassword = rawPassword;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      });
      if (error) throw error;
      if (!data.session) throw new Error("Sign in succeeded but no session was returned. Try again.");

      const isAdmin = await checkIsAdmin();
      if (isAdmin) {
        navigate({ to: "/admin" });
        return;
      }
      setSignedInEmail(trimmedEmail);
      setAdminPending(true);
      toast.message("Signed in — waiting for admin access.");
    } catch (err) {
      const text = authErrorMessage(err);
      setMessage({ type: "error", text });
      toast.error(text);
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signin") {
      await signInWithCredentials(email, password);
      return;
    }

    setBusy(true);
    setMessage(null);
    const trimmedEmail = email.trim();
    const trimmedPassword = password;
    try {
      const { error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: trimmedPassword,
        options: { emailRedirectTo: callbackUrl },
      });
      if (error) throw error;
      const success = `Account created. Check your email for a confirmation link (returns to ${callbackUrl}). After confirming, ask a coach to grant admin in Team Admins.`;
      setMessage({ type: "success", text: success });
      toast.success("Account created. Check your email to confirm.");
      setMode("signin");
    } catch (err) {
      const text = authErrorMessage(err);
      setMessage({ type: "error", text });
      toast.error(text);
    } finally {
      setBusy(false);
    }
  }

  if (adminPending) {
    return (
      <AdminAccessPending
        isDemo={isDemo}
        userEmail={signedInEmail}
        onSignOut={() => {
          setAdminPending(false);
          setSignedInEmail(null);
        }}
      />
    );
  }

  return (
    <SiteLayout>
      <section className="py-20">
        <div className="container-page max-w-md">
          <div className="eyebrow">Team Admin</div>
          <h1 className="mt-3 font-display text-4xl">{mode === "signup" ? "Create account" : "Sign in"}</h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Access the admin area to manage calendar, team, coaches, and announcements. Password only
            signs you in — admin access is a separate role. First time? Create an account, confirm
            your email, then ask a coach to grant admin in Team Admins.
          </p>

          {isDev && projectRef && (
            <p className="mt-2 text-xs text-muted-foreground">
              Dev Supabase project: <code className="rounded bg-muted px-1">{projectRef}</code>
            </p>
          )}

          <form onSubmit={onSubmit} className="mt-8 space-y-3">
            <div>
              <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Email
              </label>
              <input
                type={isDemo ? "text" : "email"}
                required
                autoComplete="username"
                placeholder={isDemo && demoLogin ? demoLogin.username : undefined}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          {message && (
            <p
              role="alert"
              className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
                message.type === "success"
                  ? "border-forest/30 bg-forest/5 text-forest"
                  : "border-destructive/30 bg-destructive/5 text-destructive"
              }`}
            >
              {message.text}
            </p>
          )}

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-4 text-sm text-forest underline-offset-4 hover:underline"
          >
            {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
          </button>

          <div className="mt-8 text-xs text-muted-foreground">
            <Link to="/" className="hover:underline">
              ← Back to home
            </Link>
            {isDemo && (
              <>
                {" · "}
                <Link to="/admin" className="hover:underline">
                  Admin dashboard
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
