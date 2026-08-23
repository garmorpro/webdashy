import { db } from "@/lib/db";

const SETTINGS_ID = "singleton";

/**
 * Fetches the single app-settings row, creating it with defaults if it
 * doesn't exist yet (e.g. a database that predates this feature, or the
 * seed script hasn't been re-run). Safe to call from any request path.
 */
export async function getAppSettings() {
  return db.appSettings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: { id: SETTINGS_ID },
  });
}
