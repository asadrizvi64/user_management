import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { LockOpen, AutoAwesome } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth.jsx';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const successMessage = location.state?.message;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData);
      if (result.success) {
        navigate('/editor');
      } else {
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      sx={{
        maxWidth: 480,
        width: '100%',
        background: 'linear-gradient(135deg, rgba(20, 20, 27, 0.95) 0%, rgba(26, 26, 36, 0.95) 100%)',
        backdropFilter: 'blur(30px)',
        border: '3px solid transparent',
        borderRadius: 5,
        boxShadow: '0 30px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(139, 92, 246, 0.3)',
        position: 'relative',
        overflow: 'hidden',
        animation: 'fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          borderRadius: 5,
          padding: '3px',
          background: 'linear-gradient(135deg, #8b5cf6, #ec4899, #3b82f6)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          opacity: 0.6,
        }
      }}
    >
      <CardContent sx={{ p: 6 }}>
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          {/* Statement Icon */}
          <Box
            sx={{
              width: 80,
              height: 80,
              margin: '0 auto',
              mb: 3,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 20px 60px rgba(139, 92, 246, 0.6)',
              position: 'relative',
              animation: 'pulseGlow 3s ease-in-out infinite',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: -3,
                borderRadius: '24px',
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                opacity: 0.5,
                filter: 'blur(20px)',
                zIndex: -1,
                animation: 'pulseGlow 3s ease-in-out infinite',
              }
            }}
          >
            <LockOpen sx={{ fontSize: 40, color: '#fff' }} />
          </Box>

          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 900,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
              letterSpacing: '-0.03em',
            }}
          >
            Welcome Back
          </Typography>
          <Typography variant="body1" sx={{ color: '#a1a1aa', fontSize: '1.0625rem', fontWeight: 500 }}>
            Sign in to your AI Studio account
          </Typography>
        </Box>

        {successMessage && (
          <Alert
            severity="success"
            sx={{
              mb: 3,
              borderRadius: 3,
              bgcolor: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              backdropFilter: 'blur(10px)',
              color: '#10b981',
              fontWeight: 600,
              animation: 'slideDown 0.3s ease-out',
              '& .MuiAlert-icon': {
                color: '#10b981'
              }
            }}
          >
            {successMessage}
          </Alert>
        )}

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 3,
              bgcolor: 'rgba(239, 68, 68, 0.15)',
              border: '2px solid rgba(239, 68, 68, 0.3)',
              backdropFilter: 'blur(10px)',
              color: '#ef4444',
              fontWeight: 600,
              animation: 'slideDown 0.3s ease-out',
              '& .MuiAlert-icon': {
                color: '#ef4444'
              }
            }}
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            margin="normal"
            required
            autoFocus
            autoComplete="username"
            sx={{
              mb: 2.5,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                border: '2px solid rgba(139, 92, 246, 0.2)',
                color: '#ffffff',
                fontSize: '1.0625rem',
                fontWeight: 500,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  border: '2px solid rgba(139, 92, 246, 0.4)',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  transform: 'translateY(-2px)',
                },
                '&.Mui-focused': {
                  border: '2px solid #8b5cf6',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  boxShadow: '0 0 0 4px rgba(139, 92, 246, 0.15)',
                }
              },
              '& .MuiInputLabel-root': {
                color: '#a1a1aa',
                fontWeight: 600,
                fontSize: '1rem',
                '&.Mui-focused': {
                  color: '#8b5cf6',
                  fontWeight: 700,
                }
              },
              '& input': {
                color: '#ffffff'
              }
            }}
          />
          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
            autoComplete="current-password"
            sx={{
              mb: 4,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                border: '2px solid rgba(139, 92, 246, 0.2)',
                color: '#ffffff',
                fontSize: '1.0625rem',
                fontWeight: 500,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  border: '2px solid rgba(139, 92, 246, 0.4)',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  transform: 'translateY(-2px)',
                },
                '&.Mui-focused': {
                  border: '2px solid #8b5cf6',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  boxShadow: '0 0 0 4px rgba(139, 92, 246, 0.15)',
                }
              },
              '& .MuiInputLabel-root': {
                color: '#a1a1aa',
                fontWeight: 600,
                fontSize: '1rem',
                '&.Mui-focused': {
                  color: '#8b5cf6',
                  fontWeight: 700,
                }
              },
              '& input': {
                color: '#ffffff'
              }
            }}
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            startIcon={!loading && <AutoAwesome />}
            sx={{
              mb: 3,
              py: 2,
              fontSize: '1.125rem',
              fontWeight: 800,
              textTransform: 'none',
              borderRadius: 3,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              boxShadow: '0 10px 40px rgba(139, 92, 246, 0.5)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
                boxShadow: '0 15px 50px rgba(139, 92, 246, 0.6)',
                transform: 'translateY(-3px)',
              },
              '&.Mui-disabled': {
                background: 'rgba(100, 116, 139, 0.3)',
                color: '#64748b'
              }
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1.5, color: '#fff' }} />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#a1a1aa', fontWeight: 500 }}>
              Don't have an account?{' '}
              <Link
                to="/register"
                style={{
                  color: '#8b5cf6',
                  textDecoration: 'none',
                  fontWeight: 700,
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#ec4899'}
                onMouseLeave={(e) => e.target.style.color = '#8b5cf6'}
              >
                Sign Up
              </Link>
            </Typography>
          </Box>
        </form>

        <Divider sx={{ my: 4, borderColor: 'rgba(139, 92, 246, 0.2)', borderWidth: '1px' }} />

        {/* Admin Credentials Statement Card */}
        <Box
          sx={{
            p: 4,
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(249, 115, 22, 0.15))',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            border: '2px solid rgba(245, 158, 11, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.2) 0%, transparent 70%)',
            }
          }}
        >
          <Typography
            variant="body1"
            display="block"
            gutterBottom
            sx={{
              fontWeight: 800,
              color: '#f59e0b',
              mb: 2,
              fontSize: '0.9375rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              position: 'relative',
              zIndex: 1,
            }}
          >
            🔑 Default Admin Credentials
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2.5, position: 'relative', zIndex: 1 }}>
            <Typography variant="body2" display="block" sx={{ color: '#d1d5db', fontSize: '0.9375rem', fontWeight: 500 }}>
              Username: <Box component="span" sx={{ fontWeight: 800, color: '#ffffff', ml: 1 }}>admin</Box>
            </Typography>
            <Typography variant="body2" display="block" sx={{ color: '#d1d5db', fontSize: '0.9375rem', fontWeight: 500 }}>
              Password: <Box component="span" sx={{ fontWeight: 800, color: '#ffffff', ml: 1 }}>admin123</Box>
            </Typography>
          </Box>
          <Alert
            severity="warning"
            sx={{
              py: 1,
              borderRadius: 2,
              bgcolor: 'rgba(245, 158, 11, 0.2)',
              border: '2px solid rgba(245, 158, 11, 0.4)',
              color: '#fbbf24',
              position: 'relative',
              zIndex: 1,
              '& .MuiAlert-icon': {
                color: '#fbbf24',
              },
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
              ⚠️ Change password after first login
            </Typography>
          </Alert>
        </Box>
      </CardContent>
    </Card>
  );
}
