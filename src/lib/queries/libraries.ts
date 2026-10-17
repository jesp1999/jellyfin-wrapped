import { getAuthenticatedJellyfinApi } from "../jellyfin-api";
import { getCurrentUserId } from "./utils";
export type MediaKind = "movies" | "shows" | "music" | "musicVideos" | "books" | "audiobooks" | "liveTv";
type Page = { Items?: { Id?: string; CollectionType?: string | null }[] };
const BY_LIBRARY: Record<string, MediaKind[]> = { movies: ["movies"], tvshows: ["shows"], music: ["music"], musicvideos: ["musicVideos"], books: ["books", "audiobooks"], livetv: ["liveTv"] };
// Untyped ("mixed content") libraries are probed for what they hold.
const BY_ITEM: Record<string, MediaKind> = { Movie: "movies", Series: "shows", Audio: "music", MusicVideo: "musicVideos", Book: "books", AudioBook: "audiobooks" };
// The kinds of library this user can see, or null if they cannot be listed (callers then show everything).
export const getLibraryKinds = async (): Promise<MediaKind[] | null> => {
  try {
    const api = await getAuthenticatedJellyfinApi();
    const userId = await getCurrentUserId();
    const headers = { Authorization: api.authorizationHeader };
    const get = async (path: string): Promise<Page | null> => { const r = await fetch(`${api.basePath}${path}`, { headers }); return r.ok ? ((await r.json()) as Page) : null; };
    const views = (await get(`/UserViews?userId=${userId}`)) ?? (await get(`/Users/${userId}/Views`)); // newer / older servers
    if (!views) return null;
    const kinds = new Set<MediaKind>();
    for (const v of views.Items ?? []) {
      if (v.CollectionType && BY_LIBRARY[v.CollectionType]) BY_LIBRARY[v.CollectionType].forEach((k) => kinds.add(k));
      else if (!v.CollectionType || v.CollectionType === "mixed") for (const [type, kind] of Object.entries(BY_ITEM)) if ((await get(`/Items?userId=${userId}&parentId=${v.Id}&recursive=true&includeItemTypes=${type}&limit=1`))?.Items?.length) kinds.add(kind);
    }
    return [...kinds];
  } catch { return null; }
};
