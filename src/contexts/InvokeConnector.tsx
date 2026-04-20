import type {
  FromMainChannel,
  FromMainPayloadMap,
  ToMainChannel,
  ToMainPayloadMap,
} from "ipc";
export type InvokeConnector = {
  send: <C extends ToMainChannel>(
    event: C,
    ...payload: ToMainPayloadMap[C]
  ) => void;
  receive: <C extends FromMainChannel>(
    event: C,
    response: (...payload: FromMainPayloadMap[C]) => void
  ) => () => void;
};
