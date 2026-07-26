import { createServerFn } from "@tanstack/react-start";
import { fetchBandEventsFromEnv, getBandIcalUrl } from "./band";

export const getBandEvents = createServerFn({ method: "GET" }).handler(async () => {
  const configured = !!getBandIcalUrl();
  if (!configured) {
    return { source: "none" as const, events: [] as Awaited<ReturnType<typeof fetchBandEventsFromEnv>> };
  }
  try {
    const events = await fetchBandEventsFromEnv();
    return { source: "band" as const, events };
  } catch (error) {
    console.error("[band]", error);
    return {
      source: "band-error" as const,
      events: [] as Awaited<ReturnType<typeof fetchBandEventsFromEnv>>,
      message: error instanceof Error ? error.message : "Band calendar unavailable",
    };
  }
});
