import { addMonths, endOfDay, endOfMonth, startOfDay, startOfMonth } from "date-fns";

// A month counts only when all of it lies inside the timeframe.
export function isWholeMonth(month: Date, start: Date, end: Date): boolean {
  return startOfMonth(month) >= startOfDay(start) && endOfMonth(month) <= endOfDay(end);
}

export function hasWholeMonth(start: Date, end: Date): boolean {
  const s = startOfDay(start);
  const first = s.getDate() === 1 ? s : startOfMonth(addMonths(s, 1));
  return endOfMonth(first) <= endOfDay(end);
}
