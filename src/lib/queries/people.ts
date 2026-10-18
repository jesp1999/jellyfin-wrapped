import { BaseItemPerson } from "@jellyfin/sdk/lib/generated-client";
import { listMovies } from "./movies";
import { listShows } from "./shows";
import { SimpleItemDto } from "./types";

export type RankedPerson = {
  name: string;
  count: number;
  details: BaseItemPerson;
  seenInMovies: SimpleItemDto[];
  seenInShows: SimpleItemDto[];
};

// Ranks the people credited on what was watched, one pass over the titles.
// `accept` picks which credits count (actors, directors, ...). Someone must appear
// on at least two titles to rank, so a single watch is not a "favorite".
export const listRankedPeople = async (
  accept: (person: BaseItemPerson) => boolean
): Promise<RankedPerson[]> => {
  const movies = await listMovies();
  const shows = (await listShows()).map((s: { item: SimpleItemDto }) => s.item);

  const byName = new Map<string, RankedPerson>();
  const add = (item: SimpleItemDto, kind: "seenInMovies" | "seenInShows") => {
    const seenHere = new Set<string>();
    for (const person of item.people ?? []) {
      if (!person?.Name || !accept(person) || seenHere.has(person.Name)) continue;
      seenHere.add(person.Name);
      let entry = byName.get(person.Name);
      if (!entry) {
        entry = { name: person.Name, count: 0, details: person, seenInMovies: [], seenInShows: [] };
        byName.set(person.Name, entry);
      }
      entry[kind].push(item);
      entry.count += 1;
    }
  };
  movies.forEach((movie: SimpleItemDto) => add(movie, "seenInMovies"));
  shows.forEach((show: SimpleItemDto) => add(show, "seenInShows"));

  return Array.from(byName.values())
    .filter((p) => p.count > 1)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
};
