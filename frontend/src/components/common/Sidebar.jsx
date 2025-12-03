import React from 'react';
import {
  Drawer, List, ListItem, ListItemIcon, ListItemText,
  ListItemButton, Divider, Box, Typography
} from '@mui/material';
import {
  Dashboard, PhotoLibrary, People,
  History, Assessment, Brush, AutoAwesome, Palette
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';

const drawerWidth = 280;

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const menuItems = [
    { path: '/editor', label: 'Dashboard', icon: <Dashboard />, gradient: '135deg, #8b5cf6, #6366f1' },
    { path: '/generation', label: 'Generate', icon: <AutoAwesome />, gradient: '135deg, #ec4899, #f97316' },
    { path: '/products', label: 'Products', icon: <PhotoLibrary />, gradient: '135deg, #3b82f6, #06b6d4' },
    { path: '/products/inpaint', label: 'Product Inpaint', icon: <Palette />, gradient: '135deg, #06b6d4, #10b981' },
    { path: '/inpainting', label: 'Inpainting', icon: <Brush />, gradient: '135deg, #10b981, #22c55e' },
    { path: '/history', label: 'History', icon: <History />, gradient: '135deg, #f59e0b, #eab308' },
  ];

  const adminItems = [
    { path: '/users', label: 'Users', icon: <People />, gradient: '135deg, #ef4444, #dc2626' },
    { path: '/reports', label: 'Reports', icon: <Assessment />, gradient: '135deg, #8b5cf6, #ec4899' },
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
          background: 'linear-gradient(180deg, rgba(20, 20, 27, 0.95) 0%, rgba(26, 26, 36, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          borderRight: '2px solid rgba(139, 92, 246, 0.2)',
          boxShadow: '4px 0 30px rgba(0, 0, 0, 0.5)',
        },
      }}
    >
      <Box sx={{ px: 3, py: 4 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 800,
            fontSize: '0.75rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 3,
            display: 'block',
          }}
        >
          🚀 Main Menu
        </Typography>
        <List sx={{ p: 0 }}>
          {menuItems.map((item) => (
            <ListItem key={item.path} disablePadding sx={{ mb: 1.5 }}>
              <ListItemButton
                selected={isActive(item.path)}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: '16px',
                  py: 1.75,
                  px: 2.5,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    background: isActive(item.path)
                      ? `linear-gradient(${item.gradient})`
                      : 'transparent',
                    opacity: isActive(item.path) ? 0.15 : 0,
                    transition: 'opacity 0.3s ease',
                  },
                  border: isActive(item.path)
                    ? '2px solid rgba(139, 92, 246, 0.5)'
                    : '2px solid transparent',
                  '&:hover': {
                    transform: 'translateX(8px)',
                    background: `linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))`,
                    border: '2px solid rgba(139, 92, 246, 0.3)',
                    boxShadow: '0 8px 24px rgba(139, 92, 246, 0.2)',
                    '&::before': {
                      opacity: 0.15,
                    },
                  },
                  '&.Mui-selected': {
                    background: `linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.15))`,
                    boxShadow: '0 8px 24px rgba(139, 92, 246, 0.3)',
                    '&:hover': {
                      background: `linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))`,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: '#ffffff',
                    minWidth: 44,
                    '& svg': {
                      fontSize: 26,
                      filter: isActive(item.path)
                        ? 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.6))'
                        : 'none',
                    },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActive(item.path) ? 800 : 600,
                    fontSize: '1rem',
                    color: '#ffffff',
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
                my: 4,
                borderColor: 'rgba(139, 92, 246, 0.2)',
                borderWidth: '1px',
              }}
            />
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                fontSize: '0.75rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                background: 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 3,
                display: 'block',
              }}
            >
              ⚡ Administration
            </Typography>
            <List sx={{ p: 0 }}>
              {adminItems.map((item) => (
                <ListItem key={item.path} disablePadding sx={{ mb: 1.5 }}>
                  <ListItemButton
                    selected={isActive(item.path)}
                    onClick={() => navigate(item.path)}
                    sx={{
                      borderRadius: '16px',
                      py: 1.75,
                      px: 2.5,
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        background: isActive(item.path)
                          ? `linear-gradient(${item.gradient})`
                          : 'transparent',
                        opacity: isActive(item.path) ? 0.15 : 0,
                        transition: 'opacity 0.3s ease',
                      },
                      border: isActive(item.path)
                        ? '2px solid rgba(236, 72, 153, 0.5)'
                        : '2px solid transparent',
                      '&:hover': {
                        transform: 'translateX(8px)',
                        background: `linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(249, 115, 22, 0.1))`,
                        border: '2px solid rgba(236, 72, 153, 0.3)',
                        boxShadow: '0 8px 24px rgba(236, 72, 153, 0.2)',
                        '&::before': {
                          opacity: 0.15,
                        },
                      },
                      '&.Mui-selected': {
                        background: `linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(249, 115, 22, 0.15))`,
                        boxShadow: '0 8px 24px rgba(236, 72, 153, 0.3)',
                        '&:hover': {
                          background: `linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(249, 115, 22, 0.2))`,
                        },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: '#ffffff',
                        minWidth: 44,
                        '& svg': {
                          fontSize: 26,
                          filter: isActive(item.path)
                            ? 'drop-shadow(0 0 8px rgba(236, 72, 153, 0.6))'
                            : 'none',
                        },
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontWeight: isActive(item.path) ? 800 : 600,
                        fontSize: '1rem',
                        color: '#ffffff',
                        letterSpacing: '-0.01em',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </>
        )}

        {/* Statement Card at Bottom */}
        <Box
          sx={{
            mt: 4,
            p: 3,
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))',
            border: '2px solid rgba(139, 92, 246, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
            },
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              color: '#ffffff',
              mb: 1,
              position: 'relative',
              zIndex: 1,
            }}
          >
            🎨 Pro Features
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: '#d1d5db',
              fontSize: '0.8125rem',
              lineHeight: 1.5,
              position: 'relative',
              zIndex: 1,
            }}
          >
            Access advanced AI tools and premium features
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
