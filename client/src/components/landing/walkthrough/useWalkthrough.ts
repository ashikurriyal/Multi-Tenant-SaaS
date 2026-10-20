"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CARD, FINAL, FREE_LIMIT, PRO_LIMIT, START, ok, rejected } from "./script";
import type { FeedEntry, Scene, State, Target } from "./script";

// Runs the walkthrough script (about 16 s, looping) while the mock is on screen. The cursor
// aims at the real buttons inside appRef, so the mock can be any size.
export function useWalkthrough() {
  const [s, setS] = useState<State>({ ...START, cx: 620, cy: 420, mode: "play", paused: false });
  const set = useCallback((patch: Partial<State> | ((prev: State) => Partial<State>)) => {
    setS((prev) => ({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }));
  }, []);
  const appRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pausedRef = useRef(false);

  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  // The cursor aims at the centre of the real button, measured in the app's own pixels
  const moveTo = useCallback(
    (name: Target) => {
      const app = appRef.current;
      const el = app?.querySelector<HTMLElement>(`[data-lf="${name}"]`);
      if (!app || !el) return;
      const a = app.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const scale = a.width / (app.offsetWidth || a.width) || 1;
      set({
        cx: (r.left - a.left + r.width / 2) / scale,
        cy: (r.top - a.top + r.height / 2) / scale,
      });
    },
    [set],
  );

  const runLoop = useCallback(() => {
    const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));
    const click = (ms: number, press: Scene["press"], then: () => void) => {
      at(ms, () => set({ clicking: true, press }));
      at(ms + 150, () => {
        set({ press: "" });
        then();
      });
      at(ms + 520, () => set({ clicking: false }));
    };
    const moveIdle = () => {
      const app = appRef.current;
      set({ cx: (app?.offsetWidth ?? 1072) * 0.66, cy: (app?.offsetHeight ?? 600) * 0.78 });
    };
    const push = (entry: FeedEntry, extra: Partial<Scene> = {}) =>
      set((p) => ({ ...extra, feed: [entry, ...p.feed].slice(0, 7) }));

    // One pass of the script; the last step schedules the next pass
    function loop() {
      clear();
      set({ ...START });
      at(30, moveIdle);
      // Initech's app reports usage until the Free limit holds
      for (let k = 0; k < 6; k++) {
        at(500 + k * 300, () => push(ok(10), { used: Math.min(FREE_LIMIT, 950 + k * 10) }));
      }
      at(2400, () => push(rejected(), { limitHit: true }));
      at(2800, () => push(rejected()));
      // Upgrade
      at(3100, () => moveTo("upgrade"));
      click(4050, "upgrade", () => set({ scene: "billing" }));
      at(4700, () => moveTo("choose"));
      click(5650, "choose", () => set({ checkout: true }));
      at(6250, () => moveTo("card"));
      click(7150, "card", () => set({ cardFocus: true }));
      for (let i = 1; i <= CARD.length; i++) {
        at(7350 + i * 55, () => set({ cardText: CARD.slice(0, i) }));
      }
      at(8650, () => set({ cardFocus: false }));
      at(8700, () => moveTo("pay"));
      click(9650, "pay", () => set({ paying: true }));
      // Stripe confirms; the webhook flips the plan and usage flows again
      at(10900, () =>
        set({
          checkout: false,
          paying: false,
          cardText: "",
          scene: "dash",
          plan: "pro",
          limit: PRO_LIMIT,
          limitHit: false,
          toast: true,
        }),
      );
      at(11000, moveIdle);
      for (let k = 0; k < 5; k++) {
        at(11500 + k * 380, () => push(ok(10), { used: 1010 + k * 10 }));
      }
      at(14200, () => set({ toast: false }));
      at(16600, loop);
    }
    loop();
  }, [clear, moveTo, set]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time switch to the still frame
      set({ ...FINAL, mode: "static" });
      return;
    }
    // Runs only while on screen: no timers or re-renders once the visitor scrolls past it
    const app = appRef.current;
    if (!app || typeof IntersectionObserver === "undefined") {
      runLoop();
      return clear;
    }
    const seen = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) clear();
      else if (!pausedRef.current) runLoop();
    });
    seen.observe(app);
    return () => {
      seen.disconnect();
      clear();
    };
  }, [clear, runLoop, set]);

  const togglePause = () => {
    pausedRef.current = !s.paused;
    if (s.paused) {
      set({ paused: false });
      runLoop();
    } else {
      clear();
      set({ ...FINAL, paused: true, clicking: false, press: "" });
    }
  };

  return { s, appRef, togglePause };
}
