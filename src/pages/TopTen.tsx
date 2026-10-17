import { useTopTen } from "@/hooks/queries/useTopTen";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ContentImage } from "@/components/ContentImage";
import { RankBadge } from "@/components/RankBadge";
import { formatWatchTime } from "@/lib/time-helpers";
import { SimpleItemDto } from "@/lib/queries";
import PageContainer from "@/components/PageContainer";
import { Container, Grid } from "@radix-ui/themes";
import { motion } from "framer-motion";
import { Title } from "@/components/ui/styled";
import { getCurrentTimeframe } from "@/lib/timeframe";

export const TopTen = () => {
  const timeframe = getCurrentTimeframe();
  const { data, isLoading, error } = useTopTen();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading top ten</div>;
  if (!data) return null;

  return (
    <PageContainer backgroundColor="var(--purple-8)" nextPage="/first-watched" previousPage="/loading">
      <Container size="4" p="4">
        <Grid gap="6">
          <div style={{ textAlign: "center" }}>
            <Title as={motion.h1}>Your Top 10</Title>
            <p style={{ fontSize: "1.125rem", color: "white", marginTop: "0.5rem" }}>{timeframe.description}</p>
          </div>

          <Grid columns={{ initial: "1", md: data.movies.length && data.shows.length ? "2" : "1" }} gap="6">
            {data.movies.length > 0 && (
            <div>
              <h2 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1.5rem", color: "white" }}>
                Top Movies
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {data.movies.map((movie: { item: SimpleItemDto; playbackTime: number }, index: number) => (
                  <div
                    key={movie.item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                      padding: "1rem",
                    }}
                  >
                    <RankBadge rank={index + 1} />
                    <ContentImage item={movie.item} />
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontWeight: 600, fontSize: "1.125rem", color: "white" }}>
                        {movie.item.name}
                      </h3>
                      <p style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.7)" }}>
                        {formatWatchTime(movie.playbackTime / 60)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>)}

            {data.shows.length > 0 && (
            <div>
              <h2 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1.5rem", color: "white" }}>
                Top Shows
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {data.shows.map(
                  (
                    show: {
                      item: SimpleItemDto;
                      episodeCount: number;
                      playbackTime: number;
                    },
                    index: number
                  ) => (
                    <div
                      key={show.item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                        padding: "1rem",
                      }}
                    >
                      <RankBadge rank={index + 1} />
                      <ContentImage item={show.item} />
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 600, fontSize: "1.125rem", color: "white" }}>
                          {show.item.name}
                        </h3>
                        <p style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.7)" }}>
                          {show.episodeCount} episodes •{" "}
                          {formatWatchTime(show.playbackTime / 60)}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>)}
          </Grid>
        </Grid>
      </Container>
    </PageContainer>
  );
};
