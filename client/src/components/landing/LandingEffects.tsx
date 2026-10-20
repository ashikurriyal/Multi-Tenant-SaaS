"use client";

import { useEffect } from "react";

// State is kept in data-* attributes (data-reveal, data-intro, data-off), never in
// className: React rewrites className whenever a component re-renders with a new one, which
// would silently undo a reveal (the FAQ panel vanished that way). The components style those
// states with Tailwind data variants, e.g. data-[reveal=in]:animate-reveal (see ui.ts).
//
// Page-wide behaviour for the landing page, all skipped for visitors who prefer reduced
// motion: reveal-on-enter for .rv blocks, one-time intros for [data-lf-io] sections and the
// revenue chart, pausing the hero while it is off screen, and the spotlight leaning toward
// the cursor. Scrolling itself is left to the browser: it runs off the main thread, so the
// hero's animations can never make it stutter. Anchor links glide with CSS scroll-behavior
// and the progress line is a CSS scroll-driven animation (scroll-progress).
export default function LandingEffects() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.querySelector<HTMLElement>("[data-landing]");
    if (!root) return;
    const cleanups: (() => void)[] = [];

    // Reveal: hidden until in view; elements entering together are staggered top-to-bottom,
    // left-to-right
    const reveal = new IntersectionObserver(
      (entries) => {
        entries
          .filter((en) => en.isIntersecting)
          .map((en) => en.target as HTMLElement)
          .sort((a, b) => {
            const [ra, rb] = [a.getBoundingClientRect(), b.getBoundingClientRect()];
            return ra.top - rb.top || ra.left - rb.left;
          })
          .forEach((el, i) => {
            el.style.animationDelay = `${Math.min(i, 6) * 70}ms`;
            el.dataset.reveal = "in";
            reveal.unobserve(el);
          });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    root.querySelectorAll<HTMLElement>(".rv").forEach((el) => {
      el.dataset.reveal = "pending";
      reveal.observe(el);
    });
    cleanups.push(() => reveal.disconnect());

    // Intros that play once, fully, when their section is in view
    const intro = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (!en.isIntersecting) continue;
          (en.target as HTMLElement).dataset.intro = "play";
          intro.unobserve(en.target);
        }
      },
      { threshold: 0.25 },
    );
    root.querySelectorAll('[data-lf="revfig"], [data-lf-io]').forEach((el) => {
      (el as HTMLElement).dataset.intro = "pending";
      intro.observe(el);
    });
    cleanups.push(() => intro.disconnect());

    // The hero's animations pause while it is off screen (pause-when-off in styles/landing.css)
    const hero = document.getElementById("top");
    if (hero) {
      const heroSeen = new IntersectionObserver(([en]) =>
        hero.toggleAttribute("data-off", !en.isIntersecting),
      );
      heroSeen.observe(hero);
      cleanups.push(() => heroSeen.disconnect());
    }

    // Spotlight tilt, applied at most once per frame
    const beam = root.querySelector<HTMLElement>('[data-lf="herobg"]');
    if (hero && beam) {
      let tiltFrame = 0;
      let tilt = "0deg";
      const apply = () => {
        tiltFrame = 0;
        beam.style.setProperty("--tilt", tilt);
      };
      const move = (e: PointerEvent) => {
        const r = hero.getBoundingClientRect();
        tilt = `${(-((e.clientX - r.left) / r.width - 0.5) * 9).toFixed(2)}deg`;
        if (!tiltFrame) tiltFrame = requestAnimationFrame(apply);
      };
      const leave = () => {
        tilt = "0deg";
        if (!tiltFrame) tiltFrame = requestAnimationFrame(apply);
      };
      hero.addEventListener("pointermove", move);
      hero.addEventListener("pointerleave", leave);
      cleanups.push(() => {
        cancelAnimationFrame(tiltFrame);
        hero.removeEventListener("pointermove", move);
        hero.removeEventListener("pointerleave", leave);
      });
    }

    return () => {
      cleanups.forEach((fn) => fn());
      root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => delete el.dataset.reveal);
    };
  }, []);

  return null;
}
