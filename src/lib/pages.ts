import type { MediaKind } from "@/lib/queries/libraries";
// Page order for Next/Previous and the side menu. A page shows when the user can see at least one of its kinds; none listed = always.
const P = (path: string, name: string, ...requires: MediaKind[]) => ({ path, name, requires });
export const PAGES = [
  P("/TopTen", "Top 10", "movies", "shows"), P("/first-watched", "First Watched", "movies", "shows"),
  P("/movies", "Movies", "movies"), P("/shows", "TV Shows", "shows"),
  P("/audio", "Music", "music"), P("/music-videos", "Music Videos", "musicVideos"),
  P("/actors", "Favorite Actors", "movies"), P("/genres", "Genres", "movies"),
  P("/tv", "Live TV", "liveTv"), P("/critically-acclaimed", "Critically Acclaimed", "movies"),
  P("/oldest-movie", "Oldest Movie", "movies"), P("/oldest-show", "Oldest Show", "shows"),
  P("/holidays", "Holiday Watching", "movies", "shows"), P("/minutes-per-day", "Minutes Per Day"),
  P("/show-of-the-month", "Show of the Month", "shows"), P("/unfinished-shows", "Unfinished Shows", "shows"),
  P("/device-stats", "Device Stats"), P("/punch-card", "Activity Calendar"),
];
export const visiblePages = (kinds?: MediaKind[]) =>
  PAGES.filter((p) => !kinds || p.requires.length === 0 || p.requires.some((k) => kinds.includes(k)));
