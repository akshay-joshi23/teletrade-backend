"use client";
import React from "react";

type State = { hasError: boolean; msg?: string };

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(err: unknown) {
    return { hasError: true, msg: err instanceof Error ? err.message : "Client error" };
  }
  componentDidCatch(error: unknown, info: unknown) {
    // Minimal logging to aid diagnostics; no UI change unless error occurs
    console.error("Client error boundary:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="tt-card text-red-600">
          Application error (client): {this.state.msg}
          <div className="text-xs opacity-70 mt-1">Open devtools console for stack trace.</div>
        </div>
      );
    }
    return this.props.children;
  }
}


