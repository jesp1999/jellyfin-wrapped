import { addDays, format, isAfter, min, parseISO, startOfDay } from "date-fns";
import { getCurrentTimeframe } from "./timeframe";

export type DayMinutes = { date: string; minutes: number };

// One entry for every day of the selected timeframe, oldest first, with 0 minutes on days with no
// plays. "All time" starts on the first day with data. Days after today are left out.
export function daysInTimeframe(data: DayMinutes[]): DayMinutes[] {
  const tf = getCurrentTimeframe();
  const byDate = new Map(data.map((d) => [d.date, d.minutes]));
  let start = startOfDay(tf.startDate);
  if (tf.id === "all-time") {
    const first = data.map((d) => d.date).sort()[0];
    if (!first) return [];
    start = parseISO(first);
  }
  const end = min([startOfDay(tf.endDate), startOfDay(new Date())]);
  const out: DayMinutes[] = [];
  for (let day = start; !isAfter(day, end) && out.length < 6000; day = addDays(day, 1)) {
    const key = format(day, "yyyy-MM-dd");
    out.push({ date: key, minutes: byDate.get(key) ?? 0 });
  }
  return out;
}

// Axis label for a date: the day for short spans, the month and year for long ones.
export const dayLabelFormat = (days: DayMinutes[]): string => (days.length > 120 ? "MMM yyyy" : "MMM d");
