import { useEffect, useRef, useState } from "react";
import { Container } from "@radix-ui/themes";
import PageContainer from "@/components/PageContainer";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useTopTen } from "@/hooks/queries/useTopTen";
import { useMinutesPlayedPerDay } from "@/hooks/queries/useMinutesPlayedPerDay";
import { useMovies } from "@/hooks/queries/useMovies";
import { useShows } from "@/hooks/queries/useShows";
import { useAudio } from "@/hooks/queries/useAudio";
import { getCurrentTimeframe } from "@/lib/timeframe";
import { cardGradient, useHighContrast } from "@/lib/contrast";
import { getImageUrlById, SimpleItemDto } from "@/lib/queries";

// Plain <img>, not Radix Avatar or the lazy-loaded poster, so the card is complete when captured.
function Poster({ item, label }: { item?: SimpleItemDto; label: string }) {
  const [src, setSrc] = useState<string>();
  useEffect(() => {
    if (!item) return;
    getImageUrlById(item.imageId ?? item.id ?? "").then(setSrc).catch(console.error);
  }, [item]);
  if (!item) return <div style={{ flex: 1 }} />;
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", opacity: 0.8, marginBottom: 6 }}>
        {label}
      </div>
      {src ? (
        <img
          src={src}
          alt={item.name ?? label}
          style={{ display: "block", width: "100%", aspectRatio: "2/3", objectFit: "cover", borderRadius: 12 }}
        />
      ) : (
        <div style={{ width: "100%", aspectRatio: "2/3", borderRadius: 12, background: "rgba(255,255,255,0.15)" }} />
      )}
      <div style={{ fontSize: 14, fontWeight: 600, marginTop: 8, lineHeight: 1.25 }}>{item.name}</div>
    </div>
  );
}

const Stat = ({ value, label }: { value: number; label: string }) =>
  value > 0 ? (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 26, fontWeight: 800 }}>{value.toLocaleString()}</div>
      <div style={{ fontSize: 12, opacity: 0.85 }}>{label}</div>
    </div>
  ) : null;

export default function SummaryPage() {
  const cardRef = useRef<HTMLDivElement>(null);
  const high = useHighContrast();
  const timeframe = getCurrentTimeframe();
  const top = useTopTen();
  const minutes = useMinutesPlayedPerDay();
  const movies = useMovies();
  const shows = useShows();
  const audio = useAudio();

  if (top.isLoading || minutes.isLoading) return <LoadingSpinner />;

  const totalMinutes = ((minutes.data ?? []) as { minutes: number }[]).reduce((sum, d) => sum + d.minutes, 0);
  const hours = Math.round(totalMinutes / 60);
  const topMovie = top.data?.movies[0]?.item;
  const topShow = top.data?.shows[0]?.item;

  return (
    <PageContainer backgroundColor="var(--indigo-8)" shareRef={cardRef}>
      <Container size="1" p="4">
        <h1 className="wrapped-sr-only">Your summary: {timeframe.name}</h1>
        <div
          ref={cardRef}
          data-share-contrast={high ? "high" : undefined}
          style={{
            width: "100%",
            maxWidth: 360,
            margin: "0 auto",
            aspectRatio: "9 / 16",
            boxSizing: "border-box",
            padding: 24,
            borderRadius: 24,
            color: "white",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: cardGradient(high),
          }}
        >
          <div>
            <div style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", opacity: 0.85 }}>
              Jellyfin Wrapped
            </div>
            <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.1, marginTop: 4 }}>{timeframe.name}</div>
          </div>

          {hours > 0 && (
            <div>
              <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1 }}>{hours.toLocaleString()}</div>
              <div style={{ fontSize: 16, opacity: 0.9 }}>hours watched</div>
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <Poster item={topMovie} label="Top movie" />
            <Poster item={topShow} label="Top show" />
          </div>

          <div style={{ display: "flex", justifyContent: "space-around" }}>
            <Stat value={movies.data?.length ?? 0} label="movies" />
            <Stat value={shows.data?.length ?? 0} label="shows" />
            <Stat value={audio.data?.length ?? 0} label="songs" />
          </div>
        </div>
      </Container>
    </PageContainer>
  );
}
