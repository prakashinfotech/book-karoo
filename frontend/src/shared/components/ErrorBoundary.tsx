import { Component } from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8">
        <span className="text-5xl" aria-hidden="true">😵</span>
        <h2 className="font-display font-bold text-xl text-text-primary">
          Something went wrong
        </h2>
        <p className="text-text-muted text-sm font-sans max-w-sm text-center">
          {this.state.error?.message ?? 'An unexpected error occurred.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-full bg-accent-crimson text-white text-sm font-semibold font-sans hover:-translate-y-0.5 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }
}
