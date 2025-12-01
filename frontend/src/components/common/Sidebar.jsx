import React from 'react';
import {
  Drawer, List, ListItem, ListItemIcon, ListItemText,
  ListItemButton, Divider, Box, Typography
} from '@mui/material';
import {
  Dashboard, PhotoLibrary, People,
  History, Assessment, Brush, AutoAwesome, Circle
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';

const drawerWidth = 260;

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const menuItems = [
    { path: '/editor', label: 'Dashboard', icon: <Dashboard /> },
    { path: '/generation', label: 'Generate', icon: <AutoAwesome /> },
    { path: '/products', label: 'Products', icon: <PhotoLibrary /> },
    { path: '/history', label: 'History', icon: <History /> },
    { path: '/inpainting', label: 'Inpainting', icon: <Brush /> },
  ];

  const adminItems = [
    { path: '/users', label: 'Users', icon: <People /> },
    { path: '/reports', label: 'Reports', icon: <Assessment /> },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          mt: '70px',
        },
      }}
    >
      <Box sx={{ p: 3, pb: 2 }}>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontWeight: 600,
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            px: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Circle sx={{ fontSize: '0.5rem', color: '#3B82F6' }} />
          Navigation
        </Typography>
      </Box>

      <List sx={{ px: 2.5, py: 0 }}>
        {menuItems.map((item, index) => (
          <ListItem
            key={item.path}
            disablePadding
            sx={{
              mb: 0.75,
              animation: `slide-in 0.3s ease-out ${index * 0.05}s backwards`,
            }}
          >
            <ListItemButton
              selected={isActive(item.path)}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: '12px',
                py: 1.5,
                px: 2,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: '3px',
                  background: 'linear-gradient(180deg, #3B82F6 0%, #8B5CF6 100%)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                },
                '&:hover': {
                  background: 'rgba(59, 130, 246, 0.08)',
                  transform: 'translateX(4px)',
                  '&::before': {
                    opacity: 0.6,
                  },
                },
                '&.Mui-selected': {
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                  '&::before': {
                    opacity: 1,
                  },
                  '&:hover': {
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                  },
                  '& .MuiListItemIcon-root': {
                    color: '#60A5FA',
                    filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))',
                  },
                  '& .MuiListItemText-primary': {
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActive(item.path) ? '#60A5FA' : '#94A3B8',
                  minWidth: 40,
                  transition: 'all 0.3s ease',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: isActive(item.path) ? 700 : 500,
                  fontSize: '0.9375rem',
                  letterSpacing: '-0.01em',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {isAdmin && (
        <>
          <Divider
            sx={{
              my: 3,
              mx: 3,
              borderColor: 'rgba(59, 130, 246, 0.1)',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60%',
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.4), transparent)',
              },
            }}
          />

          <Box sx={{ px: 3, pb: 2 }}>
            <Typography
              variant="caption"
              sx={{
                color: '#EF4444',
                fontWeight: 600,
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                px: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Circle sx={{ fontSize: '0.5rem', color: '#EF4444', animation: 'glow-pulse 2s ease-in-out infinite' }} />
              Admin
            </Typography>
          </Box>

          <List sx={{ px: 2.5, py: 0 }}>
            {adminItems.map((item, index) => (
              <ListItem
                key={item.path}
                disablePadding
                sx={{
                  mb: 0.75,
                  animation: `slide-in 0.3s ease-out ${(menuItems.length + index) * 0.05}s backwards`,
                }}
              >
                <ListItemButton
                  selected={isActive(item.path)}
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: '12px',
                    py: 1.5,
                    px: 2,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: '3px',
                      background: 'linear-gradient(180deg, #EF4444 0%, #DC2626 100%)',
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                    },
                    '&:hover': {
                      background: 'rgba(239, 68, 68, 0.08)',
                      transform: 'translateX(4px)',
                      '&::before': {
                        opacity: 0.6,
                      },
                    },
                    '&.Mui-selected': {
                      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                      '&::before': {
                        opacity: 1,
                      },
                      '&:hover': {
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                      },
                      '& .MuiListItemIcon-root': {
                        color: '#F87171',
                        filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))',
                      },
                      '& .MuiListItemText-primary': {
                        fontWeight: 700,
                        color: '#F87171',
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive(item.path) ? '#F87171' : '#94A3B8',
                      minWidth: 40,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: isActive(item.path) ? 700 : 500,
                      fontSize: '0.9375rem',
                      letterSpacing: '-0.01em',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}

      {/* Decorative glow at bottom */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '100px',
          background: 'radial-gradient(ellipse at bottom, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
    </Drawer>
  );
};

export default Sidebar;
