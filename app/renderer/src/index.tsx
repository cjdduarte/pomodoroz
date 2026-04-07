import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { ErrorBoundary } from "components";
import store from "store";
import App from "./App";

import "index.css";
import "./extensions";
import "./i18n";

const appElement = document.getElementById("app");

if (!appElement) {
  throw new Error('App root element with id "app" was not found.');
}

const root = createRoot(appElement);
root.render(
  <Provider store={store}>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </Provider>
);
