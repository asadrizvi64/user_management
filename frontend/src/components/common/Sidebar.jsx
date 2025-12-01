import React from 'react';
import {
  Drawer, List, ListItem, ListItemIcon, ListItemText,
  ListItemButton, Divider, Box, Typography
} from '@mui/material';
import {
  Dashboard, PhotoLibrary, People,
  History, Assessment, Brush, AutoAwesome
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';

const drawerWidth = 240;

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
          mt: '64px',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E2E8F0',
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', px: 1.5 }}>
          Navigation
        </Typography>
      </Box>

      <List sx={{ px: 2, py: 0 }}>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={isActive(item.path)}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: '6px',
                py: 1.25,
                px: 1.5,
                minHeight: 0,
                transition: 'all 0.15s ease',
                '&:hover': {
                  backgroundColor: '#F8FAFC',
                },
                '&.Mui-selected': {
                  backgroundColor: '#0F172A',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#1E293B',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                  '& .MuiListItemText-primary': {
                    fontWeight: 600,
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActive(item.path) ? 'white' : '#64748B',
                  minWidth: 36,
                  fontSize: '1.25rem',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: isActive(item.path) ? 600 : 500,
                  fontSize: '0.875rem',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {isAdmin && (
        <>
          <Divider sx={{ my: 3, mx: 2 }} />

          <Box sx={{ px: 3, mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', px: 1.5 }}>
              Admin
            </Typography>
          </Box>

          <List sx={{ px: 2, py: 0 }}>
            {adminItems.map((item) => (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={isActive(item.path)}
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: '6px',
                    py: 1.25,
                    px: 1.5,
                    minHeight: 0,
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      backgroundColor: '#FEF2F2',
                    },
                    '&.Mui-selected': {
                      backgroundColor: '#DC2626',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: '#B91C1C',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                      '& .MuiListItemText-primary': {
                        fontWeight: 600,
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive(item.path) ? 'white' : '#DC2626',
                      minWidth: 36,
                      fontSize: '1.25rem',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: isActive(item.path) ? 600 : 500,
                      fontSize: '0.875rem',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Drawer>
  );
};

export default Sidebar;
