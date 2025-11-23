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
  
  // Get success message from navigation state (e.g., after registration)
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
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
      }}
    >
      <CardContent sx={{ p: 5 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              margin: '0 auto',
              mb: 2,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
              animation: 'float 3s ease-in-out infinite',
              '@keyframes float': {
                '0%, 100%': { transform: 'translateY(0px)' },
                '50%': { transform: 'translateY(-10px)' },
              },
            }}
          >
            <LockOpen sx={{ fontSize: 40, color: '#fff' }} />
          </Box>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            AI Training Platform
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.05rem' }}>
            Sign in to your account
          </Typography>
        </Box>

          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
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
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(99, 102, 241, 0.03)',
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
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(99, 102, 241, 0.03)',
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
                mt: 4,
                mb: 2,
                py: 1.5,
                fontSize: '1.05rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  boxShadow: '0 6px 20px rgba(99, 102, 241, 0.5)',
                },
              }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1, color: '#fff' }} />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2">
                Don't have an account?{' '}
                <Link 
                  to="/register" 
                  style={{ 
                    color: '#667eea', 
                    textDecoration: 'none',
                    fontWeight: 500
                  }}
                >
                  Sign up
                </Link>
              </Typography>
            </Box>
          </form>

          <Divider sx={{ my: 3 }} />

          <Box
            sx={{
              p: 2.5,
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
              borderRadius: 2,
              border: '1px solid rgba(99, 102, 241, 0.1)',
            }}
          >
            <Typography variant="caption" display="block" gutterBottom sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
              🔑 Default Admin Account
            </Typography>
            <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
              Username: <strong style={{ color: '#6366f1' }}>admin</strong>
            </Typography>
            <Typography variant="caption" display="block" sx={{ mb: 1.5 }}>
              Password: <strong style={{ color: '#6366f1' }}>admin123</strong>
            </Typography>
            <Typography
              variant="caption"
              display="block"
              sx={{
                color: 'error.main',
                fontWeight: 600,
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                padding: '4px 8px',
                borderRadius: 1,
              }}
            >
              ⚠️ Change password after first login!
            </Typography>
          </Box>
        </CardContent>
      </Card>
  );
}