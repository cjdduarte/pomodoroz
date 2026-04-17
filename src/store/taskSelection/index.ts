import { createSlice } from "@reduxjs/toolkit";
import { getFromStorage } from "utils";
import type { TaskSelection, TaskSelectionPayload } from "./types";

const storedState = getFromStorage<{
  taskSelection?: TaskSelection | null;
}>("state");

const initialState: TaskSelection | null =
  storedState?.taskSelection ?? null;

const taskSelectionSlice = createSlice({
  name: "taskSelection",
  initialState,
  reducers: {
    setTaskSelection(_, action: TaskSelectionPayload) {
      return action.payload;
    },

    clearTaskSelection() {
      return null;
    },
  },
});

export const { setTaskSelection, clearTaskSelection } =
  taskSelectionSlice.actions;

export type { TaskSelection };

export default taskSelectionSlice.reducer;
