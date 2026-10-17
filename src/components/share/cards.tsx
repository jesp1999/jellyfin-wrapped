import { useMemo } from "react";
import { addDays, differenceInCalendarDays, format, parseISO, startOfWeek, subWeeks } from "date-fns";
import { useFirstWatched } from "@/hooks/queries/useFirstWatched";
import { useMovies } from "@/hooks/queries/useMovies";
import { useShows } from "@/hooks/queries/useShows";
import { useAudio } from "@/hooks/queries/useAudio";
import { useMusicVideos } from "@/hooks/queries/useMusicVideos";
import { useLiveTvChannels } from "@/hooks/queries/useLiveTvChannels";
import { useWatchedOnDate } from "@/hooks/queries/useWatchedOnDate";
import { useMonthlyShowStats } from "@/hooks/queries/useMonthlyShowStats";
import { useMinutesPlayedPerDay } from "@/hooks/queries/useMinutesPlayedPerDay";
import { useViewingPatterns } from "@/hooks/queries/useViewingPatterns";
import { useDeviceStats } from "@/hooks/queries/useDeviceStats";
import { useCalendar } from "@/hooks/queries/useCalendar";
import { getTopRatedContent } from "@/lib/rating-helpers";
import { getHolidayDatesIn } from "@/lib/holiday-helpers";
import { getCurrentTimeframe } from "@/lib/timeframe";
import { getCachedHiddenIds } from "@/lib/cache";
import { formatDuration } from "@/lib/utils";
import type { SimpleItemDto } from "@/lib/queries";
import { BarRow, CardProps, Ellipsis, ShareShell, Thumb } from "./ShareShell";

const hours = (minutes: number) => `${Math.round((minutes / 60) * 10) / 10}h`;
const plural = (n: number, one: string, many: string) => `${n.toLocaleString()} ${n === 1 ? one : many}`;
const centered = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  gap: 10,
} as const;

// ---------------------------------------------------------------- first watched, oldest movie / show
function Single({ bg, title, subtitle, item, lines }: CardProps & { title: string; subtitle: string; item: SimpleItemDto; lines: string[] }) {
  return (
    <ShareShell bg={bg} title={title} subtitle={subtitle}>
      <div style={centered}>
        <Thumb item={item} w={170} h={255} radius={12} />
        <div style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.2 }}>{item.name}</div>
        {lines.map((l) => (
          <div key={l} style={{ fontSize: 13, opacity: 0.92 }}>
            {l}
          </div>
        ))}
      </div>
    </ShareShell>
  );
}

export function FirstWatchedCard({ bg }: CardProps) {
  const { data: first } = useFirstWatched();
  if (!first) return null;
  const when = format(first.watchedAt, "MMMM d, yyyy");
  return (
    <Single
      bg={bg}
      title="Where It Started"
      subtitle={`The first ${first.kind === "movie" ? "movie" : "show"} you watched`}
      item={first.item}
      lines={[first.kind === "show" && first.episodeName ? `${when} · ${first.episodeName}` : when]}
    />
  );
}

export function OldestMovieCard({ bg }: CardProps) {
  const { data: movies } = useMovies();
  const movie = [...(movies ?? [])].sort(
    (a: { date?: string | null }, b: { date?: string | null }) =>
      new Date(a.date ?? new Date()).getTime() - new Date(b.date ?? new Date()).getTime()
  )[0];
  if (!movie) return null;
  return (
    <Single
      bg={bg}
      title="Oldest Movie You Watched"
      subtitle="The most vintage film in your history"
      item={movie}
      lines={[`Released in ${movie.productionYear}`]}
    />
  );
}

export function OldestShowCard({ bg }: CardProps) {
  const { data: shows } = useShows();
  const show = [...(shows ?? [])].sort(
    (a: { item: SimpleItemDto }, b: { item: SimpleItemDto }) =>
      new Date(a.item.date ?? new Date()).getTime() - new Date(b.item.date ?? new Date()).getTime()
  )[0];
  if (!show) return null;
  return (
    <Single
      bg={bg}
      title="Oldest Show You Watched"
      subtitle="The most classic series you enjoyed"
      item={show.item}
      lines={[`Released in ${show.item.productionYear}`, ...(show.episodeCount ? [plural(show.episodeCount, "episode", "episodes") + " watched"] : [])]}
    />
  );
}

