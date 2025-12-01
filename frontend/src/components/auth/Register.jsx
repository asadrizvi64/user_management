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
        maxWidth: 580,
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
            <PersonAdd sx={{ fontSize: 40, color: '#fff' }} />
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
            Join AI Studio
          </Typography>
          <Typography variant="body1" sx={{ color: '#a1a1aa', fontSize: '1.0625rem', fontWeight: 500 }}>
            Start creating with AI-powered tools today
          </Typography>
        </Box>

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

        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
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
                  '&.Mui-focused': { color: '#8b5cf6', fontWeight: 700 }
                },
                '& .MuiFormHelperText-root': {
                  color: '#71717a',
                  fontWeight: 500,
                },
                '& input': {
                  color: '#ffffff'
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
                  '&.Mui-focused': { color: '#8b5cf6', fontWeight: 700 }
                },
                '& input': {
                  color: '#ffffff'
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
                '&.Mui-focused': { color: '#8b5cf6', fontWeight: 700 }
              },
              '& input': {
                color: '#ffffff'
              }
            }}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
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
                  '&.Mui-focused': { color: '#8b5cf6', fontWeight: 700 }
                },
                '& .MuiFormHelperText-root': {
                  color: '#71717a',
                  fontWeight: 500,
                },
                '& input': {
                  color: '#ffffff'
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
                  '&.Mui-focused': { color: '#8b5cf6', fontWeight: 700 }
                },
                '& input': {
                  color: '#ffffff'
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
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#a1a1aa', fontWeight: 500 }}>
              Already have an account?{' '}
              <Link
                to="/login"
                style={{
                  color: '#8b5cf6',
                  textDecoration: 'none',
                  fontWeight: 700,
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#ec4899'}
                onMouseLeave={(e) => e.target.style.color = '#8b5cf6'}
              >
                Sign In
              </Link>
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Register;
