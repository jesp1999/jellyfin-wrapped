import { useEffect, useState } from "react";
import { useInView } from "@/hooks/useInView";
import { Avatar } from "@radix-ui/themes";
import { getImageUrlById, SimpleItemDto } from "@/lib/queries";

export function ContentImage({ item }: { item: SimpleItemDto }) {
  const [imageUrl, setImageUrl] = useState("");
  const [ref, seen] = useInView<HTMLSpanElement>();

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
    <span
      ref={ref}
      style={{ display: "block", aspectRatio: "2/3", width: "30%", height: "100%" }}
    >
      <Avatar
        size="8"
        src={imageUrl}
        alt=""
        fallback={item.name?.[0] || "?"}
        style={{ aspectRatio: "2/3", width: "100%", height: "100%" }}
      />
    </span>
  );
}
