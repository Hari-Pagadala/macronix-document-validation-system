import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Tabs,
  Tab,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PasswordField from './PasswordField';

const VendorManagement = () => {
  const { token, loading: authLoading } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phoneNumber: '',
    password: ''
  });
  const [passwordValid, setPasswordValid] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    console.log('VendorManagement useEffect: token=', !!token, 'authLoading=', authLoading);
    if (token && !authLoading) {
      fetchVendors();
    }
  }, [activeTab, token, authLoading]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      // Tab 0 = All, Tab 1 = Active, Tab 2 = Inactive
      let status = '';
      if (activeTab === 1) {
        status = 'active';
      } else if (activeTab === 2) {
        status = 'inactive';
      }
      console.log('Fetching vendors with status:', status, 'activeTab:', activeTab);
      
      const params = {};
      if (status) {
        params.status = status;
      }
      
      const response = await axios.get('http://localhost:5000/api/vendors', {
        params
      });
      console.log('Vendors response:', response.data);
      setVendors(response.data.vendors || []);
      setError('');
    } catch (err) {
      setError('Failed to load vendors');
      console.error('Error fetching vendors:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenDialog = (vendor = null) => {
    if (vendor) {
      setFormData({
        name: vendor.name,
        company: vendor.company,
        email: vendor.email,
        phoneNumber: vendor.phoneNumber,
        password: ''
      });
      setEditMode(true);
      setPasswordValid(true);
    } else {
      setFormData({
        name: '',
        company: '',
        email: '',
        phoneNumber: '',
        password: ''
      });
      setEditMode(false);
      setPasswordValid(false);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({
      name: '',
      company: '',
      email: '',
      phoneNumber: '',
      password: ''
    });
  };

  const handleInputChange = (e) => {
    const { name } = e.target;
    let value = e.target.value;
    if (name === 'phoneNumber') {
      value = value.replace(/[^0-9]/g, '');
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setEmailError(value && !emailRegex.test(value) ? 'Invalid email format' : '');
    }
    if (name === 'phoneNumber') {
      const phoneRegex = /^\d{10}$/;
      setPhoneError(value && !phoneRegex.test(value) ? 'Phone must be 10 digits' : '');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editMode) {
        // Find vendor to edit
        const vendorToEdit = vendors.find(v => v.email === formData.email);
        if (!vendorToEdit) {
          setError('Vendor not found');
          return;
        }
        await axios.put(`http://localhost:5000/api/vendors/${vendorToEdit.id}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/vendors', formData);
      }
      
      fetchVendors();
      handleCloseDialog();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving vendor');
    }
  };

  const handleToggleStatus = async (vendorId) => {
    try {
      await axios.patch(`http://localhost:5000/api/vendors/${vendorId}/toggle-status`, {});
      fetchVendors();
    } catch (err) {
      setError('Error toggling vendor status');
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Vendor Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Vendor
        </Button>
      </Box>

      <Paper sx={{ width: '100%', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="All Vendors" />
          <Tab label="Active Vendors" />
          <Tab label="Inactive Vendors" />
        </Tabs>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Company</TableCell>
                <TableCell>Contact Person</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography color="textSecondary">
                      No vendors found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                vendors.map((vendor) => (
                  <TableRow key={vendor.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{vendor.company}</Typography>
                    </TableCell>
                    <TableCell>{vendor.name}</TableCell>
                    <TableCell>{vendor.email}</TableCell>
                    <TableCell>{vendor.phoneNumber}</TableCell>
                    <TableCell>
                      <Chip
                        label={vendor.status}
                        color={vendor.status === 'active' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(vendor)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleStatus(vendor.id)}
                      >
                        {vendor.status === 'active' ? (
                          <ToggleOffIcon fontSize="small" color="error" />
                        ) : (
                          <ToggleOnIcon fontSize="small" color="success" />
                        )}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit Vendor' : 'Add New Vendor'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Person Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={editMode}
                  error={!!emailError}
                  helperText={emailError || (editMode ? 'Email cannot be changed' : '')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                  error={!!phoneError}
                  helperText={phoneError}
                  inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 10 }}
                  onKeyDown={(ev) => {
                    const allowed = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End'];
                    if (allowed.includes(ev.key)) return;
                    if (!/^[0-9]$/.test(ev.key)) {
                      ev.preventDefault();
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <PasswordField
                  value={formData.password}
                  onChange={handleInputChange}
                  name="password"
                  label="Password"
                  required={!editMode}
                  helperText={editMode ? "Leave blank to keep current password" : ""}
                  email={formData.email}
                  editMode={editMode}
                  showValidation
                  onValidityChange={setPasswordValid}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={
              (!editMode && (!formData.password || !passwordValid)) ||
              (editMode && formData.password && !passwordValid)
              || !formData.email || !!emailError || !formData.phoneNumber || !!phoneError
            }>
              {editMode ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Paper>
  );
};

export default VendorManagement;