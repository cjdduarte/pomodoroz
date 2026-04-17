import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getFromStorage } from "utils";

export type UpdateTypes = {
  updateVersion: string;
  updateBody: string;
};

type UploadPayload<T extends keyof UpdateTypes> = PayloadAction<
  UpdateTypes[T]
>;

const defaultUpdateStatus: Readonly<UpdateTypes> = Object.freeze({
  updateBody: "",
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
  updateBody:
    typeof storedState?.update?.updateBody === "string"
      ? storedState.update.updateBody
      : defaultUpdateStatus.updateBody,
};

const initialState: UpdateTypes = updateStatus;

const updateSlice = createSlice({
  name: "update",
  initialState,
  reducers: {
    setUpdateBody(state, action: UploadPayload<"updateBody">) {
      state.updateBody = action.payload;
    },

    setUpdateVersion(state, action: UploadPayload<"updateVersion">) {
      state.updateVersion = action.payload;
    },
  },
});

export const { setUpdateBody, setUpdateVersion } = updateSlice.actions;

export default updateSlice.reducer;
