import { useQuery } from "@tanstack/react-query";
import { listWatchedOnDate } from "@/lib/queries";

export function useWatchedOnDate(date: Date | null) {
  return useQuery({
    queryKey: ["watchedOnDate", date?.toISOString() ?? null],
    queryFn: () => listWatchedOnDate(date as Date),
    enabled: !!date,
  });
}
