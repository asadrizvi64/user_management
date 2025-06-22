// src/components/auth/Register.jsx - FIXED FOR CORS AND REQUEST BODY ISSUES
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Card, CardContent, TextField, Button, Typography, Box,
  Alert, CircularProgress
} from '@mui/material';
import { PersonAdd } from '@mui/icons-material';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
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

    // Prepare data exactly as backend expects
    const requestData = {
      username: formData.username.trim(),
      email: formData.email.trim(),
      password: formData.password
    };

    console.log('=== REGISTRATION DEBUG ===');
    console.log('Form data:', formData);
    console.log('Request data:', requestData);
    console.log('JSON stringify test:', JSON.stringify(requestData));

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
      const url = `${API_BASE_URL}/api/auth/register`;
      
      console.log('Making request to:', url);

      // Try multiple request formats to see which works
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Add explicit charset
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(requestData),
        // Ensure CORS credentials if needed
        credentials: 'same-origin'
      };

      console.log('Request options:', requestOptions);

      const response = await fetch(url, requestOptions);

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('Registration successful:', data);
        
        // Store token and redirect
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
        }
        
        navigate('/editor');
      } else {
        const responseText = await response.text();
        console.error('Error response text:', responseText);
        
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { detail: responseText };
        }
        
        console.error('Error data:', errorData);
        
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            // Format validation errors nicely
            const errors = errorData.detail.map(err => `${err.loc ? err.loc[1] : 'field'}: ${err.msg}`).join(', ');
            setError(`Validation errors: ${errors}`);
          } else {
            setError(errorData.detail);
          }
        } else {
          setError(`Registration failed (${response.status}): ${responseText}`);
        }
      }
    } catch (error) {
      console.error('Network error:', error);
      setError('Network error: ' + error.message);
    }
    
    setLoading(false);
  };

  // Alternative: Try FormData format (some backends prefer this)
  const handleSubmitFormData = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formDataObj = new FormData();
    formDataObj.append('username', formData.username.trim());
    formDataObj.append('email', formData.email.trim());
    formDataObj.append('password', formData.password);

    console.log('=== FORM DATA ATTEMPT ===');
    for (let [key, value] of formDataObj.entries()) {
      console.log(key, value);
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
      
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        body: formDataObj, // Don't set Content-Type for FormData
      });

      console.log('FormData response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Registration successful with FormData:', data);
        
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
        }
        
        navigate('/editor');
      } else {
        const responseText = await response.text();
        console.error('FormData error response:', responseText);
        setError(`FormData attempt failed: ${responseText}`);
      }
    } catch (error) {
      console.error('FormData network error:', error);
      setError('FormData network error: ' + error.message);
    }
    
    setLoading(false);
  };

  // Demo register function for testing without backend
  const handleDemoRegister = () => {
    localStorage.setItem('access_token', 'demo-token');
    navigate('/editor');
  };

  return (
    <Card sx={{ width: '100%', maxWidth: 450 }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <PersonAdd sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Create Account
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Join the Product Training Platform
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form">
          <TextField
            fullWidth
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            margin="normal"
            required
            autoFocus
            placeholder="e.g. johndoe"
            helperText="This will be your unique username"
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
            placeholder="e.g. john@example.com"
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
            autoComplete="new-password"
            helperText="Must be at least 6 characters"
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
          />

          <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Creating Account...' : 'Create Account (JSON)'}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={handleSubmitFormData}
              disabled={loading}
            >
              Try FormData Format
            </Button>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={handleDemoRegister}
              sx={{ backgroundColor: 'success.light', color: 'success.contrastText' }}
            >
              Demo Register (Skip Backend)
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#1976d2', textDecoration: 'none' }}>
                Sign in here
              </Link>
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Register;