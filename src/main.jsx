import { StrictMode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import LucidApp from './LucidApp.jsx';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ background: '#080716', color: '#FF006E', height: '100%', padding: '24px', fontFamily: 'monospace', overflowY: 'auto' }}>
          <p style={{ fontSize: '20px', marginBottom: '12px' }}>❌ LucidLand crashed</p>
          <p style={{ fontSize: '13px', color: '#c8c6e8', marginBottom: '8px' }}>Please screenshot this and report it:</p>
          <pre style={{ fontSize: '11px', color: '#aaa', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {String(this.state.error)}
            {this.state.error?.stack ? '\n\n' + this.state.error.stack : ''}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <LucidApp />
    </ErrorBoundary>
  </StrictMode>
);
