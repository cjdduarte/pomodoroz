import React, { type PropsWithChildren } from "react";
import { TauriConnectorProvider } from "./connectors/TauriConnector";
import { getRuntimeInvokeConnector } from "./connectors/runtimeInvokeConnector";

export type ConnectorProps = {
  onMinimizeCallback?: () => void;
  onExitCallback?: () => void;
  onTitlebarDragStart?: () => void;
  openExternalCallback?: () => void;
  connectorError?: string | null;
  dismissConnectorError?: () => void;
};

export const ConnectorContext = React.createContext<ConnectorProps>({});

export function getInvokeConnector() {
  return getRuntimeInvokeConnector();
}

export const ConnectorProvider = ({ children }: PropsWithChildren) => {
  return <TauriConnectorProvider>{children}</TauriConnectorProvider>;
};
