import { useQuery } from "@tanstack/react-query";
import { getMinutesPlayedPerDay } from "@/lib/queries";
import { getCurrentTimeframe } from "@/lib/timeframe";

export function useMinutesPlayedPerDay() {
  return useQuery({
    queryKey: ["minutesPlayedPerDay", getCurrentTimeframe().id],
    queryFn: getMinutesPlayedPerDay,
  });
}
