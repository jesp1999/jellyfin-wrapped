import { getCurrentTimeframe } from "@/lib/timeframe";
import { useQuery } from "@tanstack/react-query";
import { getViewingPatterns } from "@/lib/queries";

export function useViewingPatterns() {
  return useQuery({
    queryKey: ["viewingPatterns", getCurrentTimeframe().id],
    queryFn: getViewingPatterns,
  });
}
