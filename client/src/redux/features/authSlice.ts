import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "@/types/api";

// idle → loading (AuthBootstrap) → authenticated | unauthenticated
export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

type AuthState = {
  // Kept in memory only, never in localStorage (NFR-SEC-02)
  accessToken: string | null;
  user: AuthUser | null;
  status: AuthStatus;
};

const initialState: AuthState = { accessToken: null, user: null, status: "idle" };

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
    },
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },
    setUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
      state.status = "authenticated";
    },
    loggedOut: () => ({ ...initialState, status: "unauthenticated" as const }),
  },
});

export const { sessionLoading, setCredentials, setAccessToken, setUser, loggedOut } =
  authSlice.actions;
export default authSlice.reducer;
