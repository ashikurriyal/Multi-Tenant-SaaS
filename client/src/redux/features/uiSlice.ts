import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type UiState = {
  sidebarOpen: boolean;
  dismissedBanners: string[];
};

const initialState: UiState = { sidebarOpen: false, dismissedBanners: [] };

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    dismissBanner: (state, action: PayloadAction<string>) => {
      if (!state.dismissedBanners.includes(action.payload)) {
        state.dismissedBanners.push(action.payload);
      }
    },
  },
});

export const { setSidebarOpen, dismissBanner } = uiSlice.actions;
export default uiSlice.reducer;
