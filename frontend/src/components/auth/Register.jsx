import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { PersonAdd } from '@mui/icons-material';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.username.trim()) {
      setError('Username is required');
      setLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    if (!formData.password.trim()) {
      setError('Password is required');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

      // Use FormData for backend compatibility
      const formDataToSend = new FormData();
      formDataToSend.append('username', formData.username.trim());
      formDataToSend.append('email', formData.email.trim());
      formDataToSend.append('password', formData.password);
      if (formData.full_name) {
        formDataToSend.append('full_name', formData.full_name.trim());
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        const data = await response.json();

        // If backend returns token, store it
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
          navigate('/editor');
        } else {
          // Otherwise redirect to login
          navigate('/login', {
            state: { message: 'Registration successful! Please log in.' }
          });
        }
      } else {
        const responseText = await response.text();
        let errorData;

        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { detail: responseText };
        }

        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            const errors = errorData.detail.map(err =>
              `${err.loc ? err.loc[err.loc.length - 1] : 'field'}: ${err.msg}`
            ).join(', ');
            setError(`Validation errors: ${errors}`);
          } else {
            setError(errorData.detail);
          }
        } else {
          setError(`Registration failed (${response.status})`);
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Network error: ' + error.message);
    }

    setLoading(false);
  };

  return (
    <Card
      sx={{
        maxWidth: 520,
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
            <PersonAdd sx={{ fontSize: 28, color: '#fff' }} />
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
            Create your account
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9375rem' }}>
            Start using AI Studio today
          </Typography>
        </Box>

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

        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              fullWidth
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              margin="normal"
              required
              autoFocus
              placeholder="johndoe"
              helperText="Unique username"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fafafa',
                },
              }}
            />

            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
              autoComplete="email"
              placeholder="john@example.com"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fafafa',
                },
              }}
            />
          </Box>

          <TextField
            fullWidth
            label="Full Name (Optional)"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            margin="normal"
            placeholder="John Doe"
            sx={{
              mb: 1,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#fafafa',
              },
            }}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
              autoComplete="new-password"
              helperText="Min. 6 characters"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fafafa',
                },
              }}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              margin="normal"
              required
              autoComplete="new-password"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fafafa',
                },
              }}
            />
          </Box>

          <Button
            fullWidth
            variant="contained"
            size="large"
            type="submit"
            disabled={loading}
            sx={{
              mt: 4,
              mb: 2,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 500,
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1, color: '#fff' }} />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Already have an account?{' '}
              <Link
                to="/login"
                style={{
                  color: '#2563eb',
                  textDecoration: 'none',
                  fontWeight: 500
                }}
              >
                Sign in
              </Link>
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Register;
