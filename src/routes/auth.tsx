import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/Layout";
import { supabase, getSupabaseProjectRef } from "@/integrations/supabase/client";
import { toast } from "sonner";

function authCallbackUrl(): string {
  if (typeof window !== "undefined") return `${window.location.origin}/auth`;
  return "/auth";
}

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Bits & Bots" },
      { name: "description", content: "Sign in to Bits & Bots admin." },
      { property: "og:title", content: "Sign in — Bits & Bots" },
      { property: "og:description", content: "Bits & Bots admin sign in." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const callbackUrl = authCallbackUrl();
  const isDev = import.meta.env.DEV;
  const projectRef = getSupabaseProjectRef();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin/calendar" });
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        toast.success("Signed in successfully.");
        navigate({ to: "/admin/calendar" });
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
      return `Email not confirmed yet. Open the confirmation link from your inbox — it should return to ${callbackUrl}. An admin can also confirm your account in Supabase.`;
    }
    return msg;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const trimmedEmail = email.trim();
    const trimmedPassword = password;
    try {
      if (mode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPassword,
        });
        if (error) throw error;
        if (!data.session) throw new Error("Sign in succeeded but no session was returned. Try again.");
      } else {
        const { error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: trimmedPassword,
          options: { emailRedirectTo: callbackUrl },
        });
        if (error) throw error;
        const success = `Account created. Check your email for a confirmation link — it should open ${callbackUrl}.`;
        setMessage({ type: "success", text: success });
        toast.success("Account created. Check your email to confirm.");
        setMode("signin");
        return;
      }
      navigate({ to: "/admin/calendar" });
    } catch (err) {
      const text = authErrorMessage(err);
      setMessage({ type: "error", text });
      toast.error(text);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteLayout>
      <section className="py-20">
        <div className="container-page max-w-md">
          <div className="eyebrow">Team Admin</div>
          <h1 className="mt-3 font-display text-4xl">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Access the admin area to manage calendar, team, coaches, and announcements. Password
            only signs you in — admin access is a separate database role. First time? Create an
            account, confirm your email, then ask a coach to grant admin in Team Admins or via SQL.
          </p>
          {isDev && projectRef && (
            <p className="mt-2 text-xs text-muted-foreground">
              Dev Supabase project: <code className="rounded bg-muted px-1">{projectRef}</code>
            </p>
          )}

          <form onSubmit={onSubmit} className="mt-8 space-y-3">
            <div>
              <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Password</label>
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
            <Link to="/" className="hover:underline">← Back to home</Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
