import { ResponsiveCalendar } from "@nivo/calendar";
import { Card } from "@/components/ui/card";
import { Container } from "@radix-ui/themes";
import { useErrorBoundary } from "react-error-boundary";
import { format, parseISO } from "date-fns";
import { getCurrentTimeframe } from "@/lib/timeframe";
import { Title } from "../ui/styled";
import { motion } from "framer-motion";
import { useCalendar } from "@/hooks/queries/useCalendar";
import { LoadingSpinner } from "../LoadingSpinner";
import { ChartAlt } from "../charts/ChartAlt";
import { useIsMobile } from "@/hooks/useIsMobile";
import PageContainer from "../PageContainer";

const NEXT_PAGE = "/";

export default function ActivityCalendarPage() {
  const { showBoundary } = useErrorBoundary();
  const isMobile = useIsMobile();
  const { data, isLoading, error } = useCalendar();

  if (error) {
    showBoundary(error);
  }

  if (isLoading) {
    return <LoadingSpinner backgroundColor="var(--gray-8)" />;
  }

  const tf = getCurrentTimeframe();
  const first = data?.[0]?.day; // rows come back oldest first
  const start = tf.id === "all-time" ? (first ? parseISO(first) : tf.endDate) : tf.startDate;
  const fromDate = format(start, "yyyy-MM-dd");
  const toDate = format(getCurrentTimeframe().endDate, "yyyy-MM-dd");

  return (
    <PageContainer backgroundColor="var(--indigo-8)" nextPage={NEXT_PAGE} previousPage="/device-stats">
      <Container size="4" p="4">
        <Card className="p-6">
          <Title as={motion.h1} className="text-2xl font-bold mb-4">
            Your Viewing Activity
          </Title>
          <p style={{ fontSize: "1.125rem", color: "rgba(255, 255, 255, 0.92)", marginBottom: "1rem" }}>
            A calendar view of your daily viewing patterns
          </p>
          <div aria-hidden="true" style={{ height: (isMobile ? 150 : 250) * (Number(toDate.slice(0, 4)) - Number(fromDate.slice(0, 4)) + 1) }}>
            <ResponsiveCalendar
              data={data ?? []}
              from={fromDate}
              to={toDate}
              emptyColor="#eeeeee"
              colors={["#61cdbb", "#97e3d5", "#e8c1a0", "#f47560"]}
              margin={
                isMobile
                  ? { top: 20, right: 20, bottom: 20, left: 20 }
                  : { top: 40, right: 40, bottom: 40, left: 40 }
              }
              yearSpacing={40}
              monthBorderColor="#ffffff"
              dayBorderWidth={2}
              dayBorderColor="#ffffff"
              theme={{ text: { fill: "#ffffff" } }}
            />
          </div>
          <ChartAlt
            caption={(() => {
              const watched = (data ?? []).filter((d: { value: number }) => d.value > 0);
              const busiest = watched.reduce((a: { value: number; day: string }, b: { value: number; day: string }) => (b.value > a.value ? b : a), watched[0]);
              return watched.length
                ? `You watched on ${watched.length} days. Your busiest day was ${busiest.day}, with ${busiest.value} minutes.`
                : "No viewing activity in this timeframe.";
            })()}
          />
        </Card>
      </Container>
    </PageContainer>
  );
}
