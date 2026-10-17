import type { HTMLAttributes } from "react";
import { useHighContrast } from "@/lib/contrast";

// A dark, translucent panel for the cards on the coloured pages, so white text on it keeps its contrast.
export function Panel({ style, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const high = useHighContrast();
  return (
    <div
      {...rest}
      style={{
        background: high ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.28)",
        border: high ? "1px solid rgba(255, 255, 255, 0.7)" : "1px solid rgba(255, 255, 255, 0.25)",
        borderRadius: 12,
        padding: 16,
        color: "white",
        ...style,
      }}
    />
  );
}