// ---------------------------------------------------------------- songs and music videos
function ItemList({ bg, title, subtitle, items, square }: CardProps & { title: string; subtitle: string; items: SimpleItemDto[]; square: boolean }) {
  const max = square ? 9 : 6;
  return (
    <ShareShell bg={bg} center title={title} subtitle={subtitle}>
      {items.slice(0, max).map((item) => (
        <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <Thumb item={item} w={square ? 40 : 40} h={square ? 40 : 60} />
          <div style={{ minWidth: 0 }}>
            <div style={{ ...Ellipsis, fontSize: 15, fontWeight: 600 }}>{item.name}</div>
            {item.artist || item.productionYear ? (
              <div style={{ ...Ellipsis, fontSize: 12, opacity: 0.85 }}>{item.artist || item.productionYear}</div>
            ) : null}
          </div>
        </div>
      ))}
      {items.length > max && <div style={{ fontSize: 13, opacity: 0.9 }}>and {(items.length - max).toLocaleString()} more</div>}
    </ShareShell>
  );
}

export function AudioCard({ bg }: CardProps) {
  const { data } = useAudio();
  const items = (data ?? []) as SimpleItemDto[];
  if (!items.length) return null;
  return <ItemList bg={bg} title={`You Listened to ${plural(items.length, "Song", "Songs")}`} subtitle="Your music listening history" items={items} square />;
}

export function MusicVideosCard({ bg }: CardProps) {
  const { data } = useMusicVideos();
  const items = (data ?? []) as SimpleItemDto[];
  if (!items.length) return null;
  return <ItemList bg={bg} title={`You Watched ${plural(items.length, "Music Video", "Music Videos")}`} subtitle="Your music video collection" items={items} square={false} />;
}

// ---------------------------------------------------------------- live tv
export function LiveTvCard({ bg }: CardProps) {
  const { data } = useLiveTvChannels();
  const channels = [...(data ?? [])].sort((a: { duration: number }, b: { duration: number }) => b.duration - a.duration) as {
    channelName: string;
    duration: number;
  }[];
  if (!channels.length) return null;
  const total = channels.reduce((s, c) => s + c.duration, 0);
  return (
    <ShareShell bg={bg} title={`You Watched ${plural(channels.length, "Live TV Channel", "Live TV Channels")}`} subtitle="Your live television viewing">
      <div style={{ margin: "4px 0 22px" }}>
        <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.1 }}>{formatDuration(total)}</div>
        <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>of live TV in total</div>
      </div>
      {channels.slice(0, 8).map((c) => (
        <BarRow key={c.channelName} big={channels.length <= 5} label={c.channelName} value={c.duration} max={channels[0].duration} right={formatDuration(c.duration)} />
      ))}
    </ShareShell>
  );
}

