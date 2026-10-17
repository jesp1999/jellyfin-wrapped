import { useEffect, useState } from "react";

// Width of an element, kept current as it resizes. Pass the returned ref callback as `ref`.
// Unlike reading ref.current during render, this works when the element mounts after the first
// render (pages show a spinner first) and when the window is resized or rotated.
export function useContainerWidth(fallback = 320) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return [setEl, width || fallback] as const;
}
