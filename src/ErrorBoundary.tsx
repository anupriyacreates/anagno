import { Component, type ErrorInfo, type ReactNode } from "react";

interface State {
  error: Error | null;
}

/**
 * Catches render-time errors so the app shows a readable message instead of a
 * blank white screen. Helps diagnose "nothing loads" situations.
 */
export default class ErrorBoundary extends Component<
  { children: ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Research Diver crashed:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: "system-ui, sans-serif" }}>
          <h1 style={{ color: "#b91c1c" }}>🤿 Something broke on the surface</h1>
          <p>The app hit a runtime error while rendering:</p>
          <pre
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              padding: 16,
              whiteSpace: "pre-wrap",
              color: "#7f1d1d",
            }}
          >
            {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack}
          </pre>
          <p style={{ color: "#475569" }}>
            Open the browser devtools console for the full trace, and share it if
            you want help.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
