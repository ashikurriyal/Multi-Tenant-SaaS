"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * false on the server and during hydration, true afterwards.
 *
 * Session state lives only in the browser and can change before a nested route segment
 * hydrates (AuthBootstrap in the root layout may already have finished). Anything that
 * renders differently per session must wait for this, or the client's first render won't
 * match the server HTML (hydration mismatch).
 */
export const useHydrated = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
