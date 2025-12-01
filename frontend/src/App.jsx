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

// Futuristic Theme - Cool, elegant, and dynamic
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3B82F6', // Bright Blue
      light: '#60A5FA',
      dark: '#2563EB',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#8B5CF6', // Purple
      light: '#A78BFA',
      dark: '#7C3AED',
      contrastText: '#ffffff',
    },
    success: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669',
    },
    warning: {
      main: '#F59E0B',
      light: '#FBBF24',
      dark: '#D97706',
    },
    error: {
      main: '#EF4444',
      light: '#F87171',
      dark: '#DC2626',
    },
    info: {
      main: '#06B6D4',
      light: '#22D3EE',
      dark: '#0891B2',
    },
    background: {
      default: '#0A0E27', // Deep space blue
      paper: '#131835',
    },
    text: {
      primary: '#F1F5F9',
      secondary: '#94A3B8',
      disabled: '#475569',
    },
    divider: 'rgba(148, 163, 184, 0.12)',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.25,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.75rem',
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
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
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '0.9375rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 500,
      letterSpacing: '0.01em',
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0 1px 3px 0 rgb(0 0 0 / 0.3)',
    '0 4px 6px -1px rgb(0 0 0 / 0.4)',
    '0 10px 15px -3px rgb(0 0 0 / 0.4)',
    '0 20px 25px -5px rgb(0 0 0 / 0.5)',
    '0 25px 50px -12px rgb(0 0 0 / 0.6)',
    '0 0 20px rgba(59, 130, 246, 0.3)',
    '0 0 30px rgba(139, 92, 246, 0.4)',
    '0 0 40px rgba(59, 130, 246, 0.5)',
    '0 0 50px rgba(139, 92, 246, 0.6)',
    '0 0 60px rgba(59, 130, 246, 0.7)',
    '0 0 70px rgba(139, 92, 246, 0.8)',
    '0 0 80px rgba(59, 130, 246, 0.9)',
    '0 0 90px rgba(139, 92, 246, 1)',
    '0 0 100px rgba(59, 130, 246, 1)',
    '0 0 110px rgba(139, 92, 246, 1)',
    '0 0 120px rgba(59, 130, 246, 1)',
    '0 0 130px rgba(139, 92, 246, 1)',
    '0 0 140px rgba(59, 130, 246, 1)',
    '0 0 150px rgba(139, 92, 246, 1)',
    '0 0 160px rgba(59, 130, 246, 1)',
    '0 0 170px rgba(139, 92, 246, 1)',
    '0 0 180px rgba(59, 130, 246, 1)',
    '0 0 190px rgba(139, 92, 246, 1)',
    '0 0 200px rgba(59, 130, 246, 1)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          padding: '10px 20px',
          fontSize: '0.875rem',
          fontWeight: 500,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
            transition: 'left 0.5s',
          },
          '&:hover::before': {
            left: '100%',
          },
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 20px rgba(59, 130, 246, 0.4)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
          boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
          '&:hover': {
            background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.6)',
          },
        },
        outlined: {
          borderColor: 'rgba(59, 130, 246, 0.5)',
          borderWidth: '1.5px',
          backdropFilter: 'blur(10px)',
          background: 'rgba(59, 130, 246, 0.05)',
          '&:hover': {
            borderColor: 'rgba(59, 130, 246, 0.8)',
            background: 'rgba(59, 130, 246, 0.1)',
            borderWidth: '1.5px',
          },
        },
        text: {
          '&:hover': {
            background: 'rgba(59, 130, 246, 0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(19, 24, 53, 0.8) 0%, rgba(19, 24, 53, 0.6) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px rgba(59, 130, 246, 0.3)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            background: 'rgba(19, 24, 53, 0.6)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
            '& fieldset': {
              borderColor: 'rgba(148, 163, 184, 0.2)',
              borderWidth: '1.5px',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(59, 130, 246, 0.4)',
            },
            '&.Mui-focused': {
              background: 'rgba(19, 24, 53, 0.8)',
              boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
              '& fieldset': {
                borderColor: '#3B82F6',
                borderWidth: '1.5px',
              },
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          fontSize: '0.8125rem',
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: 'rgba(19, 24, 53, 0.8)',
          backdropFilter: 'blur(20px)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, rgba(19, 24, 53, 0.95) 0%, rgba(19, 24, 53, 0.85) 100%)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
          borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'linear-gradient(180deg, rgba(19, 24, 53, 0.95) 0%, rgba(10, 14, 39, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(59, 130, 246, 0.2)',
        },
      },
    },
  },
});

// Dynamic Layout with animations
const Layout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: '#0A0E27' }}>
      <Header />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 3, sm: 4, md: 5 },
          width: { sm: `calc(100% - 260px)` },
          ml: { sm: '260px' },
          mt: '70px',
          minHeight: 'calc(100vh - 70px)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)',
            pointerEvents: 'none',
            zIndex: 0,
          },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

// Futuristic Auth layout
const AuthLayout = ({ children }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0A0E27 0%, #1A1F3A 100%)',
        padding: 3,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
          animation: 'rotate 20s linear infinite',
        },
        '@keyframes rotate': {
          '0%': {
            transform: 'rotate(0deg)',
          },
          '100%': {
            transform: 'rotate(360deg)',
          },
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '-50%',
          right: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
          animation: 'rotate 25s linear infinite reverse',
        },
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {children}
      </Box>
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
