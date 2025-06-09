import React, { useState, useEffect } from 'react';
import {
  Paper, TextField, Button, FormControl, InputLabel, Select,
  MenuItem, Box, Typography, Alert, CircularProgress, Switch,
  FormControlLabel
} from '@mui/material';
import { userService } from '../../services/userService';

const UserForm = ({ user, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    role: 'user',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!user;

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        full_name: user.full_name || '',
        password: '', // Never pre-fill password
        role: user.role || 'user',
        is_active: user.is_active !== undefined ? user.is_active : true
      });
    }
  }, [user]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.email) {
      setError('Username and email are required');
      return;
    }

    if (!isEditing && !formData.password) {
      setError('Password is required for new users');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const submitData = { ...formData };
      
      // Don't send empty password for updates
      if (isEditing && !submitData.password) {
        delete submitData.password;
      }

      if (isEditing) {
        await userService.updateUser(user.id, submitData);
        onSuccess('User updated successfully');
      } else {
        await userService.createUser(submitData);
        onSuccess('User created successfully');
      }
    } catch (error) {
      setError(error.response?.data?.detail || `Failed to ${isEditing ? 'update' : 'create'} user`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h6" gutterBottom>
        {isEditing ? 'Edit User' : 'Create New User'}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Username"
          value={formData.username}
          onChange={(e) => handleChange('username', e.target.value)}
          margin="normal"
          required
          disabled={isEditing} // Usually don't allow username changes
        />

        <TextField
          fullWidth
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          margin="normal"
          required
        />

        <TextField
          fullWidth
          label="Full Name"
          value={formData.full_name}
          onChange={(e) => handleChange('full_name', e.target.value)}
          margin="normal"
        />

        <TextField
          fullWidth
          label={isEditing ? "New Password (leave blank to keep current)" : "Password"}
          type="password"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          margin="normal"
          required={!isEditing}
        />

        <FormControl fullWidth margin="normal">
          <InputLabel>Role</InputLabel>
          <Select
            value={formData.role}
            onChange={(e) => handleChange('role', e.target.value)}
          >
            <MenuItem value="user">User</MenuItem>
            <MenuItem value="admin">Administrator</MenuItem>
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Switch
              checked={formData.is_active}
              onChange={(e) => handleChange('is_active', e.target.checked)}
            />
          }
          label="Active User"
          sx={{ mt: 2, mb: 2 }}
        />

        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? `${isEditing ? 'Updating' : 'Creating'}...` : `${isEditing ? 'Update' : 'Create'} User`}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default UserForm;