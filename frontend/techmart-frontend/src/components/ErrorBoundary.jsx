import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("React Error Boundary caught:", error.message, error.stack, info);
    this.setState({ error });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: "24px", textAlign: "center" }}>
          <p style={{ fontSize: "48px", margin: "0 0 16px" }}>⚠️</p>
          <h2 style={{ color: "var(--text-primary)", margin: "0 0 8px" }}>Something went wrong</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: "0 0 24px" }}>An unexpected error occurred on this page.</p>
          {this.state.error && <p style={{ color: "#f87171", fontSize: "11px", fontFamily: "monospace", background: "rgba(0,0,0,0.3)", padding: "8px", borderRadius: "6px", margin: "0 0 16px", wordBreak: "break-all" }}>{this.state.error.message}</p>}
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = "/"; }}
            style={{ padding: "12px 24px", background: "linear-gradient(135deg, #f97316, #dc2626)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}
          >
            Go Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
