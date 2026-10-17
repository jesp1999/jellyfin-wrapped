import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMovies } from "../../hooks/queries/useMovies";
import { useShows } from "../../hooks/queries/useShows";
import { useFavoriteActors } from "../../hooks/queries/useFavoriteActors";
import { useAudio } from "../../hooks/queries/useAudio";
import { useLiveTvChannels } from "../../hooks/queries/useLiveTvChannels";
import { useUnfinishedShows } from "../../hooks/queries/useUnfinishedShows";
import { useMusicVideos } from "../../hooks/queries/useMusicVideos";
import { useViewingPatterns } from "../../hooks/queries/useViewingPatterns";
import { usePunchCard } from "../../hooks/queries/usePunchCard";
import { useMonthlyShowStats } from "../../hooks/queries/useMonthlyShowStats";
import { useMinutesPlayedPerDay } from "../../hooks/queries/useMinutesPlayedPerDay";
import { useDeviceStats } from "../../hooks/queries/useDeviceStats";
import { useCalendar } from "../../hooks/queries/useCalendar";
import { useTopTen } from "../../hooks/queries/useTopTen";
import { useFirstWatched } from "../../hooks/queries/useFirstWatched";
import { useLibraryKinds } from "../../hooks/queries/useLibraryKinds";
import type { MediaKind } from "@/lib/queries/libraries";
import { Container } from "@radix-ui/themes";
import { motion } from "framer-motion";
import { Title } from "../ui/styled";
import PageContainer from "../PageContainer";

// Pause on 100% so the bar is seen finishing before the next page opens.
const FINISH_DELAY_MS = 600;

export function LoadingPage() {
  const navigate = useNavigate();

  // Everything the pages show is loaded here, so later pages open without waiting.
  // Each step is one query; the bar is the share of them that have finished.
  const libraries = useLibraryKinds();
  const allSteps: { message: string; query: { isPending: boolean }; kinds?: MediaKind[] }[] = [
    { message: "Checking your libraries...", query: libraries },
    { message: "Counting your movies...", query: useMovies(), kinds: ["movies"] },
    { message: "Counting your shows...", query: useShows(), kinds: ["shows"] },
    { message: "Finding your favorite actors...", query: useFavoriteActors(), kinds: ["movies"] },
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
  const steps = allSteps.filter((s) => !s.kinds || !kinds || s.kinds.some((k) => kinds.includes(k)));

  // A query that failed is finished too; its own page shows the error.
  const finished = steps.filter((step) => !step.query.isPending).length;
  const progress = Math.round((finished / steps.length) * 100);
  const allLoaded = finished === steps.length;
  const current = steps.find((step) => step.query.isPending);

  useEffect(() => {
    if (!allLoaded) return;
    const timer = setTimeout(() => {
      void navigate("/TopTen");
    }, FINISH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [allLoaded, navigate]);

  return (
    <PageContainer backgroundColor="var(--purple-8)">
      <Container size="4" style={{ minHeight: "100vh", paddingTop: "20vh", textAlign: "center" }}>
        <div>
          <Title as={motion.h1} style={{ marginBottom: "2rem" }}>
            {current?.message ?? "All done!"}
          </Title>

          <div style={{ maxWidth: "400px", margin: "0 auto" }}>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              style={{
                width: "100%",
                height: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  backgroundColor: "white",
                  width: `${progress}%`,
                  transition: "width 0.4s ease-out",
                }}
              />
            </div>
            <p style={{ color: "white", marginTop: "1rem", fontSize: "1.2rem" }}>
              {progress}%
            </p>
          </div>
        </div>
      </Container>
    </PageContainer>
  );
}
