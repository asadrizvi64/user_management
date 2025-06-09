// src/index.js - CLEAN VERSION WITH WORKING APP
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// Working App Component (from your paste-2.txt)
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, Container, Typography, Button, Card, CardContent } from '@mui/material';

// Theme configuration
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

// Simple Login Component
const Login = () => {
  return (
    <Container maxWidth="sm" sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <Card sx={{ width: '100%', maxWidth: 400 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Product Training Platform
          </Typography>
          <Typography variant="body1" color="textSecondary" align="center" sx={{ mb: 3 }}>
            AI-powered product training and image generation
          </Typography>
          <Button 
            variant="contained" 
            fullWidth 
            size="large"
            onClick={() => window.location.href = '/dashboard'}
          >
            Enter Dashboard (Demo)
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
};

// Simple Dashboard Component
const Dashboard = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        🎉 Welcome to Product Training Platform
      </Typography>
      
      <Typography variant="h6" color="textSecondary" gutterBottom sx={{ mb: 4 }}>
        Your AI-powered platform is working correctly!
      </Typography>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🖼️ Image Generation
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Generate images using your trained product models
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🎯 Product Training
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Train custom FLUX LoRA models for your products
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🎨 Inpainting
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Replace parts of images with your trained products
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📊 Analytics
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Monitor usage, costs, and performance metrics
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ mt: 4, p: 3, bgcolor: 'primary.main', color: 'white', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          ✅ System Status: All Components Working
        </Typography>
        <Typography variant="body2">
          • React App: ✅ Running<br/>
          • Material-UI: ✅ Loaded<br/>
          • Routing: ✅ Working<br/>
          • Theme: ✅ Applied<br/>
          • Ready for full component integration!
        </Typography>
      </Box>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button 
          variant="outlined" 
          onClick={() => window.location.href = '/login'}
          sx={{ mr: 2 }}
        >
          Back to Login
        </Button>
        <Button 
          variant="contained"
          onClick={() => alert('Ready to integrate full components!')}
        >
          Next: Add Full Components
        </Button>
      </Box>
    </Container>
  );
};

// Main App Component
const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="sm" sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Card sx={{ width: '100%', maxWidth: 500 }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h5" color="error" gutterBottom>
                ❌ Something went wrong
              </Typography>
              <Typography variant="body2" sx={{ mb: 3 }}>
                Error: {this.state.error?.message}
              </Typography>
              <Button 
                variant="contained" 
                color="error"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </CardContent>
          </Card>
        </Container>
      );
    }

    return this.props.children;
  }
}

// Initialize React
console.log('🚀 Starting Product Training Platform...');

const container = document.getElementById('root');

if (!container) {
  console.error('❌ Root element not found!');
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
    console.log('✅ Product Training Platform loaded successfully');
  } catch (error) {
    console.error('❌ Failed to render app:', error);
  }
}