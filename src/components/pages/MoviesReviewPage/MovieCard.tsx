import { useEffect, useState } from "react";
import { useInView } from "@/hooks/useInView";
import { Avatar } from "@radix-ui/themes";
import { formatDuration } from "@/lib/utils";
import { getImageUrlById, SimpleItemDto } from "@/lib/queries";
import { Trash2 } from "lucide-react";

interface MovieCardProps {
  item: SimpleItemDto;
  playbackTime?: number;
  episodeCount?: number;
  onHide?: () => void;
  // Heading level of the title: 2 under the page title, 3 under a section heading.
  headingLevel?: 2 | 3;
}

export function MovieCard({
  item,
  playbackTime,
  episodeCount,
  onHide,
  headingLevel = 2,
}: MovieCardProps) {
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const [imageUrl, setImageUrl] = useState<string>();
  const [ref, seen] = useInView<HTMLDivElement>();
  useEffect(() => {
    if (!seen) return;
    const fetchImageUrl = async () => {
      try {
        const url = await getImageUrlById(item.imageId ?? item.id ?? "");
        setImageUrl(url);
      } catch (error) {
        console.error("Failed to fetch image URL:", error);
      }
    };

    void fetchImageUrl();
  }, [item, seen]);

  return (
    <div className="bg-card rounded-lg shadow-lg overflow-hidden">
      <div ref={ref} className="aspect-[2/3] relative" style={{ position: "relative" }}>
        <Avatar
          size="8"
          src={imageUrl}
          alt=""
          fallback={item.name?.[0] || "?"}
          className="w-full h-full"
          style={{
            borderRadius: 0,
            aspectRatio: "2/3",
            width: "100%",
            height: "100%",
          }}
        />
        {onHide && (
          <button
            type="button"
            aria-label={`Hide ${item.name ?? "this title"}`}
            onClick={onHide}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "1px solid rgba(255, 255, 255, 0.7)",
              background: "rgba(0, 0, 0, 0.65)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Trash2 size={18} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="p-4">
        <Heading className="font-semibold text-lg">{item.name}</Heading>
        <p className="text-sm text-muted-foreground">
          {item.productionYear && `Released: ${item.productionYear}`}
        </p>
        {item.communityRating && (
          <p className="text-sm text-muted-foreground">
            Rating: ⭐ {item.communityRating.toFixed(1)}
          </p>
        )}
        {playbackTime && episodeCount && episodeCount > 1 && (
          <>
            <p className="text-sm text-muted-foreground">
              You watched {episodeCount} episodes
            </p>
            <p className="text-sm text-muted-foreground">
              Watch time: {formatDuration(playbackTime)}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
