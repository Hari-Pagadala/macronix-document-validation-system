import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const EditCaseModal = ({ open, onClose, record, onUpdate }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [loadingOfficers, setLoadingOfficers] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [vendors, setVendors] = useState([]);
  const [fieldOfficers, setFieldOfficers] = useState([]);
  const [vendorsLoaded, setVendorsLoaded] = useState(false);
  
  const [formData, setFormData] = useState({
    caseNumber: '',
    firstName: '',
    lastName: '',
    contactNumber: '',
    email: '',
    address: '',
    state: '',
    district: '',
    pincode: '',
    assignedVendor: '',
    assignedFieldOfficer: ''
  });

  useEffect(() => {
    if (record) {
      setFormData({
        caseNumber: record.caseNumber || '',
        firstName: record.firstName || '',
        lastName: record.lastName || '',
        contactNumber: record.contactNumber || '',
        email: record.email || '',
        address: record.address || '',
        state: record.state || '',
        district: record.district || '',
        pincode: record.pincode || '',
        assignedVendor: record.assignedVendor || '',
        assignedFieldOfficer: record.assignedFieldOfficer || ''
      });
    }
  }, [record]);

  // Fetch vendors only once when modal opens
  useEffect(() => {
    if (open && !vendorsLoaded) {
      fetchVendors();
      setVendorsLoaded(true);
    }
  }, [open, vendorsLoaded]);

  // Fetch field officers when vendor is selected or when vendors are loaded with existing vendor
  useEffect(() => {
    if (formData.assignedVendor && open && vendors.length > 0) {
      fetchFieldOfficers(formData.assignedVendor);
    } else if (!formData.assignedVendor) {
      setFieldOfficers([]);
    }
  }, [formData.assignedVendor, open, vendors.length]);

  const fetchVendors = async () => {
    try {
      setLoadingVendors(true);
      const response = await axios.get('http://localhost:5000/api/vendors/active', {
        timeout: 5000,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setVendors(response.data.vendors || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setError('Failed to load vendors. Please try again.');
    } finally {
      setLoadingVendors(false);
    }
  };

  const fetchFieldOfficers = async (vendorId) => {
    try {
      setLoadingOfficers(true);
      const response = await axios.get(`http://localhost:5000/api/field-officers/vendor/${vendorId}`, {
        timeout: 5000,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setFieldOfficers(response.data.fieldOfficers || []);
    } catch (error) {
      console.error('Error fetching field officers:', error);
      setError('Failed to load field officers. Please try again.');
      setFieldOfficers([]);
    } finally {
      setLoadingOfficers(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const updateData = {
        ...formData,
        // Clear field officer if vendor is cleared
        assignedFieldOfficer: formData.assignedVendor ? formData.assignedFieldOfficer : ''
      };

      const response = await axios.put(
        `http://localhost:5000/api/records/${record.id}`,
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Show success message
      if (formData.assignedVendor && formData.assignedFieldOfficer) {
        setSuccess('Case assigned successfully! Status changed to "Assigned" and TAT created for 7 days.');
        setTimeout(() => {
          onUpdate();
          onClose();
        }, 2000);
      } else {
        onUpdate();
        onClose();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error updating record');
    } finally {
      setLoading(false);
    }
  };

  if (!record) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          Edit Case: {record.caseNumber}
          <Box component="span" sx={{ ml: 2, fontSize: '0.9rem', color: 'text.secondary' }}>
            Ref: {record.referenceNumber}
          </Box>
        </Typography>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Customer Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Case Number"
                name="caseNumber"
                value={formData.caseNumber}
                onChange={handleChange}
                required
                disabled
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Reference Number"
                value={record.referenceNumber}
                disabled
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Number"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
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
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="State"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="District"
                name="district"
                value={formData.district}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Pincode"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 2 }}>
                Assignment Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={loadingVendors}>
                <InputLabel>Assign Vendor</InputLabel>
                <Select
                  name="assignedVendor"
                  value={formData.assignedVendor}
                  onChange={handleChange}
                  label="Assign Vendor"
                >
                  <MenuItem value="">
                    <em>{loadingVendors ? 'Loading vendors...' : 'Select Vendor'}</em>
                  </MenuItem>
                  {vendors.map((vendor) => (
                    <MenuItem key={vendor.id} value={vendor.id}>
                      {vendor.company} ({vendor.name})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!formData.assignedVendor || loadingOfficers}>
                <InputLabel>Assign Field Officer</InputLabel>
                <Select
                  name="assignedFieldOfficer"
                  value={formData.assignedFieldOfficer}
                  onChange={handleChange}
                  label="Assign Field Officer"
                >
                  <MenuItem value="">
                    <em>{loadingOfficers ? 'Loading officers...' : 'Select Field Officer'}</em>
                  </MenuItem>
                  {fieldOfficers.map((officer) => (
                    <MenuItem key={officer.id} value={officer.id}>
                      {officer.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Update Case'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditCaseModal;