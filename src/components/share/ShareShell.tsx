import { getWatermark } from "@/lib/watermark";
import { ReactNode, useEffect, useState } from "react";
import { getImageUrlById, SimpleItemDto } from "@/lib/queries";

export const CARD_W = 360;
export const CARD_H = 640;

export type CardProps = { bg: string };

// Fixed 360x640 (9:16). 24px of the page's own gradient is left clear on every edge.
export function ShareShell({
  bg,
  title,
  subtitle,
  center,
  children,
}: {
  bg: string;
  title: string;
  subtitle?: string;
  center?: boolean;
  children: ReactNode;
}) {
  const mark = getWatermark();
  return (
    <div
      style={{
        width: CARD_W,
        height: CARD_H,
        boxSizing: "border-box",
        padding: 24,
        color: "white",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        textShadow: "0 1px 2px rgba(0,0,0,0.25)",
        background: `linear-gradient(180deg, rgba(255,255,255,0.14), rgba(0,0,0,0.28)), ${bg}`,
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", opacity: 0.9 }}>Jellyfin Wrapped</div>
      <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.12, marginTop: 4 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>{subtitle}</div>}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          marginTop: 16,
          display: "flex",
          flexDirection: "column",
          justifyContent: center ? "center" : "flex-start",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
      {mark && <div style={{ fontSize: 11, opacity: 0.75, marginTop: 12 }}>{mark}</div>}
    </div>
  );
}

// A poster or cover. Plain <img>, so the capture does not depend on Radix Avatar or lazy loading.
export function Thumb({ item, w, h, radius = 6 }: { item?: SimpleItemDto; w: number; h: number; radius?: number }) {
  const [src, setSrc] = useState<string>();
  useEffect(() => {
    if (!item) return;
    getImageUrlById(item.imageId ?? item.id ?? "").then(setSrc).catch(() => undefined);
  }, [item]);
  const box = { width: w, height: h, borderRadius: radius, flexShrink: 0 } as const;
  return src ? (
    <img src={src} alt="" style={{ ...box, display: "block", objectFit: "cover" }} />
  ) : (
    <div style={{ ...box, background: "rgba(255,255,255,0.18)" }} />
  );
}

export const Ellipsis = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } as const;

// Horizontal bar with a label above it, for ranked lists.
export function BarRow({ label, value, max, right, big }: { label: string; value: number; max: number; right?: string; big?: boolean }) {
  return (
    <div style={{ marginBottom: big ? 18 : 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: big ? 18 : 14 }}>
        <span style={{ ...Ellipsis, fontWeight: 600, minWidth: 0 }}>{label}</span>
        {right && <span style={{ opacity: 0.9, flexShrink: 0 }}>{right}</span>}
      </div>
      <div style={{ height: big ? 12 : 6, borderRadius: 6, background: "rgba(255,255,255,0.25)", marginTop: big ? 6 : 3 }}>
        <div
          style={{ height: big ? 12 : 6, borderRadius: 6, background: "white", width: `${Math.max(4, max ? (value / max) * 100 : 0)}%` }}
        />
      </div>
    </div>
  );
}

export function More({ n }: { n: number }) {
  return n > 0 ? <div style={{ fontSize: 13, opacity: 0.9, marginTop: 8 }}>and {n.toLocaleString()} more</div> : null;
}

// Posters sized to the number of items: a handful get big posters, a long list gets a dense grid.
export function PosterGrid({ items, cap = 12 }: { items: SimpleItemDto[]; cap?: number }) {
  const n = items.length;
  const cols = n <= 3 ? Math.max(n, 1) : n <= 6 ? 3 : 4;
  const gap = 8;
  const w = Math.min(n <= 3 ? 120 : 200, Math.floor((312 - gap * (cols - 1)) / cols));
  const shown = items.slice(0, cols === 4 ? cap : n <= 6 ? 6 : cap);
  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap, justifyContent: n <= 3 ? "center" : "flex-start" }}>
        {shown.map((i) => (
          <Thumb key={i.id} item={i} w={w} h={Math.round(w * 1.5)} />
        ))}
      </div>
      <More n={n - shown.length} />
    </>
  );
}
