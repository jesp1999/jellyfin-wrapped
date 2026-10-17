import { useMovies } from "@/hooks/queries/useMovies";
import { useShows } from "@/hooks/queries/useShows";
import { useFavoriteActors } from "@/hooks/queries/useFavoriteActors";
import { useUnfinishedShows } from "@/hooks/queries/useUnfinishedShows";
import { getTopGenre } from "@/lib/genre-helpers";
import { getCachedHiddenIds } from "@/lib/cache";
import type { SimpleItemDto } from "@/lib/queries";
import { CardProps, Ellipsis, More, PosterGrid, ShareShell, Thumb } from "./ShareShell";

const plural = (n: number, one: string, many: string) => `${n.toLocaleString()} ${n === 1 ? one : many}`;
const visible = (items: SimpleItemDto[]) => {
  const hidden = getCachedHiddenIds();
  return items.filter((i) => !hidden.includes(i.id ?? ""));
};

export function MoviesCard({ bg }: CardProps) {
  const { data } = useMovies();
  const movies = visible((data ?? []) as SimpleItemDto[]);
  if (!movies.length) return null;
  return (
    <ShareShell bg={bg} center title={`You Watched ${plural(movies.length, "Movie", "Movies")}`} subtitle="Your complete movie viewing history">
      <PosterGrid items={movies} />
    </ShareShell>
  );
}

export function ShowsCard({ bg }: CardProps) {
  const { data } = useShows();
  const shows = visible(((data ?? []) as { item: SimpleItemDto }[]).map((s) => s.item));
  if (!shows.length) return null;
  return (
    <ShareShell bg={bg} center title={`You Watched ${plural(shows.length, "Show", "Shows")}`} subtitle="All the TV series you enjoyed this year">
      <PosterGrid items={shows} />
    </ShareShell>
  );
}

type Actor = { name: string; count: number; details?: { Id?: string | null } };

export function ActorsCard({ bg }: CardProps) {
  const { data } = useFavoriteActors();
  // The page shows the top 20, so "more" is counted against those.
  const actors = ((data ?? []) as Actor[]).slice(0, 20);
  if (!actors.length) return null;
  const shown = actors.slice(0, 9);
  const cols = Math.min(3, shown.length);
  return (
    <ShareShell bg={bg} center title="Your Favorite Actors" subtitle="The performers who appeared most in what you watched">
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "14px 8px" }}>
        {shown.map((a) => (
          <div key={a.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", minWidth: 0 }}>
            <Thumb item={{ id: a.details?.Id ?? a.name }} w={76} h={76} radius={38} />
            <div style={{ ...Ellipsis, maxWidth: "100%", fontSize: 12, fontWeight: 700, marginTop: 5 }}>{a.name}</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>{plural(a.count, "title", "titles")}</div>
          </div>
        ))}
      </div>
      <More n={actors.length - shown.length} />
    </ShareShell>
  );
}

export function GenreCard({ bg }: CardProps) {
  const { data: movies } = useMovies();
  const { data: shows } = useShows();
  const top = getTopGenre(
    visible((movies ?? []) as SimpleItemDto[]),
    visible(((shows ?? []) as { item: SimpleItemDto }[]).map((s) => s.item))
  );
  if (!top) return null;
  return (
    <ShareShell bg={bg} center title={`Your Top Genre: ${top.genre}`} subtitle={`${plural(top.count, "item", "items")} watched`}>
      <PosterGrid items={top.items} cap={8} />
      {top.honorableMentions.length > 0 && (
        <div style={{ fontSize: 13, opacity: 0.95, marginTop: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>Honorable mentions</div>
          {top.honorableMentions.map((m) => `${m.genre} (${m.count})`).join(" · ")}
        </div>
      )}
    </ShareShell>
  );
}

export function UnfinishedCard({ bg }: CardProps) {
  const { data } = useUnfinishedShows();
  const rows = (data ?? []) as { item: SimpleItemDto; watchedEpisodes: number; totalEpisodes: number }[];
  if (!rows.length) return null;
  const max = 6;
  return (
    <ShareShell bg={bg} center title="Shows You Started But Haven't Finished" subtitle="Series you began watching but haven't completed yet">
      {rows.slice(0, max).map((r) => (
        <div key={r.item.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <Thumb item={r.item} w={40} h={60} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ ...Ellipsis, fontSize: 15, fontWeight: 600 }}>{r.item.name}</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              {r.watchedEpisodes} of {r.totalEpisodes} episodes
            </div>
            <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.25)", marginTop: 4 }}>
              <div style={{ height: 5, borderRadius: 3, background: "white", width: `${r.totalEpisodes ? Math.max(4, Math.min(100, (r.watchedEpisodes / r.totalEpisodes) * 100)) : 0}%` }} />
            </div>
          </div>
        </div>
      ))}
      <More n={rows.length - max} />
    </ShareShell>
  );
}
