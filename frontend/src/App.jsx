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

// Bold Dark Mode Theme with Statement Design
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#8b5cf6', // Vibrant Purple
      light: '#a78bfa',
      dark: '#7c3aed',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ec4899', // Hot Pink
      light: '#f472b6',
      dark: '#db2777',
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    info: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
    },
    background: {
      default: '#0a0a0f',
      paper: '#14141b',
    },
    text: {
      primary: '#ffffff',
      secondary: '#a1a1aa',
    },
    divider: 'rgba(255, 255, 255, 0.1)',
  },
  typography: {
    fontFamily: '"Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontWeight: 900,
      fontSize: '3rem',
      lineHeight: 1.1,
      letterSpacing: '-0.03em',
    },
    h2: {
      fontWeight: 800,
      fontSize: '2.25rem',
      lineHeight: 1.2,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.875rem',
      lineHeight: 1.25,
      letterSpacing: '-0.02em',
    },
    h4: {
      fontWeight: 700,
      fontSize: '1.5rem',
      lineHeight: 1.3,
      letterSpacing: '-0.015em',
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
    borderRadius: 16,
  },
  shadows: [
    'none',
    '0 0 20px rgba(139, 92, 246, 0.1)',
    '0 0 30px rgba(139, 92, 246, 0.15)',
    '0 0 40px rgba(139, 92, 246, 0.2)',
    '0 10px 40px rgba(139, 92, 246, 0.25)',
    '0 15px 50px rgba(139, 92, 246, 0.3)',
    '0 20px 60px rgba(139, 92, 246, 0.35)',
    '0 25px 70px rgba(139, 92, 246, 0.4)',
    '0 30px 80px rgba(139, 92, 246, 0.45)',
    '0 35px 90px rgba(139, 92, 246, 0.5)',
    '0 40px 100px rgba(139, 92, 246, 0.55)',
    '0 45px 110px rgba(139, 92, 246, 0.6)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          padding: '12px 28px',
          fontSize: '1rem',
          fontWeight: 700,
          boxShadow: 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 10px 40px rgba(139, 92, 246, 0.4)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
          },
        },
        outlined: {
          borderWidth: '2px',
          borderColor: '#8b5cf6',
          '&:hover': {
            borderWidth: '2px',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderColor: '#a78bfa',
          },
        },
        sizeLarge: {
          padding: '16px 36px',
          fontSize: '1.125rem',
        },
        sizeSmall: {
          padding: '8px 20px',
          fontSize: '0.875rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 30px 80px rgba(139, 92, 246, 0.3)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(139, 92, 246, 0.3)',
              borderWidth: '2px',
            },
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.08)',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(139, 92, 246, 0.5)',
              },
            },
            '&.Mui-focused': {
              background: 'rgba(255, 255, 255, 0.08)',
              boxShadow: '0 0 0 4px rgba(139, 92, 246, 0.2)',
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: '2px',
                borderColor: '#8b5cf6',
              },
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 600,
          fontSize: '0.875rem',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))',
          border: '1px solid rgba(139, 92, 246, 0.3)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(236, 72, 153, 0.04) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
        },
        elevation1: {
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #14141b 0%, #1a1a24 100%)',
          borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'linear-gradient(180deg, #14141b 0%, #1a1a24 100%)',
          borderRight: '1px solid rgba(139, 92, 246, 0.2)',
        },
      },
    },
  },
});

// Bold Dark Layout with Statement Design
const Layout = ({ children }) => {
  return (
    <Box sx={{
      display: 'flex',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #14141b 50%, #1a1a24 100%)',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.15) 0%, transparent 50%)',
        pointerEvents: 'none',
      }
    }}>
      <Header />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 3, sm: 4, md: 5 },
          width: '100%',
          mt: '64px',
          minHeight: 'calc(100vh - 64px)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box sx={{ maxWidth: '1600px', mx: 'auto' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

// Bold Dark Auth Layout with Statement Design
const AuthLayout = ({ children }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #14141b 50%, #1a1a24 100%)',
        position: 'relative',
        px: 2,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.4) 0%, transparent 40%),
            radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.4) 0%, transparent 40%),
            radial-gradient(circle at 40% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 40%)
          `,
          animation: 'pulseGlow 8s ease-in-out infinite',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(10, 10, 15, 0.8) 100%)',
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
      