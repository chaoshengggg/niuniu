import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('ErrorBoundary caught:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, textAlign: 'center', color: '#aaa' }}>
          <p>Something went wrong.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              marginTop: 12,
              padding: '8px 20px',
              borderRadius: 8,
              background: '#333',
              color: '#fff',
              border: 'none',
              fontSize: '0.9rem',
            }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
