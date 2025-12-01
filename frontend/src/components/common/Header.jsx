import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import LogoutIcon from '@mui/icons-material/Logout';

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
        backgroundColor: '#FFFFFF',
        color: '#0F172A',
      }}
    >
      <Toolbar sx={{ minHeight: '64px', px: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              backgroundColor: '#0F172A',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff', fontSize: '0.875rem' }}>
              AI
            </Typography>
          </Box>
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 600,
              fontSize: '0.9375rem',
              color: '#0F172A',
            }}
          >
            Training Platform
          </Typography>
        </Box>

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                py: 1,
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
              }}
            >
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                }}
              >
                {user.username.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#0F172A', lineHeight: 1.2, fontSize: '0.875rem' }}>
                  {user.username}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', lineHeight: 1, fontSize: '0.75rem' }}>
                  {user.role}
                </Typography>
              </Box>
            </Box>

            <Button
              variant="outlined"
              startIcon={<LogoutIcon sx={{ fontSize: '1rem' }} />}
              onClick={handleLogout}
              sx={{
                fontSize: '0.875rem',
                color: '#64748B',
                borderColor: '#E2E8F0',
                '&:hover': {
                  borderColor: '#CBD5E1',
                  backgroundColor: '#F8FAFC',
                  color: '#0F172A',
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
