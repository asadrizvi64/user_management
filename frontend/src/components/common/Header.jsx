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
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
      }}
    >
      <Toolbar sx={{ minHeight: '64px', px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              backgroundColor: '#2563eb',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SparklesIcon sx={{ fontSize: 20, color: '#fff' }} />
          </Box>
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 600,
              fontSize: '1.125rem',
              letterSpacing: '-0.01em',
              color: '#0f172a',
            }}
          >
            AI Studio
          </Typography>
        </Box>

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                py: 1,
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#fafafa',
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: '#2563eb',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                {user.username?.[0]?.toUpperCase() || 'U'}
              </Avatar>
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    color: '#0f172a',
                    lineHeight: 1.2,
                    fontSize: '0.875rem',
                  }}
                >
                  {user.username}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#64748b',
                    lineHeight: 1,
                    fontSize: '0.75rem',
                    textTransform: 'capitalize',
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
              size="small"
              sx={{
                color: '#475569',
                borderColor: '#e2e8f0',
                '&:hover': {
                  borderColor: '#cbd5e1',
                  backgroundColor: '#f8fafc',
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
