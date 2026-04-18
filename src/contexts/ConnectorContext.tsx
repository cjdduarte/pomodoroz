import React, { type PropsWithChildren } from "react";
import { TauriConnectorProvider } from "./connectors/TauriConnector";
import {
  getRuntimeInvokeConnector,
  getRuntimeKind,
} from "./connectors/runtimeInvokeConnector";

export type ConnectorProps = {
  onMinimizeCallback?: () => void;
  onExitCallback?: () => void;
  openExternalCallback?: () => void;
  connectorError?: string | null;
  dismissConnectorError?: () => void;
};

export const ConnectorContext = React.createContext<ConnectorProps>({});

export function getInvokeConnector() {
  return getRuntimeInvokeConnector();
}

type ConnectorProviderComponent =
  React.ComponentType<PropsWithChildren>;

export const ConnectorProvider = ({ children }: PropsWithChildren) => {
  let Connector: ConnectorProviderComponent = ({ children }) => (
    <>{children}</>
  );

  const runtime = getRuntimeKind();
  if (runtime === "tauri") {
    Connector = TauriConnectorProvider;
  }

  return <Connector>{children}</Connector>;
};
