import { useQuery } from "@tanstack/react-query";
import { listShows } from "@/lib/queries";
import { listTopMovies } from "@/lib/queries/top-movies";

export const useTopTen = () =>
  useQuery({
    queryKey: ["topTen"],
    queryFn: async () => {
      const [movies, shows] = await Promise.all([listTopMovies(), listShows()]);
      return { movies: movies.slice(0, 10), shows: shows.slice(0, 10) };
    },
  });
