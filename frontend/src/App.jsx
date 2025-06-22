// src/App.jsx - MINIMAL WORKING VERSION
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';

// Only import components that definitely exist
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Import existing components only if they exist
let Header, Sidebar, ImageEditor;
try {
  Header = require('./components/common/Header').default;
} catch (e) {
  console.warn('Header component not found, using placeholder');
  Header = () => <div>Header Placeholder</div>;
}

try {
  Sidebar = require('./components/common/Sidebar').default;
} catch (e) {
  console.warn('Sidebar component not found, using placeholder');
  Sidebar = () => <div>Sidebar Placeholder</div>;
}

try {
  ImageEditor = require('./components/editor/ImageEditor').default;
} catch (e) {
  console.warn('ImageEditor component not found, using placeholder');
  ImageEditor = () => (
    <div style={{ padding: '20px' }}>
      <h2>Image Editor Placeholder</h2>
      <p>Create the ImageEditor component to see the full interface.</p>
    </div>
  );
}

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
});

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e0e0e0',
          borderTop: '4px solid #1976d2',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </Box>
    );
  }
  
  if (!user && !localStorage.getItem('access_token')) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Layout component for authenticated pages
const Layout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex' }}>
      <Header />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - 240px)` },
          ml: { sm: '240px' },
          mt: '64px',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

// Auth layout for login/register pages
const AuthLayout = ({ children }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      {children}
    </Box>
  );
};

// Main App Component
const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Auth Routes */}
            <Route
              path="/login"
              element={
                <AuthLayout>
                  <Login />
                </AuthLayout>
              }
            />
            <Route
              path="/register"
              element={
                <AuthLayout>
                  <Register />
                </AuthLayout>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/editor"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ImageEditor />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Add more routes as you create components */}
            
            {/* Default redirects */}
            <Route
              path="/dashboard"
              element={<Navigate to="/editor" replace />}
            />
            <Route
              path="/"
              element={<Navigate to="/editor" replace />}
            />
            <Route
              path="*"
              element={<Navigate to="/editor" replace />}
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;