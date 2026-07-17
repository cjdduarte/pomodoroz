import { createSlice } from "@reduxjs/toolkit";
import { getFromStorage } from "utils";
import { dragList } from "../tasks";
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
  extraReducers: (builder) => {
    builder.addCase(dragList, (state, action) => {
      if (
        !state ||
        action.payload.type === "list" ||
        action.payload.sourceId === action.payload.destinationId ||
        action.payload.sourceId !== state.listId ||
        action.payload.draggableId !== state.cardId
      ) {
        return;
      }

      return {
        ...state,
        listId: action.payload.destinationId,
      };
    });
  },
});

export const { setTaskSelection, clearTaskSelection } =
  taskSelectionSlice.actions;

export type { TaskSelection };

export default taskSelectionSlice.reducer;
