import React, { Suspense, useEffect } from "react";
import { HashRouter as Router, Routes, Route } from "react-router";
import { StyleSheetManager } from "styled-components";
import isPropValid from "@emotion/is-prop-valid";
import {
  ThemeProvider,
  CounterProvider,
  ConnectorProvider,
} from "contexts";
import { Layout, Preloader } from "components";
import { compactRoutes, routes } from "config";
import { useLanguageSync } from "hooks";
import { useAppDispatch, useAppSelector } from "hooks/storeHooks";
import { setEnableCompactMode } from "store";

const COMPACT_EXIT_PATHS = [
  "/task-list",
  "/config",
  "/settings",
  "/statistics",
];

const BLOCKED_DOM_STYLE_PROPS = new Set([
  "noTransition",
  "useNativeTitlebar",
  "fullscreen",
  "hours",
  "timerType",
  "compact",
  "success",
  "minValue",
  "maxValue",
  "isDragging",
  "priority",
  "focused",
  "done",
]);

const shouldForwardStyledProp = (propName: string, target: unknown) => {
  if (typeof target === "string") {
    return (
      isPropValid(propName) && !BLOCKED_DOM_STYLE_PROPS.has(propName)
    );
  }

  return true;
};

const CompactModeExitRoute: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setEnableCompactMode(false));
  }, [dispatch]);

  return <Preloader />;
};

export default function App() {
  const settings = useAppSelector((state) => state.settings);
  useLanguageSync();

  useEffect(() => {
    const contextEvent = (event: MouseEvent) => {
      if (event.target) {
        let target = event.target as HTMLElement;
        if (
          target.tagName === "TEXTAREA" ||
          (target.tagName === "INPUT" &&
            (target as HTMLInputElement).type === "text")
        ) {
          return true;
        }
      }
      event.preventDefault();
      return false;
    };
    document.addEventListener("contextmenu", contextEvent);
    return () =>
      document.removeEventListener("contextmenu", contextEvent);
  }, []);

  useEffect(() => {
    const middleMouseEvent = (event: MouseEvent) => {
      if (event.button === 1) event.preventDefault();
    };
    window.addEventListener("auxclick", middleMouseEvent);

    return () =>
      window.removeEventListener("auxclick", middleMouseEvent);
  }, []);

  return (
    <StyleSheetManager shouldForwardProp={shouldForwardStyledProp}>
      <ThemeProvider>
        <CounterProvider>
          <ConnectorProvider>
            <Router>
              <Layout>
                <Suspense fallback={<Preloader />}>
                  <Routes>
                    {(settings["compactMode"]
                      ? compactRoutes
                      : routes()
                    ).map(({ path, component: Component }) => (
                      <Route
                        path={path}
                        element={<Component />}
                        key={path}
                      />
                    ))}
                    {settings["compactMode"] && (
                      <>
                        {COMPACT_EXIT_PATHS.map((path) => (
                          <Route
                            key={`compact-exit-${path}`}
                            path={path}
                            element={<CompactModeExitRoute />}
                          />
                        ))}
                      </>
                    )}
                  </Routes>
                </Suspense>
              </Layout>
            </Router>
          </ConnectorProvider>
        </CounterProvider>
      </ThemeProvider>
    </StyleSheetManager>
  );
}
