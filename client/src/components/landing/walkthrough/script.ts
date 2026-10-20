// The walkthrough's data: the scene state, the start and final frames, and the API feed
// entries. The timing of the script itself lives in useWalkthrough.

export type FeedEntry = { code: "202" | "429"; text: string };
export type Scene = {
  scene: "dash" | "billing";
  plan: "free" | "pro";
  used: number;
  limit: number;
  limitHit: boolean;
  feed: FeedEntry[];
  checkout: boolean;
  cardText: string;
  cardFocus: boolean;
  paying: boolean;
  toast: boolean;
  clicking: boolean;
  press: "" | "upgrade" | "choose" | "card" | "pay";
};
export type State = Scene & { cx: number; cy: number; mode: "play" | "static"; paused: boolean };
export type Target = "upgrade" | "choose" | "card" | "pay";

export const CARD = "4242 4242 4242 4242";
export const FREE_LIMIT = 1000;
export const PRO_LIMIT = 50000;
export const ok = (units: number): FeedEntry => ({
  code: "202",
  text: `documents_processed · +${units}`,
});
export const rejected = (): FeedEntry => ({ code: "429", text: "PLAN_LIMIT_USAGE · rejected" });

export const START: Scene = {
  scene: "dash",
  plan: "free",
  used: 940,
  limit: FREE_LIMIT,
  limitHit: false,
  feed: [ok(10), ok(10), ok(10), ok(10)],
  checkout: false,
  cardText: "",
  cardFocus: false,
  paying: false,
  toast: false,
  clicking: false,
  press: "",
};
export const FINAL: Scene = {
  ...START,
  plan: "pro",
  used: 1050,
  limit: PRO_LIMIT,
  feed: [ok(10), ok(10), ok(10), ok(10), ok(10), rejected(), rejected()],
};
