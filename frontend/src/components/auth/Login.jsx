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
        maxWidth: 440,
        width: '100%',
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.3)',
        animation: 'fadeInUp 0.5s ease-out'
      }}
    >
      <CardContent sx={{ p: 5 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          {/* Dynamic Island Icon */}
          <Box
            sx={{
              width: 64,
              height: 64,
              margin: '0 auto',
              mb: 3,
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px -8px rgba(59, 130, 246, 0.5)',
              position: 'relative',
              animation: 'pulseGlow 3s ease-in-out infinite',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: -2,
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                opacity: 0.5,
                filter: 'blur(10px)',
                zIndex: -1
              }
            }}
          >
            <LockOpen sx={{ fontSize: 32, color: '#fff' }} />
          </Box>

          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5,
            }}
          >
            Welcome back
          </Typography>
          <Typography variant="body2" sx={{ color: '#94A3B8', fontSize: '0.9375rem' }}>
            Sign in to your AI Studio account
          </Typography>
        </Box>

        {successMessage && (
          <Alert
            severity="success"
            sx={{
              mb: 3,
              borderRadius: 2,
              bgcolor: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              backdropFilter: 'blur(10px)',
              color: '#22C55E',
              animation: 'slideDown 0.3s ease-out',
              '& .MuiAlert-icon': {
                color: '#22C55E'
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
              borderRadius: 2,
              bgcolor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              backdropFilter: 'blur(10px)',
              color: '#EF4444',
              animation: 'slideDown 0.3s ease-out',
              '& .MuiAlert-icon': {
                color: '#EF4444'
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
              mb: 2,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#F1F5F9',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                },
                '&.Mui-focused': {
                  border: '1px solid rgba(59, 130, 246, 0.5)',
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                }
              },
              '& .MuiInputLabel-root': {
                color: '#94A3B8',
                '&.Mui-focused': {
                  color: '#3B82F6'
                }
              },
              '& input': {
                color: '#F1F5F9'
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
              mb: 3,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#F1F5F9',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                },
                '&.Mui-focused': {
                  border: '1px solid rgba(59, 130, 246, 0.5)',
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                }
              },
              '& .MuiInputLabel-root': {
                color: '#94A3B8',
                '&.Mui-focused': {
                  color: '#3B82F6'
                }
              },
              '& input': {
                color: '#F1F5F9'
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
              mb: 2,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
              boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.4)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
                boxShadow: '0 6px 20px 0 rgba(59, 130, 246, 0.5)',
                transform: 'translateY(-2px)',
              },
              '&.Mui-disabled': {
                background: 'rgba(100, 116, 139, 0.3)',
                color: '#64748B'
              }
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1, color: '#fff' }} />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#94A3B8' }}>
              Don't have an account?{' '}
              <Link
                to="/register"
                style={{
                  color: '#3B82F6',
                  textDecoration: 'none',
                  fontWeight: 600,
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#8B5CF6'}
                onMouseLeave={(e) => e.target.style.color = '#3B82F6'}
              >
                Sign up
              </Link>
            </Typography>
          </Box>
        </form>

        <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Admin Credentials Info */}
        <Box
          sx={{
            p: 3,
            background: 'rgba(234, 179, 8, 0.08)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            border: '1px solid rgba(234, 179, 8, 0.2)',
          }}
        >
          <Typography
            variant="caption"
            display="block"
            gutterBottom
            sx={{
              fontWeight: 600,
              color: '#EAB308',
              mb: 1.5,
              fontSize: '0.8125rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            Default Admin Credentials
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
            <Typography variant="caption" display="block" sx={{ color: '#94A3B8', fontSize: '0.8125rem' }}>
              Username: <Box component="span" sx={{ fontWeight: 600, color: '#F1F5F9' }}>admin</Box>
            </Typography>
            <Typography variant="caption" display="block" sx={{ color: '#94A3B8', fontSize: '0.8125rem' }}>
              Password: <Box component="span" sx={{ fontWeight: 600, color: '#F1F5F9' }}>admin123</Box>
            </Typography>
          </Box>
          <Alert
            severity="warning"
            sx={{
              py: 0.5,
              borderRadius: 1.5,
              bgcolor: 'rgba(234, 179, 8, 0.15)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              color: '#EAB308',
              '& .MuiAlert-icon': {
                color: '#EAB308',
              },
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.8125rem' }}>
              Change password after first login
            </Typography>
          </Alert>
        </Box>
      </CardContent>
    </Card>
  );
}
