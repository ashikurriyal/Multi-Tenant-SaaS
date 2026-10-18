import { refreshSession } from "./api/session";
import { userApi } from "./api/userApi";
import {
  loggedOut,
  sessionLoading,
  sessionRestored,
  setAccessToken,
  setUser,
} from "./features/authSlice";
import type { AppDispatch } from "./store";

let started: Promise<void> | null = null;

// SRS section 17.3: restore the session once per page load from the refresh cookie
export function bootstrapSession(dispatch: AppDispatch) {
  started ??= (async () => {
    dispatch(sessionLoading());

    const session = await refreshSession(true);
    if (!session) {
      dispatch(loggedOut());
      return;
    }
    dispatch(setAccessToken(session.accessToken));

    try {
      // Normally the refresh brought the account along; otherwise ask for it
      const me = session.me ?? (await dispatch(userApi.endpoints.getMe.initiate()).unwrap());
      if (session.me) dispatch(userApi.util.upsertQueryData("getMe", undefined, session.me));
      dispatch(
        setUser({ id: me.id, name: me.name, email: me.email, platformRole: me.platformRole }),
      );
    } catch (err) {
      // Only a rejected session signs the user out; any other failure is retried on the page
      if ((err as { status?: unknown }).status === 401) dispatch(loggedOut());
      else dispatch(sessionRestored());
    }
  })().catch(() => {
    dispatch(loggedOut());
  });
  return started;
}
