export type AdminEditSearch = {
  edit?: string;
};

export function parseAdminEditSearch(search: Record<string, unknown>): AdminEditSearch {
  return {
    edit: typeof search.edit === "string" ? search.edit : undefined,
  };
}
