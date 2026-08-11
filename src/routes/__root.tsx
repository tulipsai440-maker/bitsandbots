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
import {
  DEFAULT_OUTREACH_STORIES,
  DEFAULT_SITE_SETTINGS,
  fetchOutreachStories,
  fetchSiteSettings,
} from "@/lib/site-settings";
import { SiteSettingsProvider } from "@/lib/site-settings-context";
import { AdminEditProvider } from "@/components/admin/inline-edit/AdminEditProvider";
import { BrandColorStyles } from "@/components/site/BrandColorStyles";
import { DemoBanner } from "@/components/site/DemoBanner";
import { normalizeBrandColor } from "@/lib/brand-colors";
import {
  buildDefaultSiteImageOverrides,
  fetchSiteImageOverrides,
  resolveSiteImage,
} from "@/lib/site-images";
import { SiteImagesProvider } from "@/lib/site-images-context";

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
  loader: async () => {
    let tenantStatus: "demo" | "live" | null = null;
    if (import.meta.env.SSR) {
      const { getTenantContext } = await import("@/lib/tenant/context.server");
      tenantStatus = getTenantContext()?.status ?? null;
    }
    try {
      const [siteSettings, outreachStories, siteImages] = await Promise.all([
        fetchSiteSettings(),
        fetchOutreachStories(),
        fetchSiteImageOverrides().catch(() => buildDefaultSiteImageOverrides()),
      ]);
      return {
        siteSettings,
        outreachStories,
        siteImages,
        tenantStatus,
      };
    } catch {
      return {
        siteSettings: DEFAULT_SITE_SETTINGS,
        outreachStories: DEFAULT_OUTREACH_STORIES,
        siteImages: buildDefaultSiteImageOverrides(),
        tenantStatus,
      };
    }
  },
  head: ({ loaderData }) => {
    const s = loaderData?.siteSettings ?? DEFAULT_SITE_SETTINGS;
    const images = loaderData?.siteImages ?? buildDefaultSiteImageOverrides();
    const ogImage = resolveSiteImage("ogImage", images).url || photos.ogLogo;
    const favicon32 = resolveSiteImage("favicon32", images).url || photos.favicon32;
    const favicon16 = resolveSiteImage("favicon16", images).url || photos.favicon16;
    const appleTouch = resolveSiteImage("appleTouchIcon", images).url || photos.appleTouchIcon;
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: `${s.siteName} — ${s.siteTagline}` },
        {
          name: "description",
          content: `${s.siteName} is a FIRST LEGO League team founded in ${s.foundedYear}. ${s.meetingsBlurb}`,
        },
        { name: "author", content: s.siteName },
        { name: "theme-color", content: normalizeBrandColor(s.brandColor) },
        { property: "og:title", content: `${s.siteName} — ${s.siteTagline}` },
        {
          property: "og:description",
          content: `A FIRST LEGO League team founded in ${s.foundedYear}. ${s.meetingsBlurb}`,
        },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: s.siteName },
        { property: "og:url", content: s.siteUrl },
        { property: "og:image", content: ogImage },
        { property: "og:image:alt", content: `${s.siteName} team photo` },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: ogImage },
        { name: "twitter:image:alt", content: `${s.siteName} team photo` },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "icon", href: "/favicon.ico", sizes: "any" },
        { rel: "icon", href: favicon32, type: "image/png", sizes: "32x32" },
        { rel: "icon", href: favicon16, type: "image/png", sizes: "16x16" },
        { rel: "apple-touch-icon", href: appleTouch, sizes: "180x180" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Syne:wght@500;600;700&display=swap",
        },
      ],
    };
  },
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
  const { siteSettings, outreachStories, siteImages, tenantStatus } = Route.useLoaderData();
  return (
    <QueryClientProvider client={queryClient}>
      <SiteSettingsProvider initialSettings={siteSettings} initialOutreachStories={outreachStories}>
        <SiteImagesProvider initialOverrides={siteImages}>
          <BrandColorStyles />
          <AdminEditProvider>
            <DemoBanner tenantStatus={tenantStatus} />
            <Outlet />
            <Toaster richColors closeButton position="top-center" />
          </AdminEditProvider>
        </SiteImagesProvider>
      </SiteSettingsProvider>
    </QueryClientProvider>
  );
}
