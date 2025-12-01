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
import { LockOpen } from '@mui/icons-material';
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
        backgroundColor: '#ffffff',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.08)',
        border: '1px solid #e2e8f0',
      }}
    >
      <CardContent sx={{ p: 5 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              margin: '0 auto',
              mb: 3,
              backgroundColor: '#2563eb',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LockOpen sx={{ fontSize: 28, color: '#fff' }} />
          </Box>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 600,
              color: '#0f172a',
              mb: 1,
            }}
          >
            Welcome back
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9375rem' }}>
            Sign in to your AI Studio account
          </Typography>
        </Box>

          {successMessage && (
            <Alert
              severity="success"
              sx={{
                mb: 3,
                borderRadius: '8px',
                border: '1px solid #059669',
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
                borderRadius: '8px',
                border: '1px solid #dc2626',
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
                  backgroundColor: '#fafafa',
                },
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
                  backgroundColor: '#fafafa',
                },
              }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mb: 2,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 500,
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
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Don't have an account?{' '}
                <Link
                  to="/register"
                  style={{
                    color: '#2563eb',
                    textDecoration: 'none',
                    fontWeight: 500
                  }}
                >
                  Sign up
                </Link>
              </Typography>
            </Box>
          </form>

          <Divider sx={{ my: 4 }} />

          <Box
            sx={{
              p: 3,
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          >
            <Typography
              variant="caption"
              display="block"
              gutterBottom
              sx={{
                fontWeight: 600,
                color: '#0f172a',
                mb: 1.5,
                fontSize: '0.8125rem',
              }}
            >
              Default Admin Credentials
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
              <Typography variant="caption" display="block" sx={{ color: '#475569', fontSize: '0.8125rem' }}>
                Username: <Box component="span" sx={{ fontWeight: 600, color: '#0f172a' }}>admin</Box>
              </Typography>
              <Typography variant="caption" display="block" sx={{ color: '#475569', fontSize: '0.8125rem' }}>
                Password: <Box component="span" sx={{ fontWeight: 600, color: '#0f172a' }}>admin123</Box>
              </Typography>
            </Box>
            <Alert
              severity="warning"
              sx={{
                py: 0.5,
                borderRadius: '6px',
                backgroundColor: '#fef3c7',
                border: '1px solid #fbbf24',
                '& .MuiAlert-icon': {
                  color: '#d97706',
                },
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 500, color: '#92400e', fontSize: '0.8125rem' }}>
                Change password after first login
              </Typography>
            </Alert>
          </Box>
        </CardContent>
      </Card>
  );
}
