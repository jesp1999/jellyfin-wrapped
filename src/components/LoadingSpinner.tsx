import { useLayoutEffect, useRef } from "react";
import { Spinner } from "@radix-ui/themes";
import { tint, useHighContrast } from "@/lib/contrast";

export function LoadingSpinner({
  backgroundColor = "var(--green-8)",
}: {
  backgroundColor?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const tinted = tint(backgroundColor, useHighContrast());
  // Paint the root the same colour, so overscroll never shows white behind the page.
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (ref.current) root.style.backgroundColor = getComputedStyle(ref.current).backgroundColor;
    return () => {
      root.style.backgroundColor = "";
    };
  }, [tinted]);
  return (
    <main
      ref={ref}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: tinted,
      }}
    >
      <span role="status">
        <Spinner size="3" />
        <span className="wrapped-sr-only">Loading</span>
      </span>
    </main>
  );
}
