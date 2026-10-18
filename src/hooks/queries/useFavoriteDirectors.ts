import { useQuery } from "@tanstack/react-query";
import { listFavoriteDirectors } from "@/lib/queries";

export function useFavoriteDirectors() {
  return useQuery({
    queryKey: ["favoriteDirectors"],
    queryFn: listFavoriteDirectors,
  });
}
