import { listRankedPeople, RankedPerson } from "./people";

export const listFavoriteDirectors = (): Promise<RankedPerson[]> =>
  listRankedPeople((person) => person.Type === "Director");
