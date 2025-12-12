import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Typography,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import axios from 'axios';

const VendorFieldOfficerManagement = () => {
  const [fieldOfficers, setFieldOfficers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [vendorName, setVendorName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: ''
  });

  useEffect(() => {
    fetchFieldOfficers();
    fetchVendorInfo();
  }, []);

  const fetchVendorInfo = async () => {
    try {
      const vendorToken = localStorage.getItem('vendorToken');
      const vendorUser = localStorage.getItem('vendorUser');
      if (vendorUser) {
        const user = JSON.parse(vendorUser);
        setVendorName(user.company || '');
      }
    } catch (err) {
      console.error('Error fetching vendor info:', err);
    }
  };

  const fetchFieldOfficers = async () => {
    try {
      setLoading(true);
      const vendorToken = localStorage.getItem('vendorToken');
      const response = await axios.get('http://localhost:5000/api/vendor-portal/field-officers', {
        headers: { Authorization: `Bearer ${vendorToken}` }
      });
      setFieldOfficers(response.data.fieldOfficers || []);
      setError('');
    } catch (err) {
      setError('Failed to load field officers');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (officer = null) => {
    if (officer) {
      setEditingId(officer.id);
      setFormData({
        name: officer.name,
        email: officer.email,
        phoneNumber: officer.phoneNumber,
        password: ''
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        email: '',
        phoneNumber: '',
        password: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
    setError('');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const vendorToken = localStorage.getItem('vendorToken');
      if (editingId) {
        await axios.put(
          `http://localhost:5000/api/vendor-portal/field-officers/${editingId}`,
          formData,
          { headers: { Authorization: `Bearer ${vendorToken}` } }
        );
        setSuccess('Field officer updated successfully');
      } else {
        await axios.post(
          'http://localhost:5000/api/vendor-portal/field-officers',
          formData,
          { headers: { Authorization: `Bearer ${vendorToken}` } }
        );
        setSuccess('Field officer created successfully');
      }
      handleCloseDialog();
      fetchFieldOfficers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save field officer');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (e, officer) => {
    setAnchorEl(e.currentTarget);
    setSelectedOfficer(officer);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleOpenDialog(selectedOfficer);
    handleMenuClose();
  };

  const handleToggleStatus = async () => {
    try {
      setLoading(true);
      const vendorToken = localStorage.getItem('vendorToken');
      await axios.put(
        `http://localhost:5000/api/vendor-portal/field-officers/${selectedOfficer.id}/toggle-status`,
        {},
        { headers: { Authorization: `Bearer ${vendorToken}` } }
      );
      setSuccess(`Field officer ${selectedOfficer.status === 'active' ? 'deactivated' : 'activated'}`);
      fetchFieldOfficers();
      handleMenuClose();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to toggle status');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this field officer?')) {
      try {
        setLoading(true);
        const vendorToken = localStorage.getItem('vendorToken');
        await axios.delete(
          `http://localhost:5000/api/vendor-portal/field-officers/${selectedOfficer.id}`,
          { headers: { Authorization: `Bearer ${vendorToken}` } }
        );
        setSuccess('Field officer deleted successfully');
        fetchFieldOfficers();
        handleMenuClose();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to delete field officer');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Field Officers</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Field Officer
        </Button>
      </Box>

      {loading && fieldOfficers.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Phone</strong></TableCell>
                <TableCell><strong>Vendor</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fieldOfficers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">
                      No field officers. Create one to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                fieldOfficers.map((officer) => (
                  <TableRow key={officer.id} hover>
                    <TableCell>{officer.name}</TableCell>
                    <TableCell>{officer.email}</TableCell>
                    <TableCell>{officer.phoneNumber}</TableCell>
                    <TableCell>{vendorName}</TableCell>
                    <TableCell>
                      <Chip
                        label={officer.status === 'active' ? 'Active' : 'Inactive'}
                        color={officer.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, officer)}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={handleToggleStatus}>
          {selectedOfficer?.status === 'active' ? 'Deactivate' : 'Activate'}
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? 'Edit Field Officer' : 'Add Field Officer'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={editingId}
            />
            <TextField
              fullWidth
              label="Phone Number"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              label="Vendor"
              value={vendorName}
              disabled
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required={!editingId}
              helperText={editingId ? "Leave blank to keep current password" : ""}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.name || !formData.email || !formData.phoneNumber}
          >
            {editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VendorFieldOfficerManagement;
