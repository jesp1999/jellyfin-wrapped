import EmptyState from "../EmptyState";
import { useContainerWidth } from "@/hooks/useContainerWidth";
import { Container, Grid } from "@radix-ui/themes";
import { motion } from "framer-motion";
import { useErrorBoundary } from "react-error-boundary";
import { Title } from "../ui/styled";
import { itemVariants } from "@/lib/styled-variants";
import { useMinutesPlayedPerDay } from "@/hooks/queries/useMinutesPlayedPerDay";
import { useViewingPatterns } from "@/hooks/queries/useViewingPatterns";
import { LoadingSpinner } from "../LoadingSpinner";
import { ChartAlt } from "../charts/ChartAlt";
import { LineChart } from "../charts/LineChart";
import { BarChart } from "../charts/BarChart";
import PageContainer from "../PageContainer";
import { addDays, format, parseISO } from "date-fns";
import { dayLabelFormat, daysInTimeframe } from "@/lib/days";

const NEXT_PAGE = "/show-of-the-month";
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CHART_COLORS = {
  timeOfDay: { line: "var(--blue-11)", area: "var(--blue-5)" },
  dayOfWeek: { bar: "var(--purple-11)" },
  activity: { line: "var(--orange-11)", area: "var(--orange-5)" },
};

export default function MinutesPlayedPerDayPage() {
  const { showBoundary } = useErrorBoundary();
  const [containerRef, containerWidth] = useContainerWidth();

  const {
    data: playbackData,
    isLoading: l1,
    error: e1,
  } = useMinutesPlayedPerDay();
  const {
    data: viewingPatterns,
    isLoading: l2,
    error: e2,
  } = useViewingPatterns();

  const firstError = e1 || e2;
  if (firstError) {
    showBoundary(firstError);
  }

  if (l1 || l2) {
    return <LoadingSpinner />;
  }

  if (!playbackData || !viewingPatterns) {
    return (
      <EmptyState
        title="No Daily Viewing Data"
        backgroundColor="var(--amber-8)"
        nextPage={NEXT_PAGE}
        previousPage="/holidays"
      />
    );
  }

  const chartWidth = Math.min(containerWidth - 40, 800);
  const chartHeight = 300;

  // Every day of the selected timeframe, with 0 on days with no plays.
  const sortedData = daysInTimeframe(playbackData);
  const dateFormat = dayLabelFormat(sortedData);
  const firstDay = sortedData.length ? parseISO(sortedData[0].date) : new Date();
  const lastDay = sortedData.length ? parseISO(sortedData[sortedData.length - 1].date) : firstDay;

  const activityData = sortedData.map((d: { minutes: number }, i: number) => ({
    x: i,
    y: d.minutes,
  }));

  const timeOfDayData = viewingPatterns.timeOfDay.map(
    (d: { hour: number; minutes: number }) => ({
      x: d.hour,
      y: d.minutes,
    })
  );

  const dayOfWeekData = viewingPatterns.dayOfWeek.map(
    (d: { day: number; minutes: number }) => ({
      label: dayNames[d.day],
      value: d.minutes,
    })
  );

  const totalMinutes = playbackData.reduce(
    (sum: number, d: { minutes: number }) => sum + d.minutes,
    0
  );
  const totalHours = Math.floor(totalMinutes / 60);

  return (
    <PageContainer backgroundColor="var(--amber-8)" nextPage={NEXT_PAGE} previousPage="/holidays">
      <Container size="4" p="4" ref={containerRef}>
        <Grid gap="6">
          <div style={{ textAlign: "center" }}>
            <Title as={motion.h1} variants={itemVariants}>
              Your Viewing Activity
            </Title>
            <p style={{ fontSize: "1.125rem", color: "rgba(255, 255, 255, 0.92)", marginTop: "0.5rem" }}>
              See when you watch the most throughout the day and week
            </p>
            <p style={{ fontSize: "1.5rem", marginTop: "1rem" }}>
              Total: {totalHours} hours
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h2 style={{ textAlign: "center", marginBottom: "1rem", fontSize: "1.17em" }}>
              Daily Activity
            </h2>
            <LineChart
              data={activityData}
              width={chartWidth}
              height={chartHeight}
              xLabel="Date"
              xTickFormat={(i) => format(addDays(firstDay, i), dateFormat)}
              yLabel="Minutes"
              lineColor={CHART_COLORS.activity.line}
              areaColor={CHART_COLORS.activity.area}
              alt={
                <ChartAlt
                  caption={`Daily activity from ${format(firstDay, "MMM d, yyyy")} to ${format(lastDay, "MMM d, yyyy")} (${sortedData.length} days): ${totalHours} hours in total, an average of ${Math.round(totalMinutes / Math.max(sortedData.length, 1))} minutes a day, and a peak of ${Math.max(0, ...sortedData.map((d: { minutes: number }) => d.minutes))} minutes in one day.`}
                />
              }
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h2 style={{ textAlign: "center", marginBottom: "1rem", fontSize: "1.17em" }}>
              Time of Day
            </h2>
            <LineChart
              data={timeOfDayData}
              width={chartWidth}
              height={chartHeight}
              xLabel="Hour"
              yLabel="Minutes"
              lineColor={CHART_COLORS.timeOfDay.line}
              areaColor={CHART_COLORS.timeOfDay.area}
              alt={
                <ChartAlt
                  caption="Minutes watched in each hour of the day"
                  rows={timeOfDayData.map((d: { x: number; y: number }) => [`${d.x}:00`, `${d.y} minutes`])}
                />
              }
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h2 style={{ textAlign: "center", marginBottom: "1rem", fontSize: "1.17em" }}>
              Day of Week
            </h2>
            <BarChart
              data={dayOfWeekData}
              width={chartWidth}
              height={chartHeight}
              xLabel="Day"
              yLabel="Minutes"
              barColor={CHART_COLORS.dayOfWeek.bar}
              alt={
                <ChartAlt
                  caption="Minutes watched on each day of the week"
                  rows={dayOfWeekData.map((d: { label: string; value: number }) => [d.label, `${d.value} minutes`])}
                />
              }
            />
          </div>
        </Grid>
      </Container>
    </PageContainer>
  );
}
