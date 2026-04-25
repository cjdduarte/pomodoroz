import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getFromStorage } from "utils";

export type UpdateTypes = {
  updateVersion: string;
};

type UploadPayload<T extends keyof UpdateTypes> = PayloadAction<
  UpdateTypes[T]
>;

const defaultUpdateStatus: Readonly<UpdateTypes> = Object.freeze({
  updateVersion: "",
});

const storedState = getFromStorage<{ update?: Partial<UpdateTypes> }>(
  "state"
);
const updateStatus: UpdateTypes = {
  updateVersion:
    typeof storedState?.update?.updateVersion === "string"
      ? storedState.update.updateVersion
      : defaultUpdateStatus.updateVersion,
};

const initialState: UpdateTypes = updateStatus;

const updateSlice = createSlice({
  name: "update",
  initialState,
  reducers: {
    setUpdateVersion(state, action: UploadPayload<"updateVersion">) {
      state.updateVersion = action.payload;
    },
  },
});

export const { setUpdateVersion } = updateSlice.actions;

export default updateSlice.reducer;
