import { useLoadingSteps } from "@/hooks/useLoadingSteps";

// Renders nothing. While mounted it loads every query the pages read, so after the timeframe
// changes the other pages are warm by the time they are opened.
export function Warmup() {
  useLoadingSteps();
  return null;
}
