import { ReactNode } from "react";
import { Box, Button, Flex } from "@radix-ui/themes";
import { useNavigate, useLocation } from "react-router-dom";
import { PAGES, visiblePages } from "@/lib/pages";
import { useLibraryKinds } from "@/hooks/queries/useLibraryKinds";
import { styled } from "@stitches/react";

interface PageContainerProps {
  children: ReactNode;
  backgroundColor?: string;
  nextPage?: string;
  previousPage?: string;
}

const PageContainer = ({
  children,
  backgroundColor = "var(--purple-8)",
  nextPage: nextProp,
  previousPage: prevProp,
}: PageContainerProps) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data: kinds } = useLibraryKinds();
  const all = PAGES.map((p) => p.path);
  const shown = visiblePages(kinds).map((p) => p.path);
  const at = all.indexOf(pathname);
  const nextPage = at < 0 ? nextProp : (all.slice(at + 1).find((p) => shown.includes(p)) ?? "/");
  const previousPage = at < 0 ? prevProp : (all.slice(0, at).reverse().find((p) => shown.includes(p)) ?? "/loading");

  return (
    <Box style={{ backgroundColor, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, paddingBottom: "5rem" }}>
        {children}
      </div>

      {(nextPage || previousPage) && (
        <NavButtonContainer>
          <Flex gap="2" style={{ width: "100%" }}>
            {previousPage && (
              <Button
                size={"4"}
                color="gray"
                style={{ flex: 1 }}
                onClick={() => {
                  void navigate(previousPage);
                }}
              >
                Previous
              </Button>
            )}
            {nextPage && (
              <Button
                size={"4"}
                style={{ flex: 1 }}
                onClick={() => {
                  void navigate(nextPage);
                }}
              >
                Next
              </Button>
            )}
          </Flex>
        </NavButtonContainer>
      )}
    </Box>
  );
};

const NavButtonContainer = styled("div", {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 10,
  padding: "0 1rem 1rem 1rem",
});

export default PageContainer;
