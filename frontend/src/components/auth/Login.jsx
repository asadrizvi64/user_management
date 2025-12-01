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
import { LockOutlined } from '@mui/icons-material';
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
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        border: '1px solid #E2E8F0',
      }}
    >
      <CardContent sx={{ p: 5 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              margin: '0 auto',
              mb: 3,
              backgroundColor: '#0F172A',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LockOutlined sx={{ fontSize: 24, color: '#fff' }} />
          </Box>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: '#0F172A',
              mb: 1,
            }}
          >
            Welcome back
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9375rem' }}>
            Sign in to your account to continue
          </Typography>
        </Box>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#0F172A' }}>
              Username
            </Typography>
            <TextField
              fullWidth
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              autoFocus
              autoComplete="username"
              placeholder="Enter your username"
              size="medium"
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#0F172A' }}>
              Password
            </Typography>
            <TextField
              fullWidth
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              size="medium"
            />
          </Box>

          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            sx={{
              mb: 3,
              py: 1.5,
              fontSize: '0.9375rem',
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={18} sx={{ mr: 1, color: '#fff' }} />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{' '}
              <Link
                to="/register"
                style={{
                  color: '#0F172A',
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
            backgroundColor: '#F8FAFC',
            borderRadius: '6px',
            border: '1px solid #E2E8F0',
          }}
        >
          <Typography variant="caption" display="block" gutterBottom sx={{ fontWeight: 600, color: '#0F172A', mb: 1.5, fontSize: '0.8125rem' }}>
            Default Admin Credentials
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
            <Box>
              <Typography variant="caption" display="block" sx={{ color: '#64748B', mb: 0.5 }}>
                Username
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace', color: '#0F172A' }}>
                admin
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" display="block" sx={{ color: '#64748B', mb: 0.5 }}>
                Password
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace', color: '#0F172A' }}>
                admin123
              </Typography>
            </Box>
          </Box>
          <Alert severity="warning" sx={{ mt: 2, py: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 500 }}>
              Change password after first login
            </Typography>
          </Alert>
        </Box>
      </CardContent>
    </Card>
  );
}
