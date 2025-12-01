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
    { path: '/inpainting', label: 'Inpainting', icon: <Brush /> },
    { path: '/history', label: 'History', icon: <History /> },
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
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          boxShadow: 'none',
        },
      }}
    >
      <Box sx={{ px: 3, py: 4 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            fontSize: '0.6875rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#94a3b8',
            mb: 2,
            display: 'block',
          }}
        >
          Main Menu
        </Typography>
        <List sx={{ p: 0 }}>
          {menuItems.map((item) => (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={isActive(item.path)}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: '8px',
                  py: 1.25,
                  px: 1.5,
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    backgroundColor: '#f8fafc',
                  },
                  '&.Mui-selected': {
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    '&:hover': {
                      backgroundColor: '#dbeafe',
                    },
                    '& .MuiListItemIcon-root': {
                      color: '#2563eb',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive(item.path) ? '#2563eb' : '#64748b',
                    minWidth: 36,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActive(item.path) ? 600 : 500,
                    fontSize: '0.9375rem',
                    color: isActive(item.path) ? '#2563eb' : '#0f172a',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        {isAdmin && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                fontSize: '0.6875rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#94a3b8',
                mb: 2,
                display: 'block',
              }}
            >
              Administration
            </Typography>
            <List sx={{ p: 0 }}>
              {adminItems.map((item) => (
                <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    selected={isActive(item.path)}
                    onClick={() => navigate(item.path)}
                    sx={{
                      borderRadius: '8px',
                      py: 1.25,
                      px: 1.5,
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        backgroundColor: '#f8fafc',
                      },
                      '&.Mui-selected': {
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        '&:hover': {
                          backgroundColor: '#dbeafe',
                        },
                        '& .MuiListItemIcon-root': {
                          color: '#2563eb',
                        },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: isActive(item.path) ? '#2563eb' : '#64748b',
                        minWidth: 36,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontWeight: isActive(item.path) ? 600 : 500,
                        fontSize: '0.9375rem',
                        color: isActive(item.path) ? '#2563eb' : '#0f172a',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Box>
    </Drawer>
  );
};

export default Sidebar;
