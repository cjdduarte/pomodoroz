import type { InvokeConnector } from "../InvokeConnector";
import { TauriInvokeConnector } from "./TauriInvokeConnector";

export const getRuntimeInvokeConnector = (): InvokeConnector =>
  TauriInvokeConnector;
