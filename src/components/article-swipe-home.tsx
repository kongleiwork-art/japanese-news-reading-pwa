"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { getSavedHomeHref } from "@/components/home-return-state";

const MIN_HORIZONTAL_DISTANCE = 72;
const MAX_VERTICAL_DISTANCE = 56;

export function ArticleSwipeHome() {
  const router = useRouter();
  const startRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    function handleTouchStart(event: TouchEvent) {
      if (event.touches.length !== 1 || isInteractiveTarget(event.target)) {
        startRef.current = null;
        return;
      }

      const touch = event.touches[0];
      startRef.current = {
        x: touch.clientX,
        y: touch.clientY,
      };
    }

    function handleTouchEnd(event: TouchEvent) {
      const start = startRef.current;
      startRef.current = null;

      if (!start || event.changedTouches.length !== 1) {
        return;
      }

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;

      if (deltaX <= -MIN_HORIZONTAL_DISTANCE && Math.abs(deltaY) <= MAX_VERTICAL_DISTANCE) {
        router.push(getSavedHomeHref("/"));
      }
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [router]);

  return null;
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element
    ? Boolean(target.closest("a,button,input,select,textarea,[role='button']"))
    : false;
}
