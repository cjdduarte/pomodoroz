import ReactDOMServer from "react-dom/server";
import type { ReactElement } from "react";

export function encodeSvg(reactElement: ReactElement) {
  return (
    "data:image/svg+xml," +
    escape(ReactDOMServer.renderToStaticMarkup(reactElement))
  );
}
