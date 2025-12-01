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
import { PersonAdd, AutoAwesome } from '@mui/icons-material';

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
            <PersonAdd sx={{ fontSize: 32, color: '#fff' }} />
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
            Create your account
          </Typography>
          <Typography variant="body2" sx={{ color: '#94A3B8', fontSize: '0.9375rem' }}>
            Start using AI Studio today
          </Typography>
        </Box>

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
                  '&.Mui-focused': { color: '#3B82F6' }
                },
                '& .MuiFormHelperText-root': {
                  color: '#64748B'
                },
                '& input': {
                  color: '#F1F5F9'
                }
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
                  '&.Mui-focused': { color: '#3B82F6' }
                },
                '& input': {
                  color: '#F1F5F9'
                }
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
                '&.Mui-focused': { color: '#3B82F6' }
              },
              '& input': {
                color: '#F1F5F9'
              }
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
                  '&.Mui-focused': { color: '#3B82F6' }
                },
                '& .MuiFormHelperText-root': {
                  color: '#64748B'
                },
                '& input': {
                  color: '#F1F5F9'
                }
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
                  '&.Mui-focused': { color: '#3B82F6' }
                },
                '& input': {
                  color: '#F1F5F9'
                }
              }}
            />
          </Box>

          <Button
            fullWidth
            variant="contained"
            size="large"
            type="submit"
            disabled={loading}
            startIcon={!loading && <AutoAwesome />}
            sx={{
              mt: 4,
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
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#94A3B8' }}>
              Already have an account?{' '}
              <Link
                to="/login"
                style={{
                  color: '#3B82F6',
                  textDecoration: 'none',
                  fontWeight: 600,
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#8B5CF6'}
                onMouseLeave={(e) => e.target.style.color = '#3B82F6'}
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
