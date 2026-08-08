"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cx } from "@/components/ui";

/**
 * Scroll reveal. The element is hidden by `.mn-reveal` and released the first
 * time it enters the viewport; it never re-hides, so scrolling back up does not
 * replay the animation. Without IntersectionObserver it reveals immediately.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  id,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      element.dataset.revealed = "true";
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.revealed = "true";
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      id={id}
      className={cx("mn-reveal", className)}
      style={{ "--mn-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

/** Hero content that animates in on load rather than on scroll. */
export function HeroIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={cx("mn-hero-in", className)}
      style={{ "--mn-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
