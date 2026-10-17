import { useQuery } from "@tanstack/react-query";
import { getMonthlyShowStats } from "@/lib/queries";
import { isWholeMonth } from "@/lib/months";
import { getCurrentTimeframe } from "@/lib/timeframe";

export function useMonthlyShowStats() {
  return useQuery({
    queryKey: ["monthlyShowStats"],
    queryFn: getMonthlyShowStats,
    // A month that only part of the timeframe covers would look smaller than it was.
    select: (months) => {
      const { startDate, endDate } = getCurrentTimeframe();
      return months.filter((m) => isWholeMonth(m.month, startDate, endDate));
    },
  });
}
