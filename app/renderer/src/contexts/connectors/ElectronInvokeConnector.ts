import type {
  FromMainChannel,
  FromMainPayloadMap,
  InvokeMainChannel,
  InvokeMainPayloadMap,
  InvokeMainResponseMap,
  ToMainChannel,
  ToMainPayloadMap,
} from "ipc";
import type { InvokeConnector } from "../InvokeConnector";

export const ElectronInvokeConnector: InvokeConnector = {
  send: <C extends ToMainChannel>(
    event: C,
    ...payload: ToMainPayloadMap[C]
  ) => {
    const { electron } = window;
    if (!electron?.send) {
      console.error("[IPC] Native send API is unavailable.");
      return;
    }

    try {
      electron.send(event, ...payload);
    } catch (error) {
      console.error("[IPC] Failed to send message to main.", error);
    }
  },
  receive: <C extends FromMainChannel>(
    event: C,
    response: (...payload: FromMainPayloadMap[C]) => void
  ) => {
    const { electron } = window;
    if (!electron?.receive) {
      console.error("[IPC] Native receive API is unavailable.");
      return () => undefined;
    }

    try {
      return electron.receive(event, response);
    } catch (error) {
      console.error("[IPC] Failed to subscribe to main event.", error);
      return () => undefined;
    }
  },
  invoke: async <C extends InvokeMainChannel>(
    event: C,
    ...payload: InvokeMainPayloadMap[C]
  ): Promise<InvokeMainResponseMap[C]> => {
    const { electron } = window;
    if (!electron?.invoke) {
      throw new Error("[IPC] Native invoke API is unavailable.");
    }

    try {
      return await electron.invoke(event, ...payload);
    } catch (error) {
      console.error("[IPC] Failed to invoke main command.", error);
      throw error;
    }
  },
};
