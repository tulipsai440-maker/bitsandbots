import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_OUTREACH_STORIES,
  DEFAULT_SITE_SETTINGS,
  type OutreachStoryRow,
  type SiteSettings,
} from "@/lib/site-settings";
import { saveOutreachStories, saveSiteSettings } from "@/lib/site-settings-admin";
import { toast } from "sonner";

type SiteContentContextValue = {
  settings: SiteSettings;
  outreachStories: OutreachStoryRow[];
  patchSettings: (patch: Partial<SiteSettings>) => void;
  patchOutreachStory: (id: string, patch: Partial<OutreachStoryRow>) => void;
  setOutreachStories: (stories: OutreachStoryRow[]) => void;
  saveSettings: () => Promise<void>;
  saveSettingsData: (next: SiteSettings, outreach?: OutreachStoryRow[]) => Promise<void>;
  saveOutreachStoriesNow: () => Promise<void>;
  saving: boolean;
};

const SiteContentContext = createContext<SiteContentContextValue | null>(null);

export function SiteSettingsProvider({
  initialSettings,
  initialOutreachStories,
  children,
}: {
  initialSettings: SiteSettings;
  initialOutreachStories: OutreachStoryRow[];
  children: ReactNode;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [outreachStories, setOutreachStories] = useState(initialOutreachStories);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  useEffect(() => {
    setOutreachStories(initialOutreachStories);
  }, [initialOutreachStories]);

  const patchSettings = useCallback((patch: Partial<SiteSettings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  const patchOutreachStory = useCallback((id: string, patch: Partial<OutreachStoryRow>) => {
    setOutreachStories((current) =>
      current.map((story) => (story.id === id ? { ...story, ...patch } : story)),
    );
  }, []);

  const saveSettingsNow = useCallback(async () => {
    setSaving(true);
    try {
      await saveSiteSettings(settings);
      toast.success("Saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
      throw error;
    } finally {
      setSaving(false);
    }
  }, [settings]);

  const saveSettingsData = useCallback(async (next: SiteSettings, outreach?: OutreachStoryRow[]) => {
    setSaving(true);
    try {
      await saveSiteSettings(next);
      if (outreach) await saveOutreachStories(outreach);
      setSettings(next);
      if (outreach) setOutreachStories(outreach);
      toast.success("Saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
      throw error;
    } finally {
      setSaving(false);
    }
  }, []);

  const saveOutreachStoriesNow = useCallback(async () => {
    setSaving(true);
    try {
      await saveOutreachStories(outreachStories);
      toast.success("Outreach stories saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
      throw error;
    } finally {
      setSaving(false);
    }
  }, [outreachStories]);

  const value = useMemo(
    () => ({
      settings,
      outreachStories,
      patchSettings,
      patchOutreachStory,
      setOutreachStories,
      saveSettings: saveSettingsNow,
      saveSettingsData,
      saveOutreachStoriesNow,
      saving,
    }),
    [
      settings,
      outreachStories,
      patchSettings,
      patchOutreachStory,
      saveSettingsNow,
      saveSettingsData,
      saveOutreachStoriesNow,
      saving,
    ],
  );

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  const ctx = useContext(SiteContentContext);
  if (!ctx) {
    return {
      settings: DEFAULT_SITE_SETTINGS,
      outreachStories: DEFAULT_OUTREACH_STORIES,
      patchSettings: () => {},
      patchOutreachStory: () => {},
      setOutreachStories: () => {},
      saveSettings: async () => {},
      saveSettingsData: async () => {},
      saveOutreachStoriesNow: async () => {},
      saving: false,
    };
  }
  return ctx;
}

/** Read-only site copy (same fields as before). */
export function useSiteSettings(): SiteSettings {
  return useSiteContent().settings;
}
