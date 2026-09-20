export type ResourcesPageSections = {
  documentsTitle: string;
  documentsDescription: string;
  programTitle: string;
  programDescription: string;
  teamTitle: string;
  teamDescription: string;
  playlistButtonLabel: string;
  materialsButtonLabel: string;
  /**
   * Set when an admin deliberately empties a list. Without it an empty list falls back to the
   * bundled FLL defaults, so tenants that never stored their own content keep showing them.
   */
  videosCleared: boolean;
  videoGroupsCleared: boolean;
  quickLinksCleared: boolean;
};

export const DEFAULT_RESOURCES_PAGE_SECTIONS: ResourcesPageSections = {
  documentsTitle: "Season documents",
  documentsDescription:
    "Official PDFs the team uses every week — notebook, rulebook, missions, rubric, and score sheet.",
  programTitle: "FIRST program links",
  programDescription: "Official sites, guides, and materials from FIRST and FIRST LEGO League.",
  teamTitle: "On this site",
  teamDescription: "Team calendar, gallery, and other pages for families.",
  playlistButtonLabel: "Full season playlist",
  materialsButtonLabel: "All LEGO Education materials",
  videosCleared: false,
  videoGroupsCleared: false,
  quickLinksCleared: false,
};

export function parseResourcesPageSections(value: unknown): ResourcesPageSections {
  if (!value || typeof value !== "object") return DEFAULT_RESOURCES_PAGE_SECTIONS;
  const row = value as Record<string, unknown>;
  return {
    documentsTitle: String(row.documentsTitle ?? DEFAULT_RESOURCES_PAGE_SECTIONS.documentsTitle),
    documentsDescription: String(
      row.documentsDescription ?? DEFAULT_RESOURCES_PAGE_SECTIONS.documentsDescription,
    ),
    programTitle: String(row.programTitle ?? DEFAULT_RESOURCES_PAGE_SECTIONS.programTitle),
    programDescription: String(
      row.programDescription ?? DEFAULT_RESOURCES_PAGE_SECTIONS.programDescription,
    ),
    teamTitle: String(row.teamTitle ?? DEFAULT_RESOURCES_PAGE_SECTIONS.teamTitle),
    teamDescription: String(row.teamDescription ?? DEFAULT_RESOURCES_PAGE_SECTIONS.teamDescription),
    playlistButtonLabel: String(
      row.playlistButtonLabel ?? DEFAULT_RESOURCES_PAGE_SECTIONS.playlistButtonLabel,
    ),
    materialsButtonLabel: String(
      row.materialsButtonLabel ?? DEFAULT_RESOURCES_PAGE_SECTIONS.materialsButtonLabel,
    ),
    videosCleared: row.videosCleared === true,
    videoGroupsCleared: row.videoGroupsCleared === true,
    quickLinksCleared: row.quickLinksCleared === true,
  };
}
