import { Component, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
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

  render() {
    if (this.state.error) {
      return (
        <div role="alert">
          <p>The passport form couldn&apos;t be loaded. Please reload the page to try again.</p>
          {/* The Module Federation runtime keeps a failed remote module failed for the life of
              the page, so retrying in place rethrows the same error. A reload starts fresh. */}
          <button type="button" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
