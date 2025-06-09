import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Button, Alert, Tabs, Tab
} from '@mui/material';
import { Add, People, AdminPanelSettings } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import UserList from './UserList';
import UserForm from './UserForm';

const UserManagement = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect non-admin users
  if (!isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Access denied. Admin privileges required.
        </Alert>
      </Container>
    );
  }

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowUserForm(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleFormSuccess = (message) => {
    setShowUserForm(false);
    setEditingUser(null);
    setSuccess(message);
    setRefreshTrigger(prev => prev + 1);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleFormCancel = () => {
    setShowUserForm(false);
    setEditingUser(null);
  };

  const handleUserAction = (message) => {
    setSuccess(message);
    setRefreshTrigger(prev => prev + 1);
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            User Management
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Manage user accounts and permissions
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateUser}
          size="large"
        >
          Create User
        </Button>
      </Box>

      {/* Alerts */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab 
            icon={<People />} 
            label="All Users" 
            iconPosition="start"
          />
          <Tab 
            icon={<AdminPanelSettings />} 
            label="Administrators" 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Content */}
      {showUserForm ? (
        <UserForm
          user={editingUser}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      ) : (
        <UserList
          filterRole={activeTab === 1 ? 'admin' : null}
          onEditUser={handleEditUser}
          onUserAction={handleUserAction}
          refreshTrigger={refreshTrigger}
        />
      )}
    </Container>
  );
};

export default UserManagement;