import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLoadingSteps } from "@/hooks/useLoadingSteps";
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
  const steps = useLoadingSteps();

  // A query that failed is finished too; its own page shows the error.
  const finished = steps.filter((step) => !step.query.isPending).length;
  const progress = Math.round((finished / steps.length) * 100);
  const allLoaded = finished === steps.length;
  const current = steps.find((step) => step.query.isPending);

  useEffect(() => {
    if (!allLoaded) return;
    const timer = setTimeout(() => {
      void navigate("/top-ten");
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
              aria-label="Loading your stats"
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
            <p role="status" className="wrapped-sr-only">
              {current?.message ?? "All done!"} {progress}%
            </p>
          </div>
        </div>
      </Container>
    </PageContainer>
  );
}
