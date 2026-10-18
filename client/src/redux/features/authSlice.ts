import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "@/types/api";

// idle → loading (AuthBootstrap) → authenticated | unauthenticated
export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

type AuthState = {
  // Kept in memory only, never in localStorage (NFR-SEC-02)
  accessToken: string | null;
  user: AuthUser | null;
  status: AuthStatus;
  // Where a deliberate logout goes (e.g. /register from the demo banner). Unset when the
  // session simply ended, so the guards send the user to /login?next=<this page>
  afterLogout: string | null;
};

const initialState: AuthState = {
  accessToken: null,
  user: null,
  status: "idle",
  afterLogout: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    sessionLoading: (state) => {
      state.status = "loading";
    },
    setCredentials: (state, action: PayloadAction<{ accessToken: string; user: AuthUser }>) => {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.status = "authenticated";
      state.afterLogout = null;
    },
    // The refresh worked but the account couldn't be loaded (API error, network): still
    // signed in, so the page can offer a retry instead of a needless trip to /login
    sessionRestored: (state) => {
      state.status = "authenticated";
    },
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },
    setUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
      state.status = "authenticated";
    },
    loggedOut: (_state, action: PayloadAction<string | undefined>) => ({
      ...initialState,
      status: "unauthenticated" as const,
      afterLogout: action.payload ?? null,
    }),
  },
});

export const {
  sessionLoading,
  setCredentials,
  sessionRestored,
  setAccessToken,
  setUser,
  loggedOut,
} = authSlice.actions;
export default authSlice.reducer;
