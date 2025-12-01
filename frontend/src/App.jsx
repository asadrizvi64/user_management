import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';

// Auth
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Layout Components
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';

// Dashboard
import ImageEditor from './components/editor/ImageEditor';

// Generation
import ImageGeneration from './components/generation/ImageEditor';

// Products
import ProductDashboard from './components/products/ProductDashboard';
import ProductTraining from './components/products/ProductTraining';
import TrainingProgress from './components/products/TrainingProgress';

// Inpainting
import InpaintingTool from './components/inpainting/InpaintingTool';

// History
import History from './components/history/History';

// Admin Only
import UserManagement from './components/users/UserManagement';
import Reports from './components/reports/Reports';

// Professional SaaS Theme - Minimal, Clean, Easy to Use
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb', // Professional Blue
      light: '#3b82f6',
      dark: '#1e40af',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#475569', // Slate Gray
      light: '#64748b',
      dark: '#334155',
      contrastText: '#ffffff',
    },
    success: {
      main: '#059669',
      light: '#10b981',
      dark: '#047857',
    },
    warning: {
      main: '#d97706',
      light: '#f59e0b',
      dark: '#b45309',
    },
    error: {
      main: '#dc2626',
      light: '#ef4444',
      dark: '#b91c1c',
    },
    info: {
      main: '#0891b2',
      light: '#06b6d4',
      dark: '#0e7490',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
    },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.25,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.3,
      letterSpacing: '-0.015em',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.35,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.4,
    },
    subtitle1: {
      fontSize: '1rem',
      lineHeight: 1.5,
      fontWeight: 500,
    },
    subtitle2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      fontWeight: 500,
    },
    body1: {
      fontSize: '0.9375rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      fontWeight: 500,
      letterSpacing: '0.01em',
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgb(0 0 0 / 0.04)',
    '0 1px 3px 0 rgb(0 0 0 / 0.06)',
    '0 2px 4px 0 rgb(0 0 0 / 0.06)',
    '0 4px 6px -1px rgb(0 0 0 / 0.08)',
    '0 10px 15px -3px rgb(0 0 0 / 0.08)',
    '0 20px 25px -5px rgb(0 0 0 / 0.08)',
    '0 25px 50px -12px rgb(0 0 0 / 0.15)',
    '0 25px 50px -12px rgb(0 0 0 / 0.15)',
    '0 25px 50px -12px rgb(0 0 0 / 0.15)',
    '0 25px 50px -12px rgb(0 0 0 / 0.15)',
    '0 25px 50px -12px rgb(0 0 0 / 0.15)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 6,
          padding: '9px 20px',
          fontSize: '0.9375rem',
          fontWeight: 500,
          boxShadow: 'none',
          transition: 'all 0.15s ease',
          '&:hover': {
            boxShadow: 'none',
            transform: 'none',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
          },
        },
        sizeLarge: {
          padding: '11px 24px',
          fontSize: '1rem',
        },
        sizeSmall: {
          padding: '6px 16px',
          fontSize: '0.875rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06)',
          border: '1px solid #e2e8f0',
          transition: 'all 0.2s ease',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
            transition: 'all 0.15s ease',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#e2e8f0',
            },
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#cbd5e1',
              },
            },
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: '1.5px',
                borderColor: '#2563eb',
              },
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
          fontSize: '0.8125rem',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        },
      },
    },
  },
});

// Clean Layout component with professional spacing
const Layout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fafafa' }}>
      <Header />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 3, sm: 4, md: 5 },
          width: { sm: `calc(100% - 240px)` },
          ml: { sm: '240px' },
          mt: '64px',
          backgroundColor: '#fafafa',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Box sx={{ maxWidth: '1600px', mx: 'auto' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

// Clean Auth layout with professional aesthetic
const AuthLayout = ({ children }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fafafa',
        backgroundImage: `
          radial-gradient(at 0% 0%, rgba(37, 99, 235, 0.08) 0px, transparent 50%),
          radial-gradient(at 100% 100%, rgba(37, 99, 235, 0.06) 0px, transparent 50%)
        `,
        position: 'relative',
        px: 2,
      }}
    >
      {children}
    </Box>
  );
};

// Main App Component
const App = () => {
  console.log('App component is rendering!');
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

            {/* Dashboard / Editor */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ImageEditor />
                  </Layout>
                </ProtectedRoute>
              }
            />

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

            {/* Generation */}
            <Route
              path="/generation"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ImageGeneration />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Products */}
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProductDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/products/:productId/train"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProductTraining />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/training/:jobId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TrainingProgress />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Inpainting */}
            <Route
              path="/inpainting"
              element={
                <ProtectedRoute>
                  <Layout>
                    <InpaintingTool />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* History */}
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <Layout>
                    <History />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <Layout>
                    <UserManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Reports />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Default redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
      