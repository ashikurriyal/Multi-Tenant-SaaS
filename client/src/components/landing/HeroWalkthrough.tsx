"use client";

import GlowFrame from "./GlowFrame";
import Billing from "./walkthrough/Billing";
import BrowserBar from "./walkthrough/BrowserBar";
import Checkout from "./walkthrough/Checkout";
import Cursor from "./walkthrough/Cursor";
import Dashboard from "./walkthrough/Dashboard";
import PageHeader from "./walkthrough/PageHeader";
import Sidebar from "./walkthrough/Sidebar";
import Toast from "./walkthrough/Toast";
import { useWalkthrough } from "./walkthrough/useWalkthrough";

// The hero's scripted product walkthrough (about 16 s, looping): Initech's Free workspace
// reports usage until the limit holds, upgrades to Pro with a test card, and usage flows
// again once Stripe confirms. Visitors who prefer reduced motion see the final state.
//
// Everything inside the app is sized in em off one font size (1/67 of the frame's width,
// a container query unit), so the whole mock scales like a screenshot. The parts live in
// ./walkthrough; the script and its state are in useWalkthrough.
export default function HeroWalkthrough() {
  const { s, appRef, togglePause } = useWalkthrough();
  const playing = s.mode === "play";

  return (
    <GlowFrame wide>
      <div className="@container relative overflow-hidden rounded-[16px] border border-frame bg-white shadow-[0_30px_80px_-30px_rgba(11,18,21,0.35)]">
        <div
          role="img"
          aria-label="Animated walkthrough of LedgerFlow: a Free workspace reports usage through the API until it hits its limit, upgrades to Pro with a test card, and usage flows again once Stripe confirms the payment"
        >
          <div aria-hidden className="text-left text-[calc(100cqw/67)] leading-tight select-none">
            <BrowserBar scene={s.scene} />
            <div
              ref={appRef}
              data-lf="app"
              className="relative flex h-[37.4em] overflow-hidden bg-white"
            >
              <Sidebar scene={s.scene} />
              <div className="flex min-w-0 flex-1 flex-col gap-[1.1em] px-[2em] py-[1.75em]">
                <PageHeader scene={s.scene} pro={s.plan === "pro"} />
                {s.scene === "dash" ? <Dashboard s={s} /> : <Billing press={s.press} />}
              </div>
              {s.checkout && <Checkout s={s} />}
              {s.toast && <Toast />}
              {playing && <Cursor x={s.cx} y={s.cy} clicking={s.clicking} pressed={!!s.press} />}
            </div>
          </div>
        </div>
        {playing && (
          <button
            type="button"
            onClick={togglePause}
            aria-pressed={s.paused}
            className="absolute bottom-3 left-3 inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-full border border-line-strong bg-white/92 px-3 py-1 text-[12.5px] text-ink-soft max-[640px]:bottom-2 max-[640px]:left-2 max-[640px]:min-h-6.5 max-[640px]:px-2.5 max-[640px]:text-[11px]"
          >
            {s.paused ? "Play animation" : "Pause animation"}
          </button>
        )}
      </div>
    </GlowFrame>
  );
}