// ---------------------------------------------------------------- critically acclaimed
export function CriticalCard({ bg }: CardProps) {
  const { data: movies } = useMovies();
  const { data: shows } = useShows();
  const top = getTopRatedContent(movies ?? [], shows ?? []);
  if (!top.length) return null;
  return (
    <ShareShell bg={bg} center title="Critically Acclaimed" subtitle="Highly-rated titles you watched">
      {top.slice(0, 5).map((c) => (
        <div key={c.item.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <Thumb item={c.item} w={48} h={72} />
          <div style={{ minWidth: 0 }}>
            <div style={{ ...Ellipsis, fontSize: 16, fontWeight: 700 }}>{c.item.name}</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              {c.type === "movie" ? "Movie" : "TV Show"}
              {c.item.productionYear ? ` · ${c.item.productionYear}` : ""}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>★ {c.item.communityRating?.toFixed(1)} / 10</div>
          </div>
        </div>
      ))}
    </ShareShell>
  );
}

// ---------------------------------------------------------------- holidays
export function HolidayCard({ bg }: CardProps) {
  // Same dates as the page, so these are cache hits.
  const timeframe = getCurrentTimeframe();
  const dates = useMemo(() => getHolidayDatesIn(timeframe.startDate, timeframe.endDate), [timeframe]);
  const hidden = getCachedHiddenIds();
  const keep = (items?: { id?: string }[]) => (items ?? []).filter((i) => !hidden.includes(i.id ?? "")) as SimpleItemDto[];
  const sections = [
    { label: "Christmas", items: keep(useWatchedOnDate(dates.christmas).data) },
    { label: "Christmas Eve", items: keep(useWatchedOnDate(dates.christmasEve).data) },
    { label: "Halloween", items: keep(useWatchedOnDate(dates.halloween).data) },
    { label: "Valentine's Day", items: keep(useWatchedOnDate(dates.valentines).data) },
  ].filter((s) => s.items.length);
  if (!sections.length) return null;
  // Posters grow when there are few of them, within the width and height of the card.
  const perRow = Math.min(5, Math.max(...sections.map((s) => s.items.length)));
  const w = Math.max(
    40,
    Math.min(110, Math.floor((312 - 8 * (perRow - 1)) / perRow), Math.floor((440 / sections.length - 34) / 1.5))
  );
  return (
    <ShareShell bg={bg} center title="What You Watched on Holidays" subtitle="Your viewing on special occasions">
      {sections.map((s) => (
        <div key={s.label} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, marginBottom: 5 }}>
            <span>{s.label}</span>
            {s.items.length > 5 && <span style={{ fontWeight: 400, opacity: 0.9 }}>and {s.items.length - 5} more</span>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {s.items.slice(0, 5).map((i) => (
              <Thumb key={i.id} item={i} w={w} h={Math.round(w * 1.5)} />
            ))}
          </div>
        </div>
      ))}
    </ShareShell>
  );
}

// ---------------------------------------------------------------- watch activity
export function MinutesCard({ bg }: CardProps) {
  const { data: days } = useMinutesPlayedPerDay();
  const { data: patterns } = useViewingPatterns();
  const series = ((days ?? []) as { date: string; minutes: number }[]).slice().sort((a, b) => a.date.localeCompare(b.date));
  if (!series.length) return null;
  const total = series.reduce((s, d) => s + d.minutes, 0);
  const max = Math.max(...series.map((d) => d.minutes), 1);
  const W = 312;
  const H = 64;
  const pts = series.map((d, i) => `${series.length > 1 ? (i / (series.length - 1)) * W : 0},${H - (d.minutes / max) * H}`);

  // Date axis: first, middle and last day. Short spans get the day, long spans the month and year.
  const first = parseISO(series[0].date);
  const last = parseISO(series[series.length - 1].date);
  const dateFormat = differenceInCalendarDays(last, first) > 120 ? "MMM yyyy" : "MMM d";
  const ticks = [first, parseISO(series[Math.floor((series.length - 1) / 2)].date), last].map((d) => format(d, dateFormat));

  const dow = (patterns?.dayOfWeek ?? []) as { day: number; minutes: number }[];
  const dowMax = Math.max(...dow.map((d) => d.minutes), 1);
  const tod = (patterns?.timeOfDay ?? []) as { hour: number; minutes: number }[];
  const todMax = Math.max(...tod.map((d) => d.minutes), 1);
  const busiestHour = tod.reduce((best, d) => (d.minutes > best.minutes ? d : best), { hour: 0, minutes: -1 });
  const label = { fontSize: 12, opacity: 0.9 } as const;
  const axis = { display: "flex", justifyContent: "space-between", fontSize: 10, opacity: 0.85, marginTop: 3 } as const;
  return (
    <ShareShell bg={bg} title="Your Viewing Activity" subtitle="When you watch the most">
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1 }}>{Math.floor(total / 60).toLocaleString()}</div>
        <div style={{ fontSize: 14, opacity: 0.9 }}>hours watched</div>
      </div>

      <div style={{ ...label, display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span>Daily activity</span>
        <span>peak day {hours(max)}</span>
      </div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <polygon points={`0,${H} ${pts.join(" ")} ${W},${H}`} fill="rgba(255,255,255,0.28)" />
        <polyline points={pts.join(" ")} fill="none" stroke="white" strokeWidth="2" />
      </svg>
      <div style={axis}>
        {ticks.map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>

      {tod.length > 0 && (
        <>
          <div style={{ ...label, margin: "14px 0 4px" }}>Time of day</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 44 }}>
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} style={{ flex: 1, height: Math.max(2, ((tod.find((d) => d.hour === h)?.minutes ?? 0) / todMax) * 44), borderRadius: 2, background: "white" }} />
            ))}
          </div>
          <div style={{ position: "relative", height: 14, marginTop: 3, fontSize: 10, opacity: 0.85 }}>
            {[0, 6, 12, 18].map((h) => (
              <span key={h} style={{ position: "absolute", left: `${(h / 24) * 100}%` }}>
                {format(new Date(2000, 0, 1, h), "h a")}
              </span>
            ))}
          </div>
        </>
      )}

      {dow.length > 0 && (
        <>
          <div style={{ ...label, margin: "10px 0 4px" }}>Day of week</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 54 }}>
            {["S", "M", "T", "W", "T", "F", "S"].map((l, i) => {
              const m = dow.find((d) => d.day === i)?.minutes ?? 0;
              return (
                <div key={i} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ height: Math.max(3, (m / dowMax) * 38), borderRadius: 3, background: "white" }} />
                  <div style={{ fontSize: 10, marginTop: 3, opacity: 0.9 }}>{l}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
      {busiestHour.minutes >= 0 && (
        <div style={{ fontSize: 13, marginTop: 10 }}>Most active around {format(new Date(2000, 0, 1, busiestHour.hour), "h a")}</div>
      )}
    </ShareShell>
  );
}

