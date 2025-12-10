import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';

const ViewDetailsModal = ({ open, onClose, recordId }) => {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && recordId) {
      fetchRecordDetails();
    }
  }, [open, recordId]);

  const fetchRecordDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`http://localhost:5000/api/records/${recordId}`);
      setRecord(response.data.record);
    } catch (err) {
      setError('Failed to load record details');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const DetailRow = ({ label, value }) => (
    <Box sx={{ py: 1.5, borderBottom: '1px solid #eee' }}>
      <Grid container spacing={2}>
        <Grid item xs={5}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#666' }}>
            {label}
          </Typography>
        </Grid>
        <Grid item xs={7}>
          <Typography variant="body2" sx={{ color: '#333' }}>
            {value || 'N/A'}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
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
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Case Details
        </Typography>
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

      <DialogContent dividers sx={{ py: 3, background: '#f9fafb' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : record ? (
          <Box>
            {/* Case Information Section */}
            <Paper sx={{ p: 2, mb: 3, background: '#fff' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#667eea' }}>
                📋 Case Information
              </Typography>
              <DetailRow label="Case Number" value={record.caseNumber} />
              <DetailRow label="Reference Number" value={record.referenceNumber} />
              <DetailRow label="Status" value={record.status?.toUpperCase()} />
            </Paper>

            {/* Customer Information Section */}
            <Paper sx={{ p: 2, mb: 3, background: '#fff' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#667eea' }}>
                👤 Customer Information
              </Typography>
              <DetailRow label="First Name" value={record.firstName} />
              <DetailRow label="Last Name" value={record.lastName} />
              <DetailRow label="Contact Number" value={record.contactNumber} />
              <DetailRow label="Email" value={record.email} />
            </Paper>

            {/* Address Information Section */}
            <Paper sx={{ p: 2, mb: 3, background: '#fff' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#667eea' }}>
                🏠 Address Information
              </Typography>
              <DetailRow label="Address" value={record.address} />
              <DetailRow label="State" value={record.state} />
              <DetailRow label="District" value={record.district} />
              <DetailRow label="Pincode" value={record.pincode} />
            </Paper>

            {/* Assignment Information Section */}
            <Paper sx={{ p: 2, mb: 3, background: '#fff' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#667eea' }}>
                🎯 Assignment Information
              </Typography>
              <DetailRow 
                label="Assigned Vendor Company" 
                value={
                  record.assignedVendorCompanyName || 
                  (record.assignedVendor?.company) || 
                  'Not assigned'
                } 
              />
              <DetailRow 
                label="Assigned Vendor Name" 
                value={
                  record.assignedVendorName || 
                  (record.assignedVendor?.name) || 
                  'Not assigned'
                } 
              />
              <DetailRow 
                label="Assigned Officer Name" 
                value={
                  record.assignedFieldOfficerName || 
                  (record.assignedFieldOfficer?.name) || 
                  'Not assigned'
                } 
              />
              <DetailRow label="Assigned Date" value={formatDate(record.assignedDate)} />
              <Box sx={{ py: 1.5 }}>
                <Grid container spacing={2}>
                  <Grid item xs={5}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#666' }}>
                      TAT Due Date
                    </Typography>
                  </Grid>
                  <Grid item xs={7}>
                    <Typography variant="body2" sx={{ color: '#333' }}>
                      {formatDate(record.tatDueDate)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Paper>

            {/* Dates Section */}
            <Paper sx={{ p: 2, background: '#fff' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#667eea' }}>
                📅 Timeline
              </Typography>
              <DetailRow label="Created Date" value={formatDate(record.createdAt)} />
              <DetailRow label="Uploaded Date" value={formatDate(record.uploadedDate)} />
              <DetailRow label="Completion Date" value={formatDate(record.completionDate)} />
            </Paper>
          </Box>
        ) : (
          <Typography color="textSecondary">No record data available</Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, background: '#f9fafb' }}>
        <Button 
          onClick={onClose}
          variant="contained"
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            '&:hover': {
              background: 'linear-gradient(135deg, #5568d3 0%, #6a3f99 100%)'
            }
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewDetailsModal;
