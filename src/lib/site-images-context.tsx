import { createContext, useContext, type ReactNode } from "react";
import {
  buildDefaultSiteImageOverrides,
  type SiteImageKey,
  type SiteImageOverride,
  type SiteImageOverrides,
  resolveSiteImage,
} from "@/lib/site-images";

type SiteImagesContextValue = {
  overrides: SiteImageOverrides;
  resolve: (key: SiteImageKey) => SiteImageOverride;
};

const SiteImagesContext = createContext<SiteImagesContextValue | null>(null);

export function SiteImagesProvider({
  initialOverrides,
  children,
}: {
  initialOverrides: SiteImageOverrides;
  children: ReactNode;
}) {
  const value: SiteImagesContextValue = {
    overrides: initialOverrides,
    resolve: (key) => resolveSiteImage(key, initialOverrides),
  };
  return <SiteImagesContext.Provider value={value}>{children}</SiteImagesContext.Provider>;
}

export function useSiteImages() {
  const ctx = useContext(SiteImagesContext);
  const defaults = buildDefaultSiteImageOverrides();
  if (!ctx) {
    return {
      overrides: defaults,
      resolve: (key: SiteImageKey) => resolveSiteImage(key, defaults),
    };
  }
  return ctx;
}

export function useSiteImage(key: SiteImageKey): SiteImageOverride {
  return useSiteImages().resolve(key);
}
