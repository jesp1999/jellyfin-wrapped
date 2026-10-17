import type { ComponentType } from "react";
import type { CardProps } from "./ShareShell";
import {
  AudioCard,
  CalendarCard,
  CriticalCard,
  DeviceCard,
  FirstWatchedCard,
  HolidayCard,
  LiveTvCard,
  MinutesCard,
  MusicVideosCard,
  OldestMovieCard,
  OldestShowCard,
  ShowOfMonthCard,
} from "./cards";
import { ActorsCard, GenreCard, MoviesCard, ShowsCard, UnfinishedCard } from "./cards2";

// Pages that share a purpose-built 9:16 card. The others fall back to a poster wall or a crop.
export const SHARE_CARDS: Record<string, ComponentType<CardProps>> = {
  "/first-watched": FirstWatchedCard,
  "/audio": AudioCard,
  "/music-videos": MusicVideosCard,
  "/tv": LiveTvCard,
  "/critically-acclaimed": CriticalCard,
  "/oldest-movie": OldestMovieCard,
  "/oldest-show": OldestShowCard,
  "/holidays": HolidayCard,
  "/minutes-per-day": MinutesCard,
  "/show-of-the-month": ShowOfMonthCard,
  "/device-stats": DeviceCard,
  "/punch-card": CalendarCard,
  "/movies": MoviesCard,
  "/shows": ShowsCard,
  "/actors": ActorsCard,
  "/genres": GenreCard,
  "/unfinished-shows": UnfinishedCard,
};
