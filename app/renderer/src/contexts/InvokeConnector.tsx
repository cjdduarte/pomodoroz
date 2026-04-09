import type {
  FromMainChannel,
  FromMainPayloadMap,
  InvokeMainChannel,
  InvokeMainPayloadMap,
  InvokeMainResponseMap,
  ToMainChannel,
  ToMainPayloadMap,
} from "ipc";

/**
 * Explicitly for calling invokes from the trigger rather than a setting change.
 */
export type InvokeConnector = {
  send: <C extends ToMainChannel>(
    event: C,
    ...payload: ToMainPayloadMap[C]
  ) => void;
  receive: <C extends FromMainChannel>(
    event: C,
    response: (...payload: FromMainPayloadMap[C]) => void
  ) => () => void;
  invoke: <C extends InvokeMainChannel>(
    event: C,
    ...payload: InvokeMainPayloadMap[C]
  ) => Promise<InvokeMainResponseMap[C]>;
};
