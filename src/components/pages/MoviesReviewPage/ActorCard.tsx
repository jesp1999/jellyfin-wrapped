import { useEffect, useState } from "react";
import { useInView } from "@/hooks/useInView";
import { Avatar } from "@radix-ui/themes";
import { getImageUrlById, SimpleItemDto } from "@/lib/queries";
import { BaseItemPerson } from "@jellyfin/sdk/lib/generated-client";

interface ActorCardProps {
  name: string;
  count: number;
  details: BaseItemPerson;
  seenInMovies: SimpleItemDto[];
  seenInShows: SimpleItemDto[];
}

export function ActorCard({
  name,
  count,
  details,
  seenInMovies,
  seenInShows,
}: ActorCardProps) {
  const [imageUrl, setImageUrl] = useState<string>();
  const [ref, seen] = useInView<HTMLDivElement>();
  useEffect(() => {
    if (!seen) return;
    const fetchImageUrl = async () => {
      try {
        const url = await getImageUrlById(details.Id ?? "");
        setImageUrl(url);
      } catch (error) {
        console.error("Failed to fetch image URL:", error);
      }
    };

    void fetchImageUrl();
  }, [details, seen]);

  return (
    <div className="bg-card rounded-lg shadow-lg overflow-hidden">
      <div ref={ref} className="aspect-[2/3] relative">
        <Avatar
          size="8"
          src={imageUrl}
          alt=""
          fallback={details.Name?.[0] || "?"}
          className="w-full h-full"
          style={{
            borderRadius: 0,
            aspectRatio: "2/3",
            width: "100%",
            height: "100%",
          }}
        />
      </div>
      <div className="p-4">
        <h2 className="font-semibold text-lg">{name}</h2>
        {count > 0 && (
          <>
            <p className="text-sm text-muted-foreground">
              You watched {name} {count} times
            </p>
            <ul>
              {[...seenInMovies, ...seenInShows].map((itemDto, i) => (
                <li key={`${itemDto.id}-${i}`}>{itemDto.name}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
