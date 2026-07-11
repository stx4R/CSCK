"use client";

import { useEffect } from "react";

export default function TouchGuards() {
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();

    document.addEventListener("gesturestart", prevent);
    document.addEventListener("gesturechange", prevent);
    document.addEventListener("gestureend", prevent);

    const onContextMenu = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      e.preventDefault();
    };
    document.addEventListener("contextmenu", onContextMenu);

    return () => {
      document.removeEventListener("gesturestart", prevent);
      document.removeEventListener("gesturechange", prevent);
      document.removeEventListener("gestureend", prevent);
      document.removeEventListener("contextmenu", onContextMenu);
    };
  }, []);

  return null;
}
