import type {
  ToMainChannel,
  ToMainPayloadMap,
} from "@pomodoroz/shareables";

/**
 * Explicitly for calling invokes from the trigger rather than a setting change.
 */
export type InvokeConnector = {
  send: <C extends ToMainChannel>(
    event: C,
    ...payload: ToMainPayloadMap[C]
  ) => void;
};
