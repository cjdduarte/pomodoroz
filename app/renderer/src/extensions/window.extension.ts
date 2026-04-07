import type { OpenExternalOptions } from "electron";
import type {
  ToMainChannel,
  FromMainChannel,
  InvokeMainChannel,
  ToMainPayloadMap,
  FromMainPayloadMap,
  InvokeMainPayloadMap,
  InvokeMainResponseMap,
} from "@pomodoroz/shareables";

declare global {
  interface Window {
    isUserHaveSession?: () => boolean;
    electron: {
      send: <C extends ToMainChannel>(
        channel: C,
        ...args: ToMainPayloadMap[C]
      ) => void;
      receive: <C extends FromMainChannel>(
        channel: C,
        response: (...args: FromMainPayloadMap[C]) => void
      ) => () => void;
      invoke: <C extends InvokeMainChannel>(
        channel: C,
        ...args: InvokeMainPayloadMap[C]
      ) => Promise<InvokeMainResponseMap[C]>;
      openExternal: (
        url: string,
        options?: OpenExternalOptions
      ) => Promise<void>;
    };
  }
}

export {};
