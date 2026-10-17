import { getCurrentUserId, getStartDate, getEndDate, formatDateForSql, formatEndDateForSql, playbackReportingSqlRequest } from "./utils";
import { getItemDtosByIds } from "./items";
import { SimpleItemDto } from "./types";

// Movies ranked by time watched in the timeframe; each play is capped at the runtime.
export const listTopMovies = async (): Promise<{ item: SimpleItemDto; playbackTime: number }[]> => {
  const userId = await getCurrentUserId();
  const data = await playbackReportingSqlRequest(`
SELECT ItemId, PlayDuration FROM PlaybackActivity
WHERE UserId = '${userId}' AND ItemType = 'Movie'
AND DateCreated > '${formatDateForSql(getStartDate())}'
AND DateCreated < '${formatEndDateForSql(getEndDate())}'`);
  const id = data.colums.indexOf("ItemId"), dur = data.colums.indexOf("PlayDuration");
  const items = await getItemDtosByIds([...new Set(data.results.map((r: string[]) => r[id]))]);
  const runtime = new Map(items.map((i) => [i.id, i.durationSeconds]));
  const total = new Map<string, number>();
  for (const r of data.results) {
    const d = Math.max(0, parseInt(r[dur]) || 0);
    total.set(r[id], (total.get(r[id]) ?? 0) + Math.min(d, runtime.get(r[id]) || d));
  }
  return items
    .map((item) => ({ item, playbackTime: total.get(item.id ?? "") ?? 0 }))
    .sort((a, b) => b.playbackTime - a.playbackTime);
};
