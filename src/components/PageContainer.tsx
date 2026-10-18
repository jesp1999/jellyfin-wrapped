import { ReactNode, RefObject, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ShareButton } from "@/components/ShareButton";
import { renderElement, renderPage } from "@/lib/share";
import { SHARE_CARDS } from "@/components/share/registry";
import { Box, Button, Flex } from "@radix-ui/themes";
import { useNavigate, useLocation } from "react-router-dom";
import { PAGES, visiblePages } from "@/lib/pages";
import { useLibraryKinds } from "@/hooks/queries/useLibraryKinds";
import { styled } from "@stitches/react";
import { tint, useHighContrast } from "@/lib/contrast";
import { formatTimeframeLabel, useTimeframe } from "@/lib/timeframe";

interface PageContainerProps {
  children: ReactNode;
  backgroundColor?: string;
  nextPage?: string;
  previousPage?: string;
  // Element to capture when sharing. Defaults to the page content.
  shareRef?: RefObject<HTMLElement | null>;
  // A compact card to share instead of the page. Rendered off screen at 360x640.
  shareCard?: ReactNode;
  // False on pages with nothing to share.
  shareable?: boolean;
  // Show the selected timeframe, with its dates, at the top of the page. On by default.
  showTimeframe?: boolean;
}

const PageContainer = ({
  children,
  backgroundColor = "var(--purple-8)",
  nextPage: nextProp,
  previousPage: prevProp,
  shareRef,
  shareCard,
  shareable = true,
  showTimeframe = true,
}: PageContainerProps) => {
  const timeframe = useTimeframe();
  const navigate = useNavigate();
  const pageRef = useRef<HTMLElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const high = useHighContrast();
  const tinted = tint(backgroundColor, high);
  // Paint the root the same colour, so overscroll (rubber-banding) never shows white behind the page.
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (boxRef.current) root.style.backgroundColor = getComputedStyle(boxRef.current).backgroundColor;
    return () => {
      root.style.backgroundColor = "";
    };
  }, [tinted]);
  const { pathname } = useLocation();
  const { data: kinds } = useLibraryKinds();
  const all = PAGES.map((p) => p.path);
  const shown = visiblePages(kinds).map((p) => p.path);
  const at = all.indexOf(pathname);
  const nextPage = at < 0 ? nextProp : (all.slice(at + 1).find((p) => shown.includes(p)) ?? "/");
  const previousPage = at < 0 ? prevProp : (all.slice(0, at).reverse().find((p) => shown.includes(p)) ?? "/loading");
  // Last visible page: Next has nowhere to go, so it becomes Done and returns to the start.
  const done = at >= 0 && nextPage === "/";
  // One screen-shaped image per page: a visible card, the page's registered card (built only when
  // Share is tapped), or the page itself.
  const [building, setBuilding] = useState(false);
  const Registered = SHARE_CARDS[pathname];
  const card = shareCard ?? (building && Registered ? <Registered bg={backgroundColor} /> : null);
  const capture = async () => {
    if (shareRef?.current) return renderElement(shareRef.current, { flat: true });
    const lazy = !shareCard && !!Registered;
    if (lazy) {
      flushSync(() => setBuilding(true));
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
    try {
      if (cardRef.current) return await renderElement(cardRef.current);
      const box = boxRef.current;
      return await renderPage(pageRef.current ?? document.body, box ? getComputedStyle(box).backgroundColor : "#4D2DFF");
    } finally {
      if (lazy) setBuilding(false);
    }
  };

  // The dark tint keeps white text at 4.5:1 or better on every page colour.
  return (
    <Box
      ref={boxRef}
      style={{
        backgroundColor: tinted,
        color: "white",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <main ref={pageRef} id="main" tabIndex={-1} style={{ flex: 1, paddingBottom: "5rem" }}>
        {showTimeframe && (
          <p style={{ margin: 0, padding: "1rem 1rem 0", textAlign: "center", fontSize: "0.9375rem" }}>
            {formatTimeframeLabel(timeframe)}
          </p>
        )}
        {children}
      </main>
      {card && (
        <div aria-hidden style={{ position: "fixed", left: -10000, top: 0, pointerEvents: "none" }}>
          <div ref={cardRef}>{card}</div>
        </div>
      )}

      {(nextPage || previousPage) && (
        <NavButtonContainer aria-label="Page navigation">
          <Flex gap="2" style={{ width: "100%" }}>
            {previousPage && (
              <Button
                size={"4"}
                color="gray"
                highContrast
                style={{ flex: 1 }}
                onClick={() => {
                  void navigate(previousPage);
                }}
              >
                Previous
              </Button>
            )}
            {shareable && <ShareButton capture={capture} />}
            {nextPage && (
              <Button
                size={"4"}
                color={done ? "green" : undefined}
                highContrast={done}
                style={{ flex: 1 }}
                onClick={() => {
                  void navigate(nextPage);
                }}
              >
                {done ? "Done" : "Next"}
              </Button>
            )}
          </Flex>
        </NavButtonContainer>
      )}
    </Box>
  );
};

const NavButtonContainer = styled("nav", {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 10,
  padding: "0 1rem 1rem 1rem",
});

export default PageContainer;
