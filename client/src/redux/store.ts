import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./api/baseApi";
import authReducer from "./features/authSlice";
import orgReducer from "./features/orgSlice";
import uiReducer from "./features/uiSlice";

// One store per browser session, created in StoreProvider (never shared between requests)
export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      org: orgReducer,
      ui: uiReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
