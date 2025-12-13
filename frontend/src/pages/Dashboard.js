import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Button,
  CircularProgress,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Dashboard as DashboardIcon,
  Upload as UploadIcon,
  PersonAdd as PersonAddIcon,
  AssignmentInd as AssignmentIndIcon,
  PostAdd as PostAddIcon,
  Storage as StorageIcon,
  Home as HomeIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import RecordsTable from '../components/RecordsTable';
import UploadExcel from '../components/UploadExcel';
import VendorManagement from '../components/VendorManagement';
import FieldOfficerManagement from '../components/FieldOfficerManagement';
import DownloadReportsDialog from '../components/DownloadReportsDialog';
import axios from 'axios';

const drawerWidth = 240;

const Dashboard = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);

  useEffect(() => {
    if (token) {
      fetchDashboardStats();
    }
  }, [token]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/records/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Stats response:', response.data);
      if (response.data.success && response.data.stats) {
        setStats(response.data.stats);
      } else {
        console.error('Invalid stats response format:', response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleDrawerToggle = () => {
    setSideNavOpen(!sideNavOpen);
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    setSideNavOpen(false);
  };

  const tabStatusMap = ['all', 'pending', 'vendor_assigned', 'assigned', 'submitted', 'approved', 'insufficient', 'rejected', 'stopped'];

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <>
            {/* Stats Cards */}
            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : stats ? (
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={6} sm={4} md={2.4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h5" align="center" color="primary">
                        {stats.totalRecords || 0}
                      </Typography>
                      <Typography variant="body2" align="center" color="text.secondary">
                        Total Cases
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={4} md={2.4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h5" align="center" color="warning.main">
                        {stats.pendingRecords || 0}
                      </Typography>
                      <Typography variant="body2" align="center" color="text.secondary">
                        Pending
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={4} md={2.4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h5" align="center" sx={{ color: '#2196f3' }}>
                        {stats.vendorAssignedRecords || 0}
                      </Typography>
                      <Typography variant="body2" align="center" color="text.secondary">
                        Vendor Assigned
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={4} md={2.4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h5" align="center" color="info.main">
                        {stats.assignedRecords || 0}
                      </Typography>
                      <Typography variant="body2" align="center" color="text.secondary">
                        Assigned
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={4} md={2.4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h5" align="center" color="secondary.main">
                        {stats.submittedRecords || 0}
                      </Typography>
                      <Typography variant="body2" align="center" color="text.secondary">
                        Submitted
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={4} md={2.4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h5" align="center" color="success.main">
                        {stats.approvedRecords || 0}
                      </Typography>
                      <Typography variant="body2" align="center" color="text.secondary">
                        Approved
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Card>
                    <CardContent>
                      <Typography variant="h5" align="center" sx={{ color: '#ff9800' }}>
                        {stats.insufficientRecords || 0}
                      </Typography>
                      <Typography variant="body2" align="center" color="text.secondary">
                        Insufficient
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Card>
                    <CardContent>
                      <Typography variant="h5" align="center" color="error.main">
                        {stats.rejectedRecords || 0}
                      </Typography>
                      <Typography variant="body2" align="center" color="text.secondary">
                        Rejected
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Card>
                    <CardContent>
                      <Typography variant="h5" align="center" color="error.main">
                        {stats.stoppedRecords || 0}
                      </Typography>
                      <Typography variant="body2" align="center" color="text.secondary">
                        Stopped
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            ) : (
              <Box display="flex" justifyContent="center" py={4}>
                <Typography color="error">Failed to load statistics</Typography>
              </Box>
            )}

            {/* Tabs Section */}
            <Paper sx={{ width: '100%', mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                <Typography variant="h6">Case Records</Typography>
                <UploadExcel onSuccess={fetchDashboardStats} />
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
                <Tab label="Pending" />
                <Tab label="Vendor Assigned" />
                <Tab label="Assigned" />
                <Tab label="Submitted" />
                <Tab label="Approved" />
                <Tab label="Insufficient" />
                <Tab label="Rejected" />
                <Tab label="Stopped" />
              </Tabs>
            </Paper>

            {/* Records Table */}
            <RecordsTable status={tabStatusMap[activeTab]} />
          </>
        );
      
      case 'vendors':
        return <VendorManagement />;
      
      case 'field-officers':
        return <FieldOfficerManagement />;
      
      default:
        return (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <Typography variant="h6">Select a section from the menu</Typography>
          </Box>
        );
    }
  };

  const drawer = (
    <Box>
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h6">Document Validation</Typography>
        <Typography variant="caption">{user?.email}</Typography>
      </Box>
      <Divider />
      <List>
        <ListItem button onClick={() => handleSectionChange('dashboard')}>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button onClick={() => handleSectionChange('vendors')}>
          <ListItemIcon>
            <PersonAddIcon />
          </ListItemIcon>
          <ListItemText primary="Vendor Management" />
        </ListItem>
        <ListItem button onClick={() => handleSectionChange('field-officers')}>
          <ListItemIcon>
            <AssignmentIndIcon />
          </ListItemIcon>
          <ListItemText primary="Field Officers" />
        </ListItem>
        <ListItem button onClick={() => navigate('/manual-entry')}>
          <ListItemIcon>
            <PostAddIcon />
          </ListItemIcon>
          <ListItemText primary="Manual Entry" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: '100%',
          transition: 'all 0.3s ease',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {activeSection === 'dashboard' ? 'Dashboard' : 
             activeSection === 'vendors' ? 'Vendor Management' :
             activeSection === 'field-officers' ? 'Field Officer Management' : 'Document Validation'}
          </Typography>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => navigate('/manual-entry')}
            sx={{ mr: 2 }}
          >
            Manual Entry
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<DownloadIcon />}
            onClick={() => setDownloadDialogOpen(true)}
            sx={{ mr: 2 }}
          >
            Download Reports
          </Button>
          <IconButton
            color="inherit"
            onClick={handleMenuOpen}
          >
            <PersonIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem disabled>
              <Typography variant="body2">
                {user?.email}
              </Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: sideNavOpen ? drawerWidth : 0 }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={sideNavOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          mt: '64px',
          transition: 'all 0.3s ease',
        }}
      >
        <Container maxWidth="xl">
          {renderContent()}
        </Container>
      </Box>

      {/* Download Reports Dialog */}
      <DownloadReportsDialog 
        open={downloadDialogOpen} 
        onClose={() => setDownloadDialogOpen(false)} 
      />
    </Box>
  );
};

export default Dashboard;