import { Component, type ReactNode } from 'react';
import styles from './Remote.module.css';

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
        <div role="alert" className={styles.notice}>
          <p className={styles.message}>
            The passport form couldn&apos;t be loaded. Check your connection and try again.
          </p>
          <button type="button" className={styles.retry} onClick={this.handleRetry}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
