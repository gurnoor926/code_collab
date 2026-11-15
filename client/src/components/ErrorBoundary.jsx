
import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Application runtime error:", error);
    console.error("Component stack:", errorInfo.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 text-white">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-white/5 p-8 text-center">
            <div className="mb-4 text-4xl">⚠️</div>

            <h1 className="mb-2 text-xl font-semibold">
              Something went wrong
            </h1>

            <p className="mb-6 text-sm text-gray-400">
              An unexpected error occurred. Reload the application
              to continue.
            </p>

            <button
              onClick={this.handleReload}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium transition hover:bg-indigo-500"
            >
              Reload application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
