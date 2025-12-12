import React, { useEffect, useState } from 'react';
import { Box, Container, AppBar, Toolbar, Typography, Tabs, Tab, IconButton, Menu, MenuItem, Avatar, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import FieldOfficerCasesTable from '../components/FieldOfficerCasesTable';

const FieldOfficerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('fieldOfficerToken');
    const userStr = localStorage.getItem('fieldOfficerUser');
    if (!token || !userStr) {
      navigate('/field-officer/login');
      return;
    }
    setUser(JSON.parse(userStr));
  }, [navigate]);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleLogout = () => {
    localStorage.removeItem('fieldOfficerToken');
    localStorage.removeItem('fieldOfficerUser');
    navigate('/field-officer/login');
  };

  const tabStatusMap = ['assigned', 'submitted', 'approved', 'insufficient', 'rejected'];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {user?.name ? `FO: ${user.name}` : 'Field Officer Portal'}
          </Typography>
          <IconButton color="inherit" onClick={handleMenuOpen} sx={{ ml: 2 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {user?.name?.charAt(0) || 'F'}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem disabled>
              <Typography variant="body2">{user?.name}</Typography>
            </MenuItem>
            <MenuItem disabled>
              <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(e, v) => setActiveTab(v)}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Assigned" />
            <Tab label="Submitted" />
            <Tab label="Approved" />
            <Tab label="Insufficient" />
            <Tab label="Rejected" />
          </Tabs>
        </Box>

        <FieldOfficerCasesTable status={tabStatusMap[activeTab]} />
      </Container>
    </Box>
  );
};

export default FieldOfficerDashboard;
