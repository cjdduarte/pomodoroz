import { configureStore } from "@reduxjs/toolkit";
import debounce from "lodash.debounce";

import { saveToStorage, getFromStorage } from "utils";
import configReducer from "./config";
import settingReducer from "./settings";
import statisticsReducer from "./statistics";
import { STATISTICS_STORAGE_KEY } from "./statistics";
import taskSelectionReducer from "./taskSelection";
import timerReducer from "./timer";
import tasksReducer from "./tasks";
import updateReducer from "./update";

export type AppStateTypes = ReturnType<typeof store.getState>;
export type AppDispatchTypes = typeof store.dispatch;

const store = configureStore({
  reducer: {
    config: configReducer,
    settings: settingReducer,
    statistics: statisticsReducer,
    taskSelection: taskSelectionReducer,
    timer: timerReducer,
    tasks: tasksReducer,
    update: updateReducer,
  },
});

if (!getFromStorage("state")) {
  saveToStorage("state", {
    config: store.getState().config,
    settings: store.getState().settings,
    taskSelection: store.getState().taskSelection,
    tasks: store.getState().tasks.present,
  });
}

if (!getFromStorage(STATISTICS_STORAGE_KEY)) {
  saveToStorage(STATISTICS_STORAGE_KEY, store.getState().statistics);
}

store.subscribe(
  debounce(() => {
    saveToStorage("state", {
      config: store.getState().config,
      settings: store.getState().settings,
      taskSelection: store.getState().taskSelection,
      tasks: store.getState().tasks.present,
    });
    saveToStorage(STATISTICS_STORAGE_KEY, store.getState().statistics);
  }, 1000)
);

export default store;
