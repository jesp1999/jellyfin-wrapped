import { getWatermark } from "@/lib/watermark";
import { formatWatchTime } from "@/lib/time-helpers";
import type { SimpleItemDto } from "@/lib/queries";

type Row = { item: SimpleItemDto; playbackTime?: number };

const Section = ({ heading, rows }: { heading: string; rows: Row[] }) =>
  rows.length === 0 ? null : (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
        {heading}
      </div>
      {rows.slice(0, 10).map((r, i) => (
        <div key={r.item.id ?? i} style={{ display: "flex", gap: 8, fontSize: 12, lineHeight: "20px" }}>
          <span style={{ width: 18, textAlign: "right", opacity: 0.7 }}>{i + 1}</span>
          <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {r.item.name}
          </span>
          {r.playbackTime ? <span style={{ opacity: 0.8 }}>{formatWatchTime(r.playbackTime / 60)}</span> : null}
        </div>
      ))}
    </div>
  );

// 360x640 card, rendered off screen and captured when the Share button is used.
export function TopTenShareCard({ movies, shows, subtitle }: { movies: Row[]; shows: Row[]; subtitle: string }) {
  return (
    <div
      style={{
        width: 360,
        height: 640,
        boxSizing: "border-box",
        padding: 24,
        color: "white",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(160deg, #2D00F7 0%, #6A00FF 55%, #B100E8 100%)",
      }}
    >
      <div style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", opacity: 0.85 }}>Jellyfin Wrapped</div>
      <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.1, marginTop: 4 }}>Your Top 10</div>
      <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>{subtitle}</div>
      <Section heading="Movies" rows={movies} />
      <Section heading="Shows" rows={shows} />
      {getWatermark() && <div style={{ marginTop: "auto", fontSize: 12, opacity: 0.7 }}>{getWatermark()}</div>}
    </div>
  );
}
