import { useQuery } from "@tanstack/react-query";
import { getEarliestPlayDate } from "@/lib/queries/stats";

export const useEarliestPlay = () =>
  useQuery({ queryKey: ["earliestPlay"], queryFn: getEarliestPlayDate, retry: false });
