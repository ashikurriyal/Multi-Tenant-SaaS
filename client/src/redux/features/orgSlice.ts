import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { loggedOut } from "./authSlice";

// Derived from the URL slug + /users/me memberships (SRS section 17.2)
type OrgState = { activeOrgId: string | null };

const initialState: OrgState = { activeOrgId: null };

const orgSlice = createSlice({
  name: "org",
  initialState,
  reducers: {
    setActiveOrg: (state, action: PayloadAction<string | null>) => {
      state.activeOrgId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loggedOut, () => initialState);
  },
});

export const { setActiveOrg } = orgSlice.actions;
export default orgSlice.reducer;
