import React, { useState, useEffect } from 'react';
import {
  Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, IconButton, Chip, Avatar, Box, TextField, InputAdornment,
  Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Pagination, Tooltip
} from '@mui/material';
import {
  MoreVert, Edit, Delete, Block, CheckCircle, Search,
  Person, AdminPanelSettings
} from '@mui/icons-material';
import { userService } from '../../services/userService';

const UserList = ({ filterRole, onEditUser, onUserAction, refreshTrigger }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toggleStatusDialogOpen, setToggleStatusDialogOpen] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [page, search, filterRole, refreshTrigger]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = {
        skip: (page - 1) * limit,
        limit,
        ...(search && { search }),
        ...(filterRole && { role: filterRole })
      };
      
      const response = await userService.getUsers(params);
      setUsers(response.users);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleEdit = () => {
    onEditUser(selectedUser);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleToggleStatusClick = () => {
    setToggleStatusDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    try {
      await userService.deleteUser(selectedUser.id);
      onUserAction('User deleted successfully');
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleToggleStatusConfirm = async () => {
    try {
      await userService.toggleUserStatus(selectedUser.id);
      const action = selectedUser.is_active ? 'disabled' : 'enabled';
      onUserAction(`User ${action} successfully`);
      setToggleStatusDialogOpen(false);
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    }
  };

  const getRoleChip = (role) => {
    return (
      <Chip
        icon={role === 'admin' ? <AdminPanelSettings /> : <Person />}
        label={role.toUpperCase()}
        size="small"
        color={role === 'admin' ? 'error' : 'primary'}
        variant="outlined"
      />
    );
  };

  const getStatusChip = (isActive) => {
    return (
      <Chip
        label={isActive ? 'Active' : 'Disabled'}
        size="small"
        color={isActive ? 'success' : 'default'}
        variant={isActive ? 'filled' : 'outlined'}
      />
    );
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <Box>
      {/* Search */}
      <TextField
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3, minWidth: 300 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          )
        }}
      />

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell width={50}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar>
                      {user.full_name?.charAt(0) || user.username.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {user.full_name || user.username}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        @{user.username}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                
                <TableCell>{user.email}</TableCell>
                
                <TableCell>{getRoleChip(user.role)}</TableCell>
                
                <TableCell>{getStatusChip(user.is_active)}</TableCell>
                
                <TableCell>
                  <Typography variant="body2">
                    {new Date(user.created_at).toLocaleDateString()}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2">
                    {user.last_login 
                      ? new Date(user.last_login).toLocaleDateString()
                      : 'Never'
                    }
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Tooltip title="More actions">
                    <IconButton
                      onClick={(e) => handleMenuClick(e, user)}
                      size="small"
                    >
                      <MoreVert />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, newPage) => setPage(newPage)}
            color="primary"
          />
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <Edit sx={{ mr: 2 }} />
          Edit User
        </MenuItem>
        
        <MenuItem onClick={handleToggleStatusClick}>
          {selectedUser?.is_active ? <Block sx={{ mr: 2 }} /> : <CheckCircle sx={{ mr: 2 }} />}
          {selectedUser?.is_active ? 'Disable User' : 'Enable User'}
        </MenuItem>
        
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 2 }} />
          Delete User
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user "{selectedUser?.username}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toggle Status Confirmation Dialog */}
      <Dialog open={toggleStatusDialogOpen} onClose={() => setToggleStatusDialogOpen(false)}>
        <DialogTitle>
          {selectedUser?.is_active ? 'Disable User' : 'Enable User'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {selectedUser?.is_active ? 'disable' : 'enable'} user "{selectedUser?.username}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToggleStatusDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleToggleStatusConfirm} color="primary" variant="contained">
            {selectedUser?.is_active ? 'Disable' : 'Enable'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserList;
