import { Component, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  onRetry: () => void;
};

type State = {
  error: Error | null;
};

// Keeps a failed remote load inside its own section instead of unmounting the whole host.
export default class RemoteErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  private handleRetry = () => {
    this.setState({ error: null });
    this.props.onRetry();
  };

  render() {
    if (this.state.error) {
      return (
        <div role="alert">
          <p>The passport form couldn&apos;t be loaded. Check your connection and try again.</p>
          <button type="button" onClick={this.handleRetry}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
