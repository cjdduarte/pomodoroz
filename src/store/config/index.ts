import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getFromStorage } from "utils";
import { ConfigPayload, ConfigTypes } from "./types";
import { defaultConfig } from "./defaultConfig";

const mergeConfig = (
  override: Partial<ConfigTypes> | undefined
): ConfigTypes => ({
  stayFocus: override?.stayFocus ?? defaultConfig.stayFocus,
  shortBreak: override?.shortBreak ?? defaultConfig.shortBreak,
  longBreak: override?.longBreak ?? defaultConfig.longBreak,
  sessionRounds: override?.sessionRounds ?? defaultConfig.sessionRounds,
  shortFocusExtension:
    override?.shortFocusExtension ?? defaultConfig.shortFocusExtension,
  longFocusExtension:
    override?.longFocusExtension ?? defaultConfig.longFocusExtension,
  specialBreaks: {
    ...defaultConfig.specialBreaks,
    ...override?.specialBreaks,
  },
});

const storedState = getFromStorage<{ config?: Partial<ConfigTypes> }>(
  "state"
);
const config = mergeConfig(storedState?.config);

const initialState: ConfigTypes = config;

const configSlice = createSlice({
  name: "config",
  initialState,
  reducers: {
    setStayFocus(state, action: ConfigPayload<"stayFocus">) {
      state.stayFocus = action.payload;
    },

    setShortBreak(state, action: ConfigPayload<"shortBreak">) {
      state.shortBreak = action.payload;
    },

    setLongBreak(state, action: ConfigPayload<"longBreak">) {
      state.longBreak = action.payload;
    },

    setSessionRounds(state, action: ConfigPayload<"sessionRounds">) {
      state.sessionRounds = action.payload;
    },

    setShortFocusExtension(
      state,
      action: ConfigPayload<"shortFocusExtension">
    ) {
      state.shortFocusExtension = action.payload;
    },

    setLongFocusExtension(
      state,
      action: ConfigPayload<"longFocusExtension">
    ) {
      state.longFocusExtension = action.payload;
    },

    restoreDefaultConfig() {
      return defaultConfig;
    },

    setFirstSpecialBreak(
      state,
      action: PayloadAction<ConfigTypes["specialBreaks"]["firstBreak"]>
    ) {
      state.specialBreaks.firstBreak = action.payload;
    },

    setSecondSpecialBreak(
      state,
      action: PayloadAction<ConfigTypes["specialBreaks"]["secondBreak"]>
    ) {
      state.specialBreaks.secondBreak = action.payload;
    },

    setThirdSpecialBreak(
      state,
      action: PayloadAction<ConfigTypes["specialBreaks"]["thirdBreak"]>
    ) {
      state.specialBreaks.thirdBreak = action.payload;
    },

    setFourthSpecialBreak(
      state,
      action: PayloadAction<ConfigTypes["specialBreaks"]["fourthBreak"]>
    ) {
      state.specialBreaks.fourthBreak = action.payload;
    },
  },
});

export const {
  restoreDefaultConfig,
  setFourthSpecialBreak,
  setLongBreak,
  setLongFocusExtension,
  setSecondSpecialBreak,
  setSessionRounds,
  setShortBreak,
  setShortFocusExtension,
  setStayFocus,
  setThirdSpecialBreak,
  setFirstSpecialBreak,
} = configSlice.actions;

export default configSlice.reducer;
