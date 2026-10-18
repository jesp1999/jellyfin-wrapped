import { useMovies } from "./queries/useMovies";
import { useShows } from "./queries/useShows";
import { useFavoriteActors } from "./queries/useFavoriteActors";
import { useFavoriteDirectors } from "./queries/useFavoriteDirectors";
import { useAudio } from "./queries/useAudio";
import { useLiveTvChannels } from "./queries/useLiveTvChannels";
import { useUnfinishedShows } from "./queries/useUnfinishedShows";
import { useMusicVideos } from "./queries/useMusicVideos";
import { useViewingPatterns } from "./queries/useViewingPatterns";
import { usePunchCard } from "./queries/usePunchCard";
import { useMonthlyShowStats } from "./queries/useMonthlyShowStats";
import { useMinutesPlayedPerDay } from "./queries/useMinutesPlayedPerDay";
import { useDeviceStats } from "./queries/useDeviceStats";
import { useCalendar } from "./queries/useCalendar";
import { useTopTen } from "./queries/useTopTen";
import { useFirstWatched } from "./queries/useFirstWatched";
import { useLibraryKinds } from "./queries/useLibraryKinds";
import type { MediaKind } from "@/lib/queries/libraries";

// Every query the pages read, one step each, minus the ones for libraries the user cannot see.
// Using it loads whatever is not cached yet.
export function useLoadingSteps() {
  const libraries = useLibraryKinds();
  const allSteps: { message: string; query: { isPending: boolean }; kinds?: MediaKind[] }[] = [
    { message: "Checking your libraries...", query: libraries },
    { message: "Counting your movies...", query: useMovies(), kinds: ["movies"] },
    { message: "Counting your shows...", query: useShows(), kinds: ["shows"] },
    { message: "Finding your favorite actors...", query: useFavoriteActors(), kinds: ["movies"] },
    { message: "Finding your favorite directors...", query: useFavoriteDirectors(), kinds: ["movies"] },
    { message: "Listening to your music...", query: useAudio(), kinds: ["music"] },
    { message: "Checking live TV...", query: useLiveTvChannels(), kinds: ["liveTv"] },
    { message: "Finding unfinished shows...", query: useUnfinishedShows(), kinds: ["shows"] },
    { message: "Rolling the music videos...", query: useMusicVideos(), kinds: ["musicVideos"] },
    { message: "Reading your viewing patterns...", query: useViewingPatterns() },
    { message: "Punching your punch card...", query: usePunchCard() },
    { message: "Tallying up the episodes...", query: useMonthlyShowStats() },
    { message: "Adding up your watch time...", query: useMinutesPlayedPerDay() },
    { message: "Checking your devices...", query: useDeviceStats() },
    { message: "Filling in the calendar...", query: useCalendar() },
    { message: "Picking your top picks...", query: useTopTen() },
    { message: "Finding your first watch...", query: useFirstWatched() },
  ];
  const kinds = libraries.data;
  return allSteps.filter((s) => !s.kinds || !kinds || s.kinds.some((k) => kinds.includes(k)));
}
