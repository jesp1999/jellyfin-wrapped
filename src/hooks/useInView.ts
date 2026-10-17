import { useEffect, useRef, useState } from "react";

// Becomes true once the element is near the viewport. Never goes back to false.
// The element must generate a box (not display: contents); a zero-size element
// can never intersect, so it is treated as visible instead of never loading.
export function useInView<T extends Element>(margin = "300px") {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const r = el.getBoundingClientRect();
    if (!("IntersectionObserver" in window) || (r.width === 0 && r.height === 0)) {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (e) => {
        if (e.some((x) => x.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: margin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, margin]);
  return [ref, seen] as const;
}
