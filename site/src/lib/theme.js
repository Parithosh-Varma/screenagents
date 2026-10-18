import { useCallback, useEffect, useState } from "react";

const KEY = "screenagents-theme";

function readTheme() {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = window.localStorage.getItem(KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* private mode */
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function useTheme() {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  // Follow the OS only while the visitor has not made an explicit choice.
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = (event) => {
      try {
        if (window.localStorage.getItem(KEY)) return;
      } catch {
        /* ignore */
      }
      setTheme(event.matches ? "light" : "dark");
    };
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, []);

  const toggle = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  return { theme, setTheme, toggle };
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (event) => setReduced(event.matches);
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, []);

  return reduced;
}