// ---------------------------------------------------------------- show of the month
export function ShowOfMonthCard({ bg }: CardProps) {
  const { data } = useMonthlyShowStats();
  const stats = ((data ?? []) as { month: Date; topShow: { item: SimpleItemDto; watchTimeMinutes: number } }[]).slice(-12);
  if (!stats.length) return null;
  return (
    <ShareShell bg={bg} title="Your Top Show Each Month" subtitle="The show you watched most in each month">
      {stats.map((s) => (
        <div key={s.month.toISOString()} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 34, fontSize: 14, fontWeight: 800 }}>{format(s.month, "MMM")}</div>
          <Thumb item={s.topShow.item} w={22} h={33} radius={3} />
          <div style={{ ...Ellipsis, flex: 1, minWidth: 0, fontSize: 13 }}>{s.topShow.item.name}</div>
          <div style={{ fontSize: 12, opacity: 0.9 }}>{hours(s.topShow.watchTimeMinutes)}</div>
        </div>
      ))}
    </ShareShell>
  );
}

// ---------------------------------------------------------------- devices
function Usage({ label, rows }: { label: string; rows: { name: string; minutes: number }[] }) {
  const sorted = [...rows].sort((a, b) => b.minutes - a.minutes).slice(0, 4);
  const total = rows.reduce((s, r) => s + r.minutes, 0) || 1;
  if (!sorted.length) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", opacity: 0.9, marginBottom: 6 }}>{label}</div>
      {sorted.map((r) => (
        <BarRow key={r.name} label={r.name} value={r.minutes} max={sorted[0].minutes} right={`${Math.round((r.minutes / total) * 100)}%`} />
      ))}
    </div>
  );
}

export function DeviceCard({ bg }: CardProps) {
  const { data } = useDeviceStats();
  if (!data) return null;
  return (
    <ShareShell bg={bg} title="Your Viewing Devices" subtitle="Where you watch">
      <Usage label="Devices" rows={data.deviceUsage.map((d: { deviceName: string; minutes: number }) => ({ name: d.deviceName, minutes: d.minutes }))} />
      <Usage label="Apps" rows={data.browserUsage.map((d: { browserName: string; minutes: number }) => ({ name: d.browserName, minutes: d.minutes }))} />
      <Usage label="Systems" rows={data.osUsage.map((d: { osName: string; minutes: number }) => ({ name: d.osName, minutes: d.minutes }))} />
    </ShareShell>
  );
}

