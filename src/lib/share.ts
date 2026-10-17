import { getWatermark } from "@/lib/watermark";
import { getFontEmbedCSS, toBlob } from "html-to-image";

const BLANK = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Every share image is portrait 9:16, the shape of a phone screen and of a story.
const RATIO = 16 / 9;
const OFFSCREEN = "position:fixed;left:-10000px;top:0;pointer-events:none;";

// Embedding web fonts means fetching and encoding every font file. Do it once and reuse it.
let fontCss: Promise<string> | undefined;
const fonts = (node: HTMLElement) => (fontCss ??= getFontEmbedCSS(node).catch(() => ""));
export const warmShare = () => void fonts(document.body);

// Wait for the <img> elements in `el` to exist and finish loading. `lazy` also asks lazy-loaded
// posters (below the fold on a real page) to load.
async function loadImages(el: HTMLElement, lazy: boolean) {
  try {
    await document.fonts?.ready;
  } catch {
    // fonts are best effort
  }
  if (lazy) window.dispatchEvent(new Event("wrapped:load-all"));
  let last = -1;
  let stable = 0;
  for (let i = 0; i < 80 && stable < 3; i++) {
    await sleep(100);
    const imgs = [...el.querySelectorAll("img")];
    const done = imgs.every((img) => img.complete);
    stable = imgs.length === last && done ? stable + 1 : 0;
    last = imgs.length;
  }
}

async function snapshot(node: HTMLElement, style?: Partial<CSSStyleDeclaration>): Promise<Blob> {
  const options = {
    pixelRatio: 2,
    cacheBust: false,
    imagePlaceholder: BLANK, // a poster that fails to fetch must not abort the whole image
    fontEmbedCSS: await fonts(node),
    style,
  };
  // Safari draws images late on the first pass, so render once to warm it up.
  if (node.querySelector("img") && /^((?!chrome|android).)*safari/i.test(navigator.userAgent)) await toBlob(node, options);
  const blob = await toBlob(node, options);
  if (!blob) throw new Error("Could not render the image");
  return blob;
}

// An element that is already the shape of the image (a card). Margin is zeroed because the
// capture copies the resolved margin of a centred card and shifts it inside its own frame.
export async function renderElement(el: HTMLElement, opts: { flat?: boolean } = {}): Promise<Blob> {
  await loadImages(el, false);
  return snapshot(el, { margin: "0", ...(opts.flat ? { borderRadius: "0" } : {}) });
}

const h = (tag: string, css: string, text?: string) => {
  const e = document.createElement(tag);
  e.style.cssText = css;
  if (text) e.textContent = text;
  return e;
};

// Portrait posters on the page, in order, without repeats.
function posterUrls(el: HTMLElement): string[] {
  const urls = [...el.querySelectorAll("img")]
    .filter((img) => {
      const ratio = img.naturalHeight / (img.naturalWidth || 1);
      return img.complete && img.naturalWidth > 0 && img.clientWidth >= 48 && ratio > 1.2 && ratio < 1.8;
    })
    .map((img) => img.currentSrc || img.src);
  return [...new Set(urls)];
}

// Pages without a card of their own, one screen: a wall of the page's posters under its title,
// or the top of the page cropped to the same shape.
export async function renderPage(el: HTMLElement, backgroundColor: string): Promise<Blob> {
  await loadImages(el, true);
  const width = Math.min(440, Math.max(320, Math.round(el.clientWidth)));
  const height = Math.round(width * RATIO);

  const holder = h("div", OFFSCREEN);
  const card = h(
    "div",
    `position:relative;box-sizing:border-box;overflow:hidden;width:${width}px;height:${height}px;padding:16px;background:${backgroundColor};color:white;font-family:inherit;`
  );
  holder.appendChild(card);

  const found = posterUrls(el);
  const cols = found.length >= 10 ? 4 : 3; // fewer posters get larger tiles
  const posters = found.slice(0, cols === 4 ? 16 : 9);
  if (posters.length >= 4) {
    card.style.cssText += "padding:24px;display:flex;flex-direction:column;";
    card.appendChild(h("div", "font-size:12px;letter-spacing:2px;text-transform:uppercase;opacity:.85;", "Jellyfin Wrapped"));
    card.appendChild(
      h("div", "font-size:28px;font-weight:800;line-height:1.15;margin:4px 0 16px;", el.querySelector("h1")?.textContent ?? "")
    );
    const grid = h("div", `display:grid;grid-template-columns:repeat(${cols},1fr);gap:8px;`);
    for (const src of posters) {
      const img = document.createElement("img");
      img.src = src;
      img.style.cssText = "display:block;width:100%;aspect-ratio:2/3;object-fit:cover;border-radius:8px;";
      grid.appendChild(img);
    }
    card.appendChild(grid);
    const mark = getWatermark();
    if (mark) card.appendChild(h("div", "margin-top:auto;font-size:12px;opacity:.7;", mark));
  } else {
    const clone = el.cloneNode(true) as HTMLElement;
    clone.style.margin = "0";
    clone.style.paddingBottom = "0";
    card.appendChild(clone);
  }

  document.body.appendChild(holder);
  try {
    if (posters.length >= 4) await loadImages(card, false);
    return await snapshot(card);
  } finally {
    holder.remove();
  }
}

export const makeFile = (blob: Blob, name: string) => new File([blob], name, { type: "image/png" });

export const canShareFile = (file: File) =>
  typeof navigator.share === "function" && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });

export async function shareFile(file: File): Promise<void> {
  try {
    await navigator.share({ files: [file], title: "My Jellyfin Wrapped" });
  } catch (error) {
    if ((error as Error).name !== "AbortError") throw error; // closing the sheet is not an error
  }
}

export function saveFile(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
