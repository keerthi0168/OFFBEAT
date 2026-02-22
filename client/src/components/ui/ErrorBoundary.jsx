import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('UI ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: 'Arial, sans-serif' }}>
          <h1 style={{ fontSize: 24, color: '#b91c1c' }}>Something went wrong.</h1>
          <p style={{ marginTop: 8, color: '#374151' }}>
            A runtime error occurred while rendering the page.
          </p>
          <pre style={{ marginTop: 12, background: '#fef2f2', padding: 12, borderRadius: 8, color: '#991b1b', whiteSpace: 'pre-wrap' }}>
            {this.state.error?.message}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;