// ---------------------------------------------------------------- activity calendar
export function CalendarCard({ bg }: CardProps) {
  const { data } = useCalendar();
  const days = ((data ?? []) as { value: number; day: string }[]).filter((d) => d.value > 0).sort((a, b) => a.day.localeCompare(b.day));
  if (!days.length) return null;
  const byDay = new Map(days.map((d) => [d.day, d.value]));
  const sorted = days.map((d) => d.value).sort((a, b) => a - b);
  const level = (v: number) => (v <= 0 ? 0 : v <= sorted[Math.floor(sorted.length * 0.25)] ? 1 : v <= sorted[Math.floor(sorted.length * 0.5)] ? 2 : v <= sorted[Math.floor(sorted.length * 0.75)] ? 3 : 4);
  const alpha = [0.14, 0.38, 0.58, 0.8, 1];

  const WEEKS = 26;
  const start = startOfWeek(subWeeks(new Date(), WEEKS - 1));
  const cells = Array.from({ length: WEEKS * 7 }, (_, i) => {
    const date = addDays(start, i);
    return { key: format(date, "yyyy-MM-dd"), future: date > new Date() };
  });

  // A month label above the first column of each month.
  const months: { col: number; text: string }[] = [];
  for (let c = 0; c < WEEKS; c++) {
    const d = addDays(start, c * 7);
    if (c === 0 || addDays(start, (c - 1) * 7).getMonth() !== d.getMonth()) months.push({ col: c, text: format(d, "MMM") });
  }
  if (months.length > 1 && months[1].col < 3) months.shift(); // a sliver of a month would collide with the next label

  let streak = 1;
  let best = 1;
  for (let i = 1; i < days.length; i++) {
    streak = differenceInCalendarDays(new Date(days[i].day), new Date(days[i - 1].day)) === 1 ? streak + 1 : 1;
    best = Math.max(best, streak);
  }
  const busiest = days.reduce((a, b) => (b.value > a.value ? b : a));
  return (
    <ShareShell bg={bg} title="Your Viewing Activity" subtitle="The last 26 weeks">
      <div style={{ position: "relative", height: 14, width: WEEKS * 12 }}>
        {months.map((m) => (
          <span key={m.col} style={{ position: "absolute", left: m.col * 12, fontSize: 10, opacity: 0.9 }}>
            {m.text}
          </span>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateRows: "repeat(7, 10px)", gridAutoFlow: "column", gridAutoColumns: "10px", gap: 2 }}>
        {cells.map((c) => (
          <div
            key={c.key}
            style={{ width: 10, height: 10, borderRadius: 2, background: c.future ? "transparent" : `rgba(255,255,255,${alpha[level(byDay.get(c.key) ?? 0)]})` }}
          />
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 8, fontSize: 10, opacity: 0.9 }}>
        <span style={{ marginRight: 3 }}>Less</span>
        {alpha.map((a) => (
          <div key={a} style={{ width: 10, height: 10, borderRadius: 2, background: `rgba(255,255,255,${a})` }} />
        ))}
        <span style={{ marginLeft: 3 }}>More</span>
      </div>
      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1 }}>{days.length.toLocaleString()}</div>
        <div style={{ fontSize: 14, opacity: 0.9 }}>days you watched something</div>
      </div>
      <div style={{ display: "flex", gap: 24, marginTop: 24 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{best}</div>
          <div style={{ fontSize: 12, opacity: 0.9 }}>day longest streak</div>
        </div>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{format(new Date(busiest.day), "MMM d")}</div>
          <div style={{ fontSize: 12, opacity: 0.9 }}>most active day</div>
        </div>
      </div>
    </ShareShell>
  );
}
