// src/components/common/Sidebar.jsx - FIXED VERSION
import React from 'react';
import {
  Drawer, List, ListItem, ListItemIcon, ListItemText,
  ListItemButton, Divider, Chip
} from '@mui/material';
import {
  Dashboard, PhotoLibrary, ModelTraining, People,
  History, Assessment, Brush, AdminPanelSettings  // Changed Admin to AdminPanelSettings
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const drawerWidth = 260;

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
          mt: 8.75,
          backgroundColor: '#ffffff',
          borderRight: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.02)',
        },
      }}
    >
      <List sx={{ px: 2, py: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={isActive(item.path)}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: '12px',
                py: 1.5,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'rgba(99, 102, 241, 0.08)',
                  transform: 'translateX(4px)',
                },
                '&.Mui-selected': {
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActive(item.path) ? 'white' : '#6366f1',
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: isActive(item.path) ? 700 : 600,
                  fontSize: '0.95rem',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
        
        {isAdmin && (
          <>
            <Divider sx={{ my: 2 }} />
            <ListItem sx={{ px: 1 }}>
              <Chip
                label="Admin Panel"
                size="small"
                sx={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              />
            </ListItem>
            {adminItems.map((item) => (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={isActive(item.path)}
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: '12px',
                    py: 1.5,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      transform: 'translateX(4px)',
                    },
                    '&.Mui-selected': {
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive(item.path) ? 'white' : '#ef4444',
                      minWidth: 40,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: isActive(item.path) ? 700 : 600,
                      fontSize: '0.95rem',
                    }}
                  />
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