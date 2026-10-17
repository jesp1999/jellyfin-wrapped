import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { styled } from "@stitches/react";
import { motion } from "framer-motion";
import TimeframeSelector from "./TimeframeSelector";
import { PAGES, visiblePages } from "@/lib/pages";
import { useLibraryKinds } from "@/hooks/queries/useLibraryKinds";
import { Warmup } from "./Warmup";


const Navigation = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [warmups, setWarmups] = useState(0);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const hidden = location.pathname === "/" || location.pathname === "/configure";
  const { data: kinds } = useLibraryKinds(!hidden);

  // While the menu is open, focus is in it and Escape closes it and returns focus to the toggle.
  useEffect(() => {
    if (!isOpen) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen]);

  // Don't show navigation on splash or configuration pages
  if (hidden) {
    return null;
  }

  const toggleNav = () => {
    setIsOpen(!isOpen);
  };

  const handleTimeframeChange = () => {
    // Every query reads the selected timeframe when it runs. Resetting them re-runs the
    // ones on screen now and the others the next time their page opens, with no reload.
    void queryClient.resetQueries({ predicate: (q) => q.queryKey[0] !== "libraryKinds" });
    // ...and load the rest now, in the background, instead of when each page is opened.
    setWarmups((n) => n + 1);
    // The page open now may not fit the new timeframe.
    const here = location.pathname;
    if (PAGES.some((p) => p.path === here) && !visiblePages(kinds).some((p) => p.path === here)) void navigate("/TopTen");
  };

  return (
    <>
      {warmups > 0 && <Warmup key={warmups} />}
      <header>
        <NavToggle
          ref={toggleRef}
          onClick={toggleNav}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          aria-controls="site-nav"
        >
          <span aria-hidden="true">{isOpen ? "✕" : "☰"}</span>
        </NavToggle>
      </header>

      <SideNav
        as={motion.div}
        id="site-nav"
        role="navigation"
        aria-label="Main menu"
        {...({ inert: !isOpen } as object)}
        initial={{ x: "-100%" }}
        animate={{ x: isOpen ? 0 : "-100%" }}
        transition={{ duration: 0.3 }}
      >
        <NavHeader>
          <NavTitle>Jellyfin Wrapped</NavTitle>
          <CloseButton ref={closeRef} onClick={toggleNav} aria-label="Close menu">
            <span aria-hidden="true">✕</span>
          </CloseButton>
        </NavHeader>

        <TimeframeContainer>
          <TimeframeSelector onTimeframeChange={handleTimeframeChange} />
        </TimeframeContainer>

        <NavList>
          {visiblePages(kinds).map((item) => (
            <NavItem key={item.path} isActive={location.pathname === item.path}>
              <NavLinkButton
                aria-current={location.pathname === item.path ? "page" : undefined}
                onClick={() => {
                  void navigate(item.path);
                  setIsOpen(false);
                }}
              >
                {item.name}
              </NavLinkButton>
            </NavItem>
          ))}
        </NavList>
      </SideNav>

      {isOpen && <Overlay onClick={toggleNav} />}
    </>
  );
};

const SideNav = styled("nav", {
  position: "fixed",
  top: 0,
  left: 0,
  height: "100vh",
  width: "280px",
  backgroundColor: "rgba(45, 0, 247, 0.95)",
  backdropFilter: "blur(10px)",
  boxShadow: "2px 0 10px rgba(0, 0, 0, 0.3)",
  zIndex: 1000,
  overflowY: "auto",
  padding: "20px 0",
  display: "flex",
  flexDirection: "column",
});

const NavHeader = styled("div", {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  // The left padding leaves room for the menu button, which floats over the top left corner.
  padding: "0 20px 20px 72px",
  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  marginBottom: "20px",
});

const TimeframeContainer = styled("div", {
  padding: "0 20px 20px",
  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  marginBottom: "20px",
});

const NavTitle = styled("p", {
  color: "#FFD700",
  margin: 0,
  fontSize: "1.5rem",
  fontWeight: "bold",
});

const CloseButton = styled("button", {
  background: "none",
  border: "none",
  color: "white",
  fontSize: "1.5rem",
  cursor: "pointer",
  minWidth: "44px",
  minHeight: "44px",
  padding: "5px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  "&:hover": {
    color: "#FFD700",
  },
});

const NavList = styled("ul", {
  listStyle: "none",
  padding: 0,
  margin: 0,
  flexGrow: 1,
});

const NavLinkButton = styled("button", {
  display: "block",
  width: "100%",
  minHeight: "44px",
  padding: "12px 20px",
  background: "none",
  border: "none",
  color: "white",
  font: "inherit",
  textAlign: "left",
  cursor: "pointer",
});

const NavItem = styled("li", {
  color: "white",
  transition: "all 0.2s ease",
  borderLeft: "4px solid transparent",

  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderLeftColor: "#FFD700",
  },

  variants: {
    isActive: {
      true: {
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        borderLeftColor: "#FFD700",
        fontWeight: "bold",
      },
    },
  },
});

const NavToggle = styled("button", {
  position: "fixed",
  top: "20px",
  left: "20px",
  zIndex: 1001,
  backgroundColor: "rgba(45, 0, 247, 0.8)",
  color: "white",
  border: "none",
  borderRadius: "50%",
  width: "44px",
  height: "44px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "1.5rem",
  cursor: "pointer",
  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
  transition: "all 0.2s ease",

  "&:hover": {
    backgroundColor: "#4D2DFF",
    transform: "scale(1.05)",
  },
});

const Overlay = styled("div", {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  zIndex: 999,
});

export default Navigation;
