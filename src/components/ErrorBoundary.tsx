import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            background: "#0f1419",
            color: "#fff",
            padding: "2rem",
          }}
        >
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Something went wrong</h1>
          <p style={{ maxWidth: "28rem", textAlign: "center", opacity: 0.6, fontSize: "0.875rem" }}>
            {this.state.error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              borderRadius: "0.75rem",
              background: "#16a34a",
              padding: "0.75rem 1.5rem",
              fontWeight: 600,
              border: "none",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
