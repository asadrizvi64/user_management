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
import { PersonAddOutlined } from '@mui/icons-material';

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

        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
          navigate('/editor');
        } else {
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
            <PersonAddOutlined sx={{ fontSize: 24, color: '#fff' }} />
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
            Create account
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9375rem' }}>
            Get started with AI Training Platform
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
            <Box>
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
                placeholder="johndoe"
                size="medium"
              />
            </Box>

            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#0F172A' }}>
                Email
              </Typography>
              <TextField
                fullWidth
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                placeholder="john@example.com"
                size="medium"
              />
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#0F172A' }}>
              Full name <Typography component="span" variant="caption" sx={{ color: '#64748B' }}>(optional)</Typography>
            </Typography>
            <TextField
              fullWidth
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="John Doe"
              size="medium"
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
            <Box>
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
                autoComplete="new-password"
                placeholder="Min. 6 characters"
                size="medium"
              />
            </Box>

            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#0F172A' }}>
                Confirm password
              </Typography>
              <TextField
                fullWidth
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
                placeholder="Confirm password"
                size="medium"
              />
            </Box>
          </Box>

          <Button
            fullWidth
            variant="contained"
            size="large"
            type="submit"
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
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link
                to="/login"
                style={{
                  color: '#0F172A',
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
