"use client";
import { useState, useEffect } from "react";

export type Breakpoint = "mobile" | "tablet" | "desktop";

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>("mobile");

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w >= 1024) setBp("desktop");
      else if (w >= 640) setBp("tablet");
      else setBp("mobile");
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return bp;
}

export function useWindowWidth(): number {
  const [width, setWidth] = useState(375);
  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return width;
}
