import EmptyState from "../EmptyState";
import { useContainerWidth } from "@/hooks/useContainerWidth";
import { Container, Grid } from "@radix-ui/themes";
import { motion } from "framer-motion";
import { useErrorBoundary } from "react-error-boundary";
import * as d3 from "d3";
import { Title } from "../ui/styled";
import { itemVariants } from "@/lib/styled-variants";
import { useDeviceStats } from "@/hooks/queries/useDeviceStats";
import { LoadingSpinner } from "../LoadingSpinner";
import { PieChart } from "../charts/PieChart";
import PageContainer from "../PageContainer";

const NEXT_PAGE = "/punch-card";

const CHART_COLORS = {
  devices: d3.schemeSet3,
  browsers: d3.schemePaired,
  os: d3.schemeTableau10,
};

export default function DeviceStatsPage() {
  const { showBoundary } = useErrorBoundary();
  const { data: deviceStats, isLoading, error } = useDeviceStats();
  const [containerRef, containerWidth] = useContainerWidth();

  if (error) {
    showBoundary(error);
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!deviceStats) {
    return (
      <EmptyState
        title="No Device Stats"
        backgroundColor="var(--violet-8)"
        nextPage={NEXT_PAGE}
        previousPage="/unfinished-shows"
      />
    );
  }


  const deviceData = deviceStats.deviceUsage.map(
    (d: { deviceName: string; minutes: number }) => ({
      name: d.deviceName,
      minutes: d.minutes,
    })
  );

  const browserData = deviceStats.browserUsage.map(
    (d: { browserName: string; minutes: number }) => ({
      name: d.browserName,
      minutes: d.minutes,
    })
  );

  const osData = deviceStats.osUsage.map(
    (d: { osName: string; minutes: number }) => ({
      name: d.osName,
      minutes: d.minutes,
    })
  );

  return (
    <PageContainer backgroundColor="var(--violet-8)" nextPage={NEXT_PAGE} previousPage="/unfinished-shows">
      <Container size="4" p="4" ref={containerRef}>
        <Grid gap="6">
          <div style={{ textAlign: "center" }}>
            <Title as={motion.h1} variants={itemVariants}>
              Your Viewing Devices
            </Title>
            <p style={{ fontSize: "1.125rem", color: "white", marginTop: "0.5rem" }}>
              Where you watch your content across different devices and apps
            </p>
          </div>

          <Grid columns={{ initial: "1", md: "2" }} gap="4">
            <PieChart
              data={deviceData}
              colors={CHART_COLORS.devices}
              title="Devices"
              containerWidth={containerWidth}
            />
            <PieChart
              data={browserData}
              colors={CHART_COLORS.browsers}
              title="Browsers"
              containerWidth={containerWidth}
            />
            {/* The odd one out spans the row, so it sits centred instead of in the left column. */}
            <div style={{ gridColumn: "1 / -1" }}>
              <PieChart
                data={osData}
                colors={CHART_COLORS.os}
                title="Operating Systems"
                containerWidth={containerWidth}
              />
            </div>
          </Grid>
        </Grid>
      </Container>
    </PageContainer>
  );
}
