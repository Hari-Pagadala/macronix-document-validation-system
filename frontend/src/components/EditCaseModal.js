import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  CircularProgress,
  Paper,
  Divider,
  styled
} from '@mui/material';
import {
  Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Static vendors cache to avoid redundant fetches
let vendorsCache = null;

// Styled Select component for better dropdown appearance
const StyledSelect = styled(Select)(({ theme }) => ({
  width: '200px',
  '& .MuiOutlinedInput-root': {
    width: '100%',
    '& fieldset': {
      borderColor: '#e0e0e0',
      transition: 'all 0.3s ease',
    },
    '&:hover fieldset': {
      borderColor: '#667eea',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#667eea',
      borderWidth: 2,
    },
  },
  '& .MuiSelect-select': {
    padding: '10px 14px',
    width: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
  },
  '& .MuiOutlinedInput-input': {
    color: '#333',
    width: '100%',
  },
}));

const EditCaseModal = ({ open, onClose, record, onUpdate }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingOfficers, setLoadingOfficers] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [vendors, setVendors] = useState([]);
  const [fieldOfficers, setFieldOfficers] = useState([]);
  const previousVendorRef = useRef('');
  
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

  // Initialize form data and load vendors on modal open
  useEffect(() => {
    if (open && record) {
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
      previousVendorRef.current = record.assignedVendor || '';
      
      // Load vendors from cache or fetch
      if (vendorsCache) {
        setVendors(vendorsCache);
        // Load field officers if vendor already assigned
        if (record.assignedVendor) {
          fetchFieldOfficers(record.assignedVendor);
        }
      } else {
        fetchVendors();
      }
      
      setError('');
      setSuccess('');
    }
  }, [open, record]);

  // Fetch field officers only when vendor selection changes
  useEffect(() => {
    if (formData.assignedVendor && formData.assignedVendor !== previousVendorRef.current) {
      fetchFieldOfficers(formData.assignedVendor);
      previousVendorRef.current = formData.assignedVendor;
    } else if (!formData.assignedVendor) {
      setFieldOfficers([]);
      previousVendorRef.current = '';
    }
  }, [formData.assignedVendor]);

  const fetchVendors = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/vendors/active', {
        timeout: 5000,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const vendorsList = response.data.vendors || [];
      vendorsCache = vendorsList;
      setVendors(vendorsList);
      
      // Load field officers if vendor is pre-assigned
      if (record?.assignedVendor) {
        fetchFieldOfficers(record.assignedVendor);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setError('Failed to load vendors. Please try again.');
    }
  }, [token, record]);

  const fetchFieldOfficers = useCallback(async (vendorId) => {
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
  }, [token]);

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
        assignedFieldOfficer: formData.assignedFieldOfficer || null
      };

      await axios.put(
        `http://localhost:5000/api/records/${record.id}`,
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (formData.assignedVendor) {
        if (formData.assignedFieldOfficer) {
          setSuccess('Case assigned successfully! Status changed to "Assigned" and TAT created for 7 days.');
        } else {
          setSuccess('Case assigned to Vendor! Status changed to "Vendor Assigned".');
        }
        setTimeout(() => {
          onUpdate();
          onClose();
        }, 1500);
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
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        pb: 2
      }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Edit Case: {record.caseNumber}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            Ref: {record.referenceNumber}
          </Typography>
        </Box>
        <Button
          onClick={onClose}
          sx={{
            color: 'white',
            minWidth: 'auto',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
          }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ py: 3, background: '#f9fafb' }}>
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
          
          {/* Customer Information Section */}
          <Paper sx={{ p: 2.5, mb: 3, background: '#fff', border: '1px solid #e0e0e0' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#667eea' }}>
              👤 Customer Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Case Number"
                  name="caseNumber"
                  value={formData.caseNumber}
                  onChange={handleChange}
                  disabled
                  size="small"
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Reference Number"
                  value={record.referenceNumber}
                  disabled
                  size="small"
                  variant="outlined"
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
                  size="small"
                  variant="outlined"
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
                  size="small"
                  variant="outlined"
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
                  size="small"
                  variant="outlined"
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
                  size="small"
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Address Information Section */}
          <Paper sx={{ p: 2.5, mb: 3, background: '#fff', border: '1px solid #e0e0e0' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#667eea' }}>
              🏠 Address Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
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
                  size="small"
                  variant="outlined"
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
                  size="small"
                  variant="outlined"
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
                  size="small"
                  variant="outlined"
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
                  size="small"
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Paper>
          
          {/* Assignment Information Section */}
          <Paper sx={{ p: 2.5, background: '#fff', border: '1px solid #e0e0e0' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#667eea' }}>
              🎯 Assignment Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: '0.9rem' }}>Assign Vendor</InputLabel>
                  <StyledSelect
                    name="assignedVendor"
                    value={formData.assignedVendor}
                    onChange={handleChange}
                    label="Assign Vendor"
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          minWidth: '300px',
                          maxHeight: 300,
                          '& .MuiMenuItem-root': {
                            fontSize: '0.9rem',
                            padding: '10px 16px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%',
                            '&:hover': {
                              backgroundColor: '#f0f0ff',
                            },
                          },
                        },
                      },
                      anchorOrigin: {
                        vertical: 'bottom',
                        horizontal: 'left',
                      },
                      transformOrigin: {
                        vertical: 'top',
                        horizontal: 'left',
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>Select Vendor</em>
                    </MenuItem>
                    {vendors.length > 0 ? (
                      vendors.map((vendor) => (
                        <MenuItem key={vendor.id} value={vendor.id}>
                          {vendor.company} - {vendor.name}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>
                        <em>No vendors available</em>
                      </MenuItem>
                    )}
                  </StyledSelect>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" disabled={!formData.assignedVendor}>
                  <InputLabel sx={{ fontSize: '0.9rem' }}>Assign Field Officer</InputLabel>
                  <StyledSelect
                    name="assignedFieldOfficer"
                    value={formData.assignedFieldOfficer}
                    onChange={handleChange}
                    label="Assign Field Officer"
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          minWidth: '300px',
                          maxHeight: 300,
                          '& .MuiMenuItem-root': {
                            fontSize: '0.9rem',
                            padding: '10px 16px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%',
                            '&:hover': {
                              backgroundColor: '#f0f0ff',
                            },
                          },
                        },
                      },
                      anchorOrigin: {
                        vertical: 'bottom',
                        horizontal: 'left',
                      },
                      transformOrigin: {
                        vertical: 'top',
                        horizontal: 'left',
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>{loadingOfficers ? 'Loading...' : 'Select Field Officer'}</em>
                    </MenuItem>
                    {fieldOfficers.length > 0 ? (
                      fieldOfficers.map((officer) => (
                        <MenuItem key={officer.id} value={officer.id}>
                          {officer.name}
                        </MenuItem>
                      ))
                    ) : (
                      !loadingOfficers && formData.assignedVendor && (
                        <MenuItem disabled>
                          <em>No officers available</em>
                        </MenuItem>
                      )
                    )}
                  </StyledSelect>
                </FormControl>
              </Grid>
              
              {loadingOfficers && (
                <Grid item xs={12}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    color: '#667eea',
                    p: 1,
                    backgroundColor: '#f0f7ff',
                    borderRadius: 1,
                  }}>
                    <CircularProgress size={18} sx={{ color: '#667eea' }} />
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                      Loading field officers...
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>
        </DialogContent>
        
        <DialogActions sx={{ p: 2, background: '#f9fafb', justifyContent: 'flex-end', gap: 1 }}>
          <Button 
            onClick={onClose} 
            disabled={loading}
            variant="text"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained"
            disabled={loading}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #6a3f99 100%)'
              }
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                Updating...
              </>
            ) : (
              'Update Case'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditCaseModal;