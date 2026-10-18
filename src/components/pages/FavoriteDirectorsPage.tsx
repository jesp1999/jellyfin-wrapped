import EmptyState from "../EmptyState";
import { Container, Grid } from "@radix-ui/themes";
import { motion } from "framer-motion";
import { useErrorBoundary } from "react-error-boundary";
import { useFavoriteDirectors } from "@/hooks/queries/useFavoriteDirectors";
import { LoadingSpinner } from "../LoadingSpinner";
import { ActorCard } from "./MoviesReviewPage/ActorCard";
import { Title } from "../ui/styled";
import { itemVariants } from "@/lib/styled-variants";
import PageContainer from "../PageContainer";

const COLOR = "var(--jade-8)";
const NEXT_PAGE = "/genres";
const PREVIOUS_PAGE = "/actors";

export default function FavoriteDirectorsPage() {
  const { showBoundary } = useErrorBoundary();
  const { data: directors, isLoading, error } = useFavoriteDirectors();

  if (error) {
    showBoundary(error);
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!directors?.length) {
    return (
      <EmptyState
        title="No Favorite Directors Yet"
        backgroundColor={COLOR}
        nextPage={NEXT_PAGE}
        previousPage={PREVIOUS_PAGE}
      />
    );
  }

  return (
    <PageContainer backgroundColor={COLOR} nextPage={NEXT_PAGE} previousPage={PREVIOUS_PAGE}>
      <Container size="4" p="4">
        <Grid gap="6">
          <div style={{ textAlign: "center" }}>
            <Title as={motion.h1} variants={itemVariants}>
              Your Favorite Directors
            </Title>
            <p style={{ fontSize: "1.125rem", color: "rgba(255, 255, 255, 0.92)", marginTop: "0.5rem" }}>
              The directors behind the most of what you watched
            </p>
          </div>

          <Grid columns={{ initial: "2", sm: "3", md: "4", lg: "5" }} gap="4">
            {directors.slice(0, 20).map((director) => (
              <ActorCard
                key={director.name}
                name={director.name}
                count={director.count}
                details={director.details}
                seenInMovies={director.seenInMovies}
                seenInShows={director.seenInShows}
                blurb={`You watched ${director.count} titles directed by ${director.name}`}
              />
            ))}
          </Grid>
        </Grid>
      </Container>
    </PageContainer>
  );
}
