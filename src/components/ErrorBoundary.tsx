import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center bg-bg">
          <div className="flex flex-col items-center gap-4 max-w-md text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-danger-muted flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-danger" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text mb-1">Something went wrong</h2>
              <p className="text-sm text-text-secondary">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
            </div>
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 px-4 py-2 bg-bg-surface border border-border rounded-lg text-sm font-medium text-text hover:border-border-hover transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
