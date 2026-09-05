"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * The pixel snippet in the layout fires PageView once, when the document
 * loads. Every navigation after that is a client-side route change — no new
 * document, so no new PageView — which would leave /koszonjuk invisible to
 * Meta. Fire one explicitly on each subsequent path.
 */
export function MetaPixelPageView() {
  const pathname = usePathname();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [pathname]);

  return null;
}
