// Class strings shared by the landing components

// Keyboard focus outline used by links and buttons on the landing page
export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

// The small uppercase label above each section heading
export const eyebrow = "text-[14px] font-semibold tracking-[0.08em] uppercase text-primary";

// Blocks that fade up as they scroll into view. LandingEffects observes .rv elements and sets
// data-reveal="pending" on them, then "in" once visible (only when motion is allowed).
export const reveal =
  "rv motion-safe:data-[reveal=pending]:opacity-0 motion-safe:data-[reveal=in]:animate-reveal";
