import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Avatar, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { Logout, AutoAwesome } from '@mui/icons-material';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ minHeight: '70px', px: 3, justifyContent: 'space-between' }}>
        {/* Logo with glow effect */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
              animation: 'pulse-glow 2s ease-in-out infinite',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: '-2px',
                background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                borderRadius: '12px',
                opacity: 0.3,
                filter: 'blur(10px)',
                zIndex: -1,
              },
            }}
          >
            <AutoAwesome sx={{ fontSize: 22, color: '#fff' }} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                fontSize: '1.1rem',
                background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
              }}
            >
              AI Training Platform
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontSize: '0.7rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Next-Gen Intelligence
            </Typography>
          </Box>
        </Box>

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Dynamic Island - User Info */}
            <Box
              className="dynamic-island"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2.5,
                py: 1.25,
                cursor: 'pointer',
                '&:hover': {
                  '& .MuiAvatar-root': {
                    boxShadow: '0 0 15px rgba(59, 130, 246, 0.6)',
                  },
                },
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                  color: '#FFFFFF',
                  border: '2px solid rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.3s ease',
                }}
              >
                {user.username.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: '#F1F5F9',
                    lineHeight: 1.2,
                    fontSize: '0.875rem',
                  }}
                >
                  {user.username}
                </Typography>
                <Chip
                  label={user.role}
                  size="small"
                  sx={{
                    height: 16,
                    fontSize: '0.65rem',
                    mt: 0.5,
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: '#60A5FA',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                  }}
                />
              </Box>
            </Box>

            {/* Logout Button with glow */}
            <Button
              variant="outlined"
              startIcon={<Logout sx={{ fontSize: '1rem' }} />}
              onClick={handleLogout}
              sx={{
                fontSize: '0.875rem',
                borderRadius: '10px',
                px: 2.5,
                py: 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)',
                  borderColor: '#EF4444',
                  background: 'rgba(239, 68, 68, 0.1)',
                },
              }}
            >
              Logout
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
