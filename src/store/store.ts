import { configureStore } from "@reduxjs/toolkit";
import debounce from "lodash.debounce";

import {
  backupCorruptStorageValue,
  readFromStorage,
  saveToStorage,
} from "utils";
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

type PersistenceFailureListener = () => void;

const persistenceFailureListeners =
  new Set<PersistenceFailureListener>();
// Falha de gravação no boot acontece antes de qualquer listener; entrega na inscrição.
let hasPendingPersistenceFailure = false;

export const subscribePersistenceFailures = (
  listener: PersistenceFailureListener
) => {
  persistenceFailureListeners.add(listener);

  if (hasPendingPersistenceFailure) {
    hasPendingPersistenceFailure = false;
    listener();
  }

  return () => {
    persistenceFailureListeners.delete(listener);
  };
};

const persistToStorage = (name: string, value: unknown) => {
  if (saveToStorage(name, value)) {
    return;
  }

  if (!persistenceFailureListeners.size) {
    hasPendingPersistenceFailure = true;
    return;
  }

  persistenceFailureListeners.forEach((listener) => listener());
};

const persistedRootStateResult = readFromStorage("state");
export const isFreshInstallProfile =
  persistedRootStateResult.status === "missing";
const canPersistRootState =
  persistedRootStateResult.status !== "corrupt" ||
  backupCorruptStorageValue("state") !== null;

if (canPersistRootState && persistedRootStateResult.status !== "ok") {
  persistToStorage("state", {
    config: store.getState().config,
    settings: store.getState().settings,
    taskSelection: store.getState().taskSelection,
    tasks: store.getState().tasks.present,
  });
}

const persistedStatisticsResult = readFromStorage(
  STATISTICS_STORAGE_KEY
);
const canPersistStatistics =
  persistedStatisticsResult.status !== "corrupt" ||
  backupCorruptStorageValue(STATISTICS_STORAGE_KEY) !== null;

if (canPersistStatistics && persistedStatisticsResult.status !== "ok") {
  persistToStorage(STATISTICS_STORAGE_KEY, store.getState().statistics);
}

const persistRootState = () => {
  if (canPersistRootState) {
    persistToStorage("state", {
      config: store.getState().config,
      settings: store.getState().settings,
      taskSelection: store.getState().taskSelection,
      tasks: store.getState().tasks.present,
    });
  }

  if (canPersistStatistics) {
    persistToStorage(
      STATISTICS_STORAGE_KEY,
      store.getState().statistics
    );
  }
};

const debouncedPersistRootState = debounce(persistRootState, 1000);

store.subscribe(() => {
  debouncedPersistRootState();
});

const flushPersistRootState = () => {
  debouncedPersistRootState.flush();
};

if (typeof window !== "undefined") {
  const flushOnPageLifecycleEvent = () => {
    flushPersistRootState();
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      flushOnPageLifecycleEvent();
    }
  };

  window.addEventListener("beforeunload", flushOnPageLifecycleEvent);
  window.addEventListener("pagehide", flushOnPageLifecycleEvent);
  document.addEventListener("visibilitychange", onVisibilityChange);
}

export default store;
