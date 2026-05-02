import { Component } from "react";

function isChunkError(error) {
  return (
    error?.name === "ChunkLoadError" ||
    error?.message?.includes("Failed to fetch dynamically imported module") ||
    error?.message?.includes("Importing a module script failed") ||
    error?.message?.includes("Loading chunk")
  );
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, chunkError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error, chunkError: isChunkError(error) };
  }

  componentDidCatch(error, info) {
    if (isChunkError(error)) {
      // New deployment invalidated old chunk hashes — hard reload fetches fresh assets
      window.location.reload();
      return;
    }
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Chunk error auto-reloads — show a neutral refreshing screen while it happens
      if (this.state.chunkError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <p className="text-slate-500 text-sm animate-pulse">Refreshing…</p>
          </div>
        );
      }

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 max-w-md w-full text-center shadow-[0_24px_60px_rgba(15,23,42,0.09)]">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-red-500">
              Unexpected Error
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">Something went wrong</h2>
            <p className="mt-3 text-slate-600 text-sm">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.replace("/")}
                className="rounded-xl bg-slate-900 px-5 py-2.5 font-semibold text-white hover:bg-slate-800"
              >
                Go home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
