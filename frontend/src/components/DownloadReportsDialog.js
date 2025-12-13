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

const DownloadReportsDialog = ({ open, onClose }) => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({
    vendor: 'all',
    status: 'all',
    fromDate: '',
    toDate: ''
  });

  useEffect(() => {
    if (open) {
      fetchVendors();
    }
  }, [open]);

  const fetchVendors = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/vendors');
      setVendors(response.data.vendors || []);
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError('Failed to load vendors');
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const params = new URLSearchParams();
      if (filters.vendor !== 'all') params.append('vendor', filters.vendor);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);

      const response = await axios.get(
        `http://localhost:5000/api/reports/download-cases?${params.toString()}`,
        {
          responseType: 'blob'
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'Cases_Report.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess('Report downloaded successfully!');
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Error downloading report:', err);
      if (err.response?.status === 404) {
        setError('No cases found for the selected filters');
      } else {
        setError(err.response?.data?.message || 'Failed to download report');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Download Cases Report</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success">
              {success}
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary">
            Select filters to download case reports in Excel format
          </Typography>

          <FormControl fullWidth>
            <InputLabel>Vendor Name</InputLabel>
            <Select
              name="vendor"
              value={filters.vendor}
              onChange={handleFilterChange}
              label="Vendor Name"
            >
              <MenuItem value="all">All Vendors</MenuItem>
              {vendors.map((vendor) => (
                <MenuItem key={vendor.id} value={vendor.id}>
                  {vendor.company}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Case Status</InputLabel>
            <Select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              label="Case Status"
            >
              <MenuItem value="all">All Cases</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="assigned">Assigned</MenuItem>
              <MenuItem value="submitted">Submitted</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="insufficient">Insufficient</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="stopped">Stopped</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            type="date"
            name="fromDate"
            label="From Date"
            value={filters.fromDate}
            onChange={handleFilterChange}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            fullWidth
            type="date"
            name="toDate"
            label="To Date"
            value={filters.toDate}
            onChange={handleFilterChange}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleDownload}
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} /> : <DownloadIcon />}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Download Excel'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DownloadReportsDialog;
