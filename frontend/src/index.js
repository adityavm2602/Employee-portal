// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('App crashed:', error, info);
    this.setState({ info });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: '#0f172a', padding: '2rem'
        }}>
          <div style={{
            background: '#1e293b', border: '1px solid #ef4444',
            borderRadius: '12px', padding: '2rem', maxWidth: '800px', width: '100%'
          }}>
            <h1 style={{ color: '#ef4444', margin: '0 0 1rem', fontSize: '1.5rem' }}>
              ⚠️ App Error Detected
            </h1>
            <p style={{ color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              The following error crashed the app:
            </p>
            <pre style={{
              background: '#0f172a', color: '#f87171', padding: '1rem',
              borderRadius: '8px', overflow: 'auto', fontSize: '0.8rem',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word'
            }}>
              {this.state.error?.toString()}
              {'\n\n'}
              {this.state.info?.componentStack}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
