import {
  buildMediaConsentBothParentsNote,
  buildMediaConsentIntro,
  buildMediaConsentTerms,
} from "@/lib/media-consent-copy";
import type { SiteSettings } from "@/lib/site-settings";
import type { TeamBranding } from "@/lib/team-branding";

export function resolveConsentCopy(settings: SiteSettings, branding: TeamBranding) {
  return {
    intro: settings.consentIntroOverride.trim() || buildMediaConsentIntro(branding),
    terms:
      settings.consentTermsOverride.length > 0
        ? settings.consentTermsOverride
        : buildMediaConsentTerms(branding),
    bothParentsNote:
      settings.consentBothParentsNoteOverride.trim() || buildMediaConsentBothParentsNote(),
    heroTitle: settings.consentHeroTitle,
    heroDescription: settings.consentHeroDescription || `Permission for ${branding.siteName} to share team photos and videos.`,
    successTitle: settings.consentSuccessTitle,
    successMessage: settings.consentSuccessMessage,
  };
}
