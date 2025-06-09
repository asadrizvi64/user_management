import React from 'react';
import {
  Drawer, List, ListItem, ListItemIcon, ListItemText,
  ListItemButton, Divider, Chip
} from '@mui/material';
import {
  Dashboard, PhotoLibrary, ModelTraining, People,
  History, Assessment, Brush, Admin
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const drawerWidth = 240;

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const menuItems = [
    { path: '/editor', label: 'Image Editor', icon: <Dashboard /> },
    { path: '/products', label: 'Products', icon: <PhotoLibrary /> },
    { path: '/history', label: 'History', icon: <History /> },
    { path: '/inpainting', label: 'Inpainting', icon: <Brush /> },
  ];

  const adminItems = [
    { path: '/users', label: 'User Management', icon: <People /> },
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
          mt: 8, // Account for header height
        },
      }}
    >
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={isActive(item.path)}
              onClick={() => navigate(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: isActive(item.path) ? 'white' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
        
        {isAdmin && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItem>
              <Chip label="Admin" color="error" size="small" />
            </ListItem>
            {adminItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  selected={isActive(item.path)}
                  onClick={() => navigate(item.path)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'error.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'error.dark',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: isActive(item.path) ? 'white' : 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </>
        )}
      </List>
    </Drawer>
  );
};

export default Sidebar;