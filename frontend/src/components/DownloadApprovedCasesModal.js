import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Typography
} from '@mui/material';
import {
  Download as DownloadIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const DownloadApprovedCasesModal = ({ open, onClose }) => {
  const { token } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingVendors, setFetchingVendors] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    vendor: '',
    fromDate: '',
    toDate: ''
  });

  useEffect(() => {
    if (open && token) {
      fetchVendors();
    }
  }, [open, token]);

  const fetchVendors = async () => {
    try {
      setFetchingVendors(true);
      const response = await axios.get('http://localhost:5000/api/vendors', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Vendors response:', response.data);
      setVendors(response.data.vendors || []);
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError('Failed to load vendors');
    } finally {
      setFetchingVendors(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
    setError('');
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate dates
      if (filters.fromDate && filters.toDate) {
        const fromDate = new Date(filters.fromDate);
        const toDate = new Date(filters.toDate);
        if (fromDate > toDate) {
          setError('From date must be before to date');
          setLoading(false);
          return;
        }
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (filters.vendor) {
        params.append('vendor', filters.vendor);
      }
      if (filters.fromDate) {
        params.append('fromDate', filters.fromDate);
      }
      if (filters.toDate) {
        params.append('toDate', filters.toDate);
      }

      const response = await axios.get(
        `http://localhost:5000/api/download/cases/zip?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );

      // Check if response is empty or error
      if (response.data.size === 0) {
        setError('No approved cases found matching your filters');
        setLoading(false);
        return;
      }

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      const vendorSuffix = filters.vendor ? `_${filters.vendor}` : '_All';
      link.setAttribute('download', `Macronix_Approved_Cases${vendorSuffix}_${dateStr}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // Close modal after successful download
      onClose();
      // Reset filters
      setFilters({
        vendor: '',
        fromDate: '',
        toDate: ''
      });

    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      if (errorMsg.includes('No approved cases')) {
        setError('No approved cases found matching your filters');
      } else {
        setError('Failed to download ZIP: ' + errorMsg);
      }
      console.error('Error downloading ZIP:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFilters({
      vendor: '',
      fromDate: '',
      toDate: ''
    });
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Download Approved Cases</DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && (
            <Alert severity="error">{error}</Alert>
          )}

          <FormControl fullWidth>
            <InputLabel>Vendor (Optional)</InputLabel>
            <Select
              name="vendor"
              value={filters.vendor}
              onChange={handleFilterChange}
              label="Vendor (Optional)"
              disabled={fetchingVendors || loading}
            >
              <MenuItem value="">
                <em>All Vendors</em>
              </MenuItem>
              {vendors.map((vendor) => (
                <MenuItem key={vendor.id} value={vendor.id}>
                  {vendor.company || vendor.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            type="date"
            label="From Date (Optional)"
            name="fromDate"
            value={filters.fromDate}
            onChange={handleFilterChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
            disabled={loading}
          />

          <TextField
            type="date"
            label="To Date (Optional)"
            name="toDate"
            value={filters.toDate}
            onChange={handleFilterChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
            disabled={loading}
          />

          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            All filters are optional. Leave blank to include all data.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleDownload}
          variant="contained"
          color="primary"
          disabled={loading || fetchingVendors}
          startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
        >
          {loading ? 'Downloading...' : 'Download'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DownloadApprovedCasesModal;
