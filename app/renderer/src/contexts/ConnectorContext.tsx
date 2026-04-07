import React, { type PropsWithChildren } from "react";
import isElectron from "is-electron";
import {
  ElectronConnectorProvider,
  ElectronInvokeConnector,
} from "./connectors/ElectronConnector";

export type ConnectorProps = {
  onMinimizeCallback?: () => void;
  onExitCallback?: () => void;
  openExternalCallback?: () => void;
  connectorError?: string | null;
  dismissConnectorError?: () => void;
};

export const ConnectorContext = React.createContext<ConnectorProps>({});

export function getInvokeConnector() {
  if (isElectron()) {
    return ElectronInvokeConnector;
  }
  return undefined;
}

type ConnectorProviderComponent =
  React.ComponentType<PropsWithChildren>;

export const ConnectorProvider = ({ children }: PropsWithChildren) => {
  let Connector: ConnectorProviderComponent = ({ children }) => (
    <>{children}</>
  );
  if (isElectron()) {
    Connector = ElectronConnectorProvider;
  }

  return <Connector>{children}</Connector>;
};
