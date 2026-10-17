import { useQuery } from "@tanstack/react-query";
import { getLibraryKinds } from "@/lib/queries/libraries";
// Errors are thrown, not cached as "no libraries", so callers fall back to showing everything.
export const useLibraryKinds = (enabled = true) => useQuery({ queryKey: ["libraryKinds"], enabled, staleTime: Infinity, retry: false, queryFn: async () => { const k = await getLibraryKinds(); if (!k) throw new Error("Libraries unavailable"); return k; } });
