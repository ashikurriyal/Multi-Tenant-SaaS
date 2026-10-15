import { refreshAccessToken } from "./api/session";
import { userApi } from "./api/userApi";
import { loggedOut, sessionLoading, setAccessToken, setUser } from "./features/authSlice";
import type { AppDispatch } from "./store";

let started: Promise<void> | null = null;

// SRS section 17.3: restore the session once per page load from the refresh cookie
export function bootstrapSession(dispatch: AppDispatch) {
  started ??= (async () => {
    dispatch(sessionLoading());

    const token = await refreshAccessToken();
    if (!token) {
      dispatch(loggedOut());
      return;
    }
    dispatch(setAccessToken(token));

    const me = await dispatch(userApi.endpoints.getMe.initiate()).unwrap();
    dispatch(setUser({ id: me.id, name: me.name, email: me.email, platformRole: me.platformRole }));
  })().catch(() => {
    dispatch(loggedOut());
  });
  return started;
}
