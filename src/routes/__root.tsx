import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "../styles.css?url";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import { Toaster } from "../components/ui/sonner";
import { photos } from "@/lib/photos";

const SITE_URL = "https://troop2001naples.org";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1 items-center justify-center px-4 py-24">
        <div className="max-w-md text-center">
          <p className="text-sm text-muted-foreground mb-3">404</p>
          <h1 className="font-display text-5xl text-foreground">Page not found</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            That address is not on this site. Use the menu or return to the homepage.
          </p>
          <div className="mt-6">
            <Link to="/" className="btn-primary">Return home</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">Please try again or return to the homepage.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="btn-primary"
          >
            Try again
          </button>
          <a href="/" className="btn-outline">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Troop 2001 Naples — Scouts BSA in Naples, Florida" },
      { name: "description", content: "Troop 2001 Naples meets Wednesdays at North Collier Fire Station #45. Campouts, service projects, and Eagle Scout program since 2000." },
      { name: "author", content: "Troop 2001 Naples" },
      { name: "theme-color", content: "#1f3d1f" },
      { property: "og:title", content: "Troop 2001 Naples — Scouts BSA" },
      { property: "og:description", content: "Scouts BSA in Naples, Florida since 2000. Wednesday meetings at 7 PM." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Troop 2001 Naples" },
      { property: "og:url", content: SITE_URL },
      { property: "og:image", content: `${SITE_URL}${photos.ogLogo}` },
      { property: "og:image:alt", content: "Boy Scouts of America Troop 2001 Naples logo" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:image", content: `${SITE_URL}${photos.ogLogo}` },
      { name: "twitter:image:alt", content: "Boy Scouts of America Troop 2001 Naples logo" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", href: photos.favicon32, type: "image/png", sizes: "32x32" },
      { rel: "icon", href: photos.favicon16, type: "image/png", sizes: "16x16" },
      { rel: "apple-touch-icon", href: photos.appleTouchIcon, sizes: "180x180" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster richColors closeButton position="top-center" />
    </QueryClientProvider>
  );
}
