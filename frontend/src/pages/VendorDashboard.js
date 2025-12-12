import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Button
} from '@mui/material';
import {
  AccountCircle,
  Assignment,
  PendingActions,
  CheckCircle,
  Cancel,
  Warning,
  Stop
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import VendorCasesTable from '../components/VendorCasesTable';
import VendorFieldOfficerManagement from '../components/VendorFieldOfficerManagement';

const VendorDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [stats, setStats] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    // Load vendor token and user from localStorage
    const vendorToken = localStorage.getItem('vendorToken');
    const vendorUser = localStorage.getItem('vendorUser');

    if (!vendorToken || !vendorUser) {
      navigate('/vendor/login');
      return;
    }

    setToken(vendorToken);
    setUser(JSON.parse(vendorUser));
    fetchStats(vendorToken);
  }, [navigate]);

  const fetchStats = async (vendorToken) => {
    try {
      const response = await axios.get('http://localhost:5000/api/vendor-portal/dashboard/stats', {
        headers: { Authorization: `Bearer ${vendorToken}` }
      });
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('vendorToken');
    localStorage.removeItem('vendorUser');
    delete axios.defaults.headers.common['Authorization'];
    navigate('/vendor/login');
  };

  const tabStatusMap = ['all', 'vendor_assigned', 'assigned', 'submitted', 'approved', 'insufficient', 'rejected', 'stopped'];

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <Box>
            {/* Statistics Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" align="center" color="primary.main">
                      {stats.totalAssignedCases || 0}
                    </Typography>
                    <Typography variant="body2" align="center" color="text.secondary">
                      Total Assigned Cases
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" align="center" color="warning.main">
                      {stats.pendingCases || 0}
                    </Typography>
                    <Typography variant="body2" align="center" color="text.secondary">
                      Pending
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" align="center" color="info.main">
                      {stats.vendorAssignedCases || 0}
                    </Typography>
                    <Typography variant="body2" align="center" color="text.secondary">
                      Vendor Assigned
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" align="center" color="info.main">
                      {stats.assignedToFieldOfficer || 0}
                    </Typography>
                    <Typography variant="body2" align="center" color="text.secondary">
                      Assigned to FO
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" align="center" color="secondary.main">
                      {stats.submittedCases || 0}
                    </Typography>
                    <Typography variant="body2" align="center" color="text.secondary">
                      Submitted
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" align="center" color="success.main">
                      {stats.approvedCases || 0}
                    </Typography>
                    <Typography variant="body2" align="center" color="text.secondary">
                      Approved
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" align="center" sx={{ color: '#ff9800' }}>
                      {stats.insufficientCases || 0}
                    </Typography>
                    <Typography variant="body2" align="center" color="text.secondary">
                      Insufficient
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" align="center" color="error.main">
                      {stats.rejectedCases || 0}
                    </Typography>
                    <Typography variant="body2" align="center" color="text.secondary">
                      Rejected
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Cases Table with Tabs */}
            <Paper sx={{ width: '100%', mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                <Typography variant="h6">My Cases</Typography>
              </Box>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                indicatorColor="primary"
                textColor="primary"
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="All Cases" />
                <Tab label="Vendor Assigned" />
                <Tab label="Assigned to FO" />
                <Tab label="Submitted" />
                <Tab label="Approved" />
                <Tab label="Insufficient" />
                <Tab label="Rejected" />
                <Tab label="Stopped" />
              </Tabs>
            </Paper>

            <VendorCasesTable status={tabStatusMap[activeTab]} onUpdate={fetchStats} />
          </Box>
        );

      case 'field-officers':
        return <VendorFieldOfficerManagement />;

      default:
        return null;
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {user?.company || 'Vendor Portal'}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              color="inherit" 
              onClick={() => setActiveSection('dashboard')}
              sx={{ fontWeight: activeSection === 'dashboard' ? 'bold' : 'normal' }}
            >
              Dashboard
            </Button>
            <Button 
              color="inherit" 
              onClick={() => setActiveSection('field-officers')}
              sx={{ fontWeight: activeSection === 'field-officers' ? 'bold' : 'normal' }}
            >
              Field Officers
            </Button>
          </Box>

          <IconButton
            color="inherit"
            onClick={handleMenuOpen}
            sx={{ ml: 2 }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {user?.name?.charAt(0) || 'V'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
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
        {renderContent()}
      </Container>
    </Box>
  );
};

export default VendorDashboard;
