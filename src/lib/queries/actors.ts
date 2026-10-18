import { listRankedPeople, RankedPerson } from "./people";

// Credits that count as acting. Jellyfin also lists directors, writers and producers
// under People; those do not belong on the actors page.
const ACTING = new Set(["Actor", "GuestStar"]);

export const listFavoriteActors = (): Promise<RankedPerson[]> =>
  listRankedPeople((person) => !person.Type || ACTING.has(person.Type));
