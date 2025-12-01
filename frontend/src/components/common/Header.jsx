import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import LogoutIcon from '@mui/icons-material/Logout';
import SparklesIcon from '@mui/icons-material/AutoAwesome';

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
        background: 'linear-gradient(135deg, rgba(20, 20, 27, 0.95) 0%, rgba(26, 26, 36, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        borderBottom: '2px solid rgba(139, 92, 246, 0.2)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
      }}
    >
      <Toolbar sx={{ minHeight: '70px', px: { xs: 2, sm: 4 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: -2,
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                opacity: 0.5,
                filter: 'blur(8px)',
                zIndex: -1,
              },
            }}
          >
            <SparklesIcon sx={{ fontSize: 28, color: '#fff' }} />
          </Box>
          <Box>
            <Typography
              variant="h5"
              component="div"
              sx={{
                fontWeight: 900,
                fontSize: '1.5rem',
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1.2,
              }}
            >
              AI Studio
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#a1a1aa',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Pro Edition
            </Typography>
          </Box>
        </Box>

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                gap: 2,
                px: 3,
                py: 1.5,
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))',
                border: '2px solid rgba(139, 92, 246, 0.3)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(139, 92, 246, 0.3)',
                },
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                  fontSize: '1rem',
                  fontWeight: 800,
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
                }}
              >
                {user.username?.[0]?.toUpperCase() || 'U'}
              </Avatar>
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: '#ffffff',
                    lineHeight: 1.2,
                    fontSize: '0.9375rem',
                  }}
                >
                  {user.username}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#a78bfa',
                    lineHeight: 1,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                  }}
                >
                  {user.role}
                </Typography>
              </Box>
            </Box>

            <Button
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              size="medium"
              sx={{
                color: '#ffffff',
                borderColor: 'rgba(139, 92, 246, 0.5)',
                borderWidth: '2px',
                borderRadius: '12px',
                px: 3,
                py: 1.5,
                fontWeight: 700,
                textTransform: 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  borderWidth: '2px',
                  borderColor: '#8b5cf6',
                  background: 'rgba(139, 92, 246, 0.1)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(139, 92, 246, 0.3)',
                },
              }}
            >
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Logout</Box>
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
