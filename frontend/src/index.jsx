// src/index.js - UPDATED WITH BETTER LOADING HANDLING
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Improved loader removal function
const removeLoader = () => {
  const loader = document.getElementById('initial-loader');
  if (loader) {
    // Wait a bit longer to ensure React has fully rendered
    setTimeout(() => {
      loader.style.opacity = '0';
      loader.style.transition = 'opacity 0.8s ease-out';
      setTimeout(() => {
        if (loader.parentNode) {
          loader.parentNode.removeChild(loader);
        }
      }, 800);
    }, 1500); // Increased delay
  }
};

// Enhanced error boundary with better debugging
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Details:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
    this.setState({ errorInfo });
    
    // Remove loader on error
    removeLoader();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          backgroundColor: '#f5f5f5',
          fontFamily: 'Roboto, sans-serif',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            textAlign: 'center',
            maxWidth: '600px',
            width: '100%'
          }}>
            <h1 style={{ color: '#f44336', marginBottom: '16px', fontSize: '24px' }}>
              ❌ Application Error
            </h1>
            <p style={{ color: '#666', marginBottom: '16px' }}>
              The Product Training Platform encountered an error during startup.
            </p>
            
            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Common Solutions:</h3>
              <ul style={{ fontSize: '14px', color: '#555', paddingLeft: '20px' }}>
                <li>Check that all component files exist in the correct paths</li>
                <li>Verify that Material-UI icons are properly imported</li>
                <li>Make sure your file structure matches the expected layout</li>
                <li>Check the browser console for more detailed errors</li>
              </ul>
            </div>

            <details style={{ marginBottom: '20px', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', marginBottom: '8px', fontWeight: 'bold' }}>
                🐛 Technical Details (Click to expand)
              </summary>
              <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '12px', 
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'monospace',
                overflow: 'auto',
                maxHeight: '200px',
                border: '1px solid #dee2e6'
              }}>
                <strong>Error:</strong> {this.state.error?.message}<br/>
                <strong>Stack:</strong><br/>
                <pre style={{ whiteSpace: 'pre-wrap', margin: '8px 0' }}>
                  {this.state.error?.stack}
                </pre>
                {this.state.errorInfo && (
                  <>
                    <strong>Component Stack:</strong><br/>
                    <pre style={{ whiteSpace: 'pre-wrap', margin: '8px 0' }}>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </>
                )}
              </div>
            </details>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                🔄 Reload Application
              </button>
              <button 
                onClick={() => console.clear()}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                🧹 Clear Console
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Initialize React App with better error handling
console.log('🚀 Starting Product Training Platform...');
console.log('Environment:', {
  NODE_ENV: import.meta.env.NODE_ENV,
  API_URL: import.meta.env.VITE_API_URL
});

const container = document.getElementById('root');

if (!container) {
  console.error('❌ Critical Error: Root element not found!');
  document.body.innerHTML = `
    <div style="padding: 40px; text-align: center; font-family: Arial, sans-serif; background: #fff5f5;">
      <h1 style="color: #f44336;">❌ Setup Error</h1>
      <p>The root element is missing from the HTML file.</p>
      <p>Please check that <code>index.html</code> contains: <code>&lt;div id="root"&gt;&lt;/div&gt;</code></p>
      <button onclick="window.location.reload()" style="
        background: #1976d2; 
        color: white; 
        border: none; 
        padding: 12px 24px; 
        border-radius: 4px; 
        cursor: pointer;
        margin-top: 20px;
      ">
        Reload Page
      </button>
    </div>
  `;
  removeLoader();
} else {
  try {
    const root = createRoot(container);
    
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
    
    // Remove loader after successful render
    removeLoader();
    
    console.log('✅ Product Training Platform initialized successfully');
  } catch (error) {
    console.error('❌ Critical Error: Failed to render app:', error);
    
    container.innerHTML = `
      <div style="padding: 40px; text-align: center; font-family: Arial, sans-serif; background: #fff5f5;">
        <h1 style="color: #f44336;">❌ Render Error</h1>
        <p>Failed to initialize the React application.</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 4px; text-align: left; margin: 20px 0; border: 1px solid #dee2e6;">
          <strong>Error:</strong> ${error.message}<br/>
          <strong>Check the browser console for more details.</strong>
        </div>
        <button onclick="window.location.reload()" style="
          background: #1976d2; 
          color: white; 
          border: none; 
          padding: 12px 24px; 
          border-radius: 4px; 
          cursor: pointer;
        ">
          Reload Page
        </button>
      </div>
    `;
    
    removeLoader();
  }
}