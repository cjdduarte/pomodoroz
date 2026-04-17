import React, { type PropsWithChildren } from "react";

type ErrorBoundaryState = {
  hasError: boolean;
};

class ErrorBoundary extends React.Component<
  PropsWithChildren,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("[Renderer] Unhandled UI error.", error);
  }

  onReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <main
          role="alert"
          style={{
            padding: "2.4rem",
            fontFamily: "Noto-Sans, sans-serif",
          }}
        >
          <h1 style={{ fontSize: "2rem", marginBottom: "0.8rem" }}>
            Something went wrong.
          </h1>
          <p style={{ fontSize: "1.4rem", marginBottom: "1.2rem" }}>
            Try reloading the app.
          </p>
          <button
            style={{
              border: "1px solid currentColor",
              borderRadius: "4px",
              background: "transparent",
              cursor: "pointer",
              fontSize: "1.3rem",
              padding: "0.8rem 1.2rem",
            }}
            onClick={this.onReload}
            type="button"
          >
            Reload
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
