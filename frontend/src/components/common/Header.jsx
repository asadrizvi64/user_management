import React from 'react';
import {
  AppBar, Toolbar, Typography, IconButton, Menu, MenuItem,
  Avatar, Box, Badge
} from '@mui/material';
import { AccountCircle, Notifications, Logout } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useState } from 'react';

const Header = () => {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)'
      }}
    >
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Product Training Platform
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton color="inherit">
            <Badge badgeContent={0} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          
          <IconButton onClick={handleMenuOpen} color="inherit">
            <Avatar sx={{ width: 32, height: 32 }}>
              {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={handleMenuClose}>
              <AccountCircle sx={{ mr: 2 }} />
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 2 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
