import type { HTMLAttributes } from "react";

// A dark, translucent panel for the cards on the coloured pages, so white text on it keeps its contrast.
export function Panel({ style, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      style={{
        background: "rgba(0, 0, 0, 0.28)",
        border: "1px solid rgba(255, 255, 255, 0.25)",
        borderRadius: 12,
        padding: 16,
        color: "white",
        ...style,
      }}
    />
  );
}
