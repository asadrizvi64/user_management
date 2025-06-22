// src/components/auth/Login.jsx - FIXED FOR MISSING LOGIN ENDPOINT
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Card, CardContent, TextField, Button, Typography, Box,
  Alert, CircularProgress
} from '@mui/material';
import { Login as LoginIcon } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      navigate('/editor');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  // Demo login function for testing without backend
  const handleDemoLogin = () => {
    localStorage.setItem('access_token', 'demo-token');
    navigate('/editor');
  };

  // Quick registration redirect since that works
  const handleQuickRegister = () => {
    navigate('/register');
  };

  return (
    <Card sx={{ width: '100%', maxWidth: 400 }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <LoginIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome Back
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Sign in to your Product Training Platform
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Info about current backend status */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Current Status:</strong><br/>
            ✅ Registration working<br/>
            ⚠️ Login endpoint not implemented yet<br/>
            💡 Use "Demo Login" or register a new account
          </Typography>
        </Alert>

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            autoComplete="email"
            autoFocus
            placeholder="If login was implemented..."
          />
          
          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            autoComplete="current-password"
            placeholder="If login was implemented..."
          />

          <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              type="submit"
              fullWidth
              variant="outlined"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Trying to Sign In...' : 'Try Login (Will Fail)'}
            </Button>

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleDemoLogin}
              sx={{ backgroundColor: 'success.main' }}
            >
              Demo Login (Skip Backend)
            </Button>

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleQuickRegister}
              color="primary"
            >
              Register New Account (Works!)
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2">
              Need an account?{' '}
              <Link to="/register" style={{ color: '#1976d2', textDecoration: 'none' }}>
                Sign up here
              </Link>
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Login;