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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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

const FieldOfficerManagement = () => {
  const [fieldOfficers, setFieldOfficers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const { token, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    vendor: ''
  });
  const [passwordValid, setPasswordValid] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    if (token && !authLoading) {
      fetchData();
    }
  }, [activeTab, token, authLoading]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch active vendors for dropdown
      const vendorsResponse = await axios.get('http://localhost:5000/api/vendors/active');
      setVendors(vendorsResponse.data.vendors || []);
      
      // Fetch field officers
      const status = activeTab === 0 ? 'active' : activeTab === 1 ? 'inactive' : '';
      const officersParams = {};
      if (status) {
        officersParams.status = status;
      }
      
      const officersResponse = await axios.get('http://localhost:5000/api/field-officers', {
        params: officersParams
      });
      
      setFieldOfficers(officersResponse.data.fieldOfficers || []);
      setError('');
    } catch (err) {
      setError('Failed to load data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenDialog = (officer = null) => {
    if (officer) {
      setFormData({
        name: officer.name,
        email: officer.email,
        phoneNumber: officer.phoneNumber,
        password: '',
        vendor: officer.vendorId || ''
      });
      setEditMode(true);
      setPasswordValid(true);
    } else {
      setFormData({
        name: '',
        email: '',
        phoneNumber: '',
        password: '',
        vendor: ''
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
      email: '',
      phoneNumber: '',
      password: '',
      vendor: ''
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
        // Find officer to edit
        const officerToEdit = fieldOfficers.find(o => o.email === formData.email);
        if (!officerToEdit) {
          setError('Field officer not found');
          return;
        }
        await axios.put(`http://localhost:5000/api/field-officers/${officerToEdit.id}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/field-officers', formData);
      }
      
      fetchData();
      handleCloseDialog();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving field officer');
    }
  };

  const handleToggleStatus = async (officerId) => {
    try {
      await axios.patch(`http://localhost:5000/api/field-officers/${officerId}/toggle-status`, {});
      fetchData();
    } catch (err) {
      setError('Error toggling field officer status');
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Field Officer Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={vendors.length === 0}
        >
          Add Field Officer
        </Button>
      </Box>

      {vendors.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No active vendors found. Please add vendors first.
        </Alert>
      )}

      <Paper sx={{ width: '100%', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Active Officers" />
          <Tab label="Inactive Officers" />
          <Tab label="All Officers" />
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
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fieldOfficers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography color="textSecondary">
                      No field officers found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                fieldOfficers.map((officer) => (
                  <TableRow key={officer.id} hover>
                    <TableCell>{officer.name}</TableCell>
                    <TableCell>{officer.email}</TableCell>
                    <TableCell>{officer.phoneNumber}</TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {officer.vendor?.company || officer.vendorName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={officer.status}
                        color={officer.status === 'active' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(officer)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleStatus(officer.id)}
                      >
                        {officer.status === 'active' ? (
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
          {editMode ? 'Edit Field Officer' : 'Add New Field Officer'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
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
              <FormControl fullWidth required>
                <InputLabel>Vendor</InputLabel>
                <Select
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleInputChange}
                  label="Vendor"
                >
                  <MenuItem value="">
                    <em>Select Vendor</em>
                  </MenuItem>
                  {vendors.map((vendor) => (
                    <MenuItem key={vendor.id} value={vendor.id}>
                      {vendor.company} ({vendor.name})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={
              !formData.vendor ||
              (!editMode && (!formData.password || !passwordValid)) ||
              (editMode && formData.password && !passwordValid) ||
              !formData.email || !!emailError || !formData.phoneNumber || !!phoneError
            }>
              {editMode ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Paper>
  );
};

export default FieldOfficerManagement;