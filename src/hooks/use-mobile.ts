"use client";

import { useEffect, useState } from "react";

export function useMobile(breakpoint = 768) {
  const [isMobile, set] = useState(false);

  useEffect(() => {
    const h = () => set(window.innerWidth < breakpoint);
    h();
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, [breakpoint]);

  return isMobile;
}
