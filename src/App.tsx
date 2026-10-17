import "@radix-ui/themes/styles.css";
import { ErrorBoundary } from "react-error-boundary";
import { Theme } from "@radix-ui/themes";
import { MotionConfig, useReducedMotion } from "framer-motion";
import { PAGES } from "./lib/pages";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  useLocation,
} from "react-router-dom";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { removeCacheValue, JELLYFIN_AUTH_TOKEN_CACHE_KEY } from "./lib/cache";
import SplashPage from "./components/pages/SplashPage";
import ServerConfigurationPage from "./components/pages/ServerConfigurationPage";
import MoviesReviewPage from "./components/pages/MoviesReviewPage";
import ShowReviewPage from "./components/pages/ShowReviewPage";
import LiveTvReviewPage from "./components/pages/LiveTvReviewPage";
import AudioReviewPage from "./components/pages/AudioReviewPage";
import FavoriteActorsPage from "./components/pages/FavoriteActorsPage";
import OldestShowPage from "./components/pages/OldestShowPage";
import OldestMoviePage from "./components/pages/OldestMoviePage";
import MusicVideoPage from "./components/pages/MusicVideoPage";
import GenreReviewPage from "./components/pages/GenreReviewPage";
import HolidayReviewPage from "./components/pages/HolidayReviewPage";
import MinutesPlayedPerDayPage from "./components/pages/MinutesPlayedPerDayPage";
import DeviceStatsPage from "./components/pages/DeviceStatsPage";
import ShowOfTheMonthPage from "./components/pages/ShowOfTheMonthPage";
import UnfinishedShowsPage from "./components/pages/UnfinishedShowsPage";
import CriticallyAcclaimedPage from "./components/pages/CriticallyAcclaimedPage";
import TopTenPage from "./components/pages/TopTenPage";
import FirstWatchedPage from "./components/pages/FirstWatchedPage";
import { useEffect, useRef, useState } from "react";
import ActivityCalendarPage from "./components/pages/ActivityCalendarPage";
import SummaryPage from "./components/pages/SummaryPage";
import Navigation from "./components/Navigation";
import { LoadingPage } from "./components/pages/LoadingPage";

const queryClient = new QueryClient({
  // A revoked or expired token: forget it and go back to the sign-in form.
  queryCache: new QueryCache({
    onError: (error) => {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status === 401 || /\(401\)/.test(error.message)) {
        removeCacheValue(JELLYFIN_AUTH_TOKEN_CACHE_KEY);
        window.location.assign("/configure");
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

const ROUTE_NAMES: Record<string, string> = {
  "/": "Welcome",
  "/configure": "Connect to Jellyfin",
  "/loading": "Loading your stats",
};

// On every route change: scroll to the top, set the tab title, move focus to the page content
// and announce the page, so keyboard and screen reader users are not left on the old page.
function RouteEffects() {
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  const [announcement, setAnnouncement] = useState("");
  const firstRoute = useRef(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    const name = PAGES.find((p) => p.path === pathname)?.name ?? ROUTE_NAMES[pathname] ?? "Jellyfin Wrapped";
    document.title = `${name} · Jellyfin Wrapped`;
    setAnnouncement(name);
    const focusMain = () => {
      // Only when focus was lost with the old page; never take it from something the user is using.
      if (document.activeElement && document.activeElement !== document.body) return;
      document.getElementById("main")?.focus({ preventScroll: true });
    };
    // Not on the first load, so the skip link is the first thing Tab reaches.
    const timers = firstRoute.current ? [] : [setTimeout(focusMain, 50), setTimeout(focusMain, 800)];
    firstRoute.current = false;
    return () => timers.forEach(clearTimeout);
  }, [pathname, reduce]);

  return (
    <div role="status" aria-live="polite" className="wrapped-sr-only">
      {announcement}
    </div>
  );
}

function RootLayout() {
  return (
    <ErrorBoundary
      onError={(e) => console.error(e)}
      fallbackRender={() => (
        <main id="main" style={{ minHeight: "100vh", display: "grid", placeContent: "center", gap: "1rem", textAlign: "center", background: "#2D00F7", color: "white", padding: "1rem" }}>
          <h1>Something went wrong</h1>
          <p>Your stats could not be loaded. Check your connection and try again.</p>
          <button onClick={() => window.location.assign("/")}>Start over</button>
        </main>
      )}
    >
      <a
        className="wrapped-skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Skip to content
      </a>
      <RouteEffects />
      <QueryClientProvider client={queryClient}>
        <MotionConfig reducedMotion="user">
          <Theme>
            <Navigation />
            <Outlet />
          </Theme>
        </MotionConfig>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <SplashPage />,
      },
      {
        path: "/configure",
        element: <ServerConfigurationPage />,
      },
      {
        path: "/loading",
        element: <LoadingPage />,
      },
      {
        path: "/first-watched",
        element: <FirstWatchedPage />,
      },
      {
        path: "/movies",
        element: <MoviesReviewPage />,
      },
      {
        path: "/oldest-show",
        element: <OldestShowPage />,
      },
      {
        path: "/oldest-movie",
        element: <OldestMoviePage />,
      },
      {
        path: "/shows",
        element: <ShowReviewPage />,
      },
      {
        path: "/tv",
        element: <LiveTvReviewPage />,
      },
      {
        path: "/audio",
        element: <AudioReviewPage />,
      },
      {
        path: "/critically-acclaimed",
        element: <CriticallyAcclaimedPage />,
      },
      {
        path: "/actors",
        element: <FavoriteActorsPage />,
      },
      {
        path: "/music-videos",
        element: <MusicVideoPage />,
      },
      {
        path: "/genres",
        element: <GenreReviewPage />,
      },
      {
        path: "/holidays",
        element: <HolidayReviewPage />,
      },
      {
        path: "/minutes-per-day",
        element: <MinutesPlayedPerDayPage />,
      },
      {
        path: "/show-of-the-month",
        element: <ShowOfTheMonthPage />,
      },
      {
        path: "/unfinished-shows",
        element: <UnfinishedShowsPage />,
      },
      {
        path: "/device-stats",
        element: <DeviceStatsPage />,
      },
      {
        path: "/punch-card",
        element: <ActivityCalendarPage />,
      },
      {
        path: "/summary",
        element: <SummaryPage />,
      },
      {
        path: "/TopTen",
        element: <TopTenPage />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
