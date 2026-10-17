import { useSyncExternalStore } from "react";

// "High contrast" is a per-viewer setting: darker page tints and solid, full-opacity share cards.
// It is read from localStorage; with nothing stored it follows the system's "more contrast" setting.
// Storage can be unavailable, so every access is wrapped and falls back to that default.
const KEY = "jellyfin-wrapped-high-contrast";
const EVENT = "wrapped-contrast";

const systemDefault = (): boolean => {
  try {
    return window.matchMedia("(prefers-contrast: more)").matches;
  } catch {
    return false;
  }
};

let current: boolean = (() => {
  try {
    const v = localStorage.getItem(KEY);
    return v === null ? systemDefault() : v === "1";
  } catch {
    return systemDefault();
  }
})();

const apply = () => {
  if (typeof document !== "undefined") document.documentElement.dataset.contrast = current ? "high" : "normal";
};
apply();

export const isHighContrast = (): boolean => current;

export const setHighContrast = (on: boolean): void => {
  current = on;
  try {
    localStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    // Not persisted; the choice still applies until the page is reloaded.
  }
  apply();
  window.dispatchEvent(new Event(EVENT));
};

const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
};

export const useHighContrast = (): boolean => useSyncExternalStore(subscribe, isHighContrast, isHighContrast);

// A page colour darkened until white text on it is at least 4.5:1 (normal) or 7:1 (high contrast).
export const tint = (color: string, high: boolean): string => `color-mix(in srgb, ${color} ${high ? 45 : 58}%, black)`;

// The purple gradient on the Top 10 and Summary cards: the original, and a darker one for high contrast.
export const cardGradient = (high: boolean): string =>
  high
    ? "linear-gradient(160deg, #14006B 0%, #34007A 55%, #5A0070 100%)"
    : "linear-gradient(160deg, #2D00F7 0%, #6A00FF 55%, #B100E8 100%)";
