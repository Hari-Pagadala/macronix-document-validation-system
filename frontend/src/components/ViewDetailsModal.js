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
  Divider,
  TextField
} from '@mui/material';
import {
  Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ViewDetailsModal = ({ open, onClose, recordId, onStopSuccess }) => {
  const { token } = useAuth();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [error, setError] = useState('');
  const [stopReason, setStopReason] = useState('');
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);

  useEffect(() => {
    if (open && recordId) {
      fetchRecordDetails();
    }
  }, [open, recordId]);

  const fetchRecordDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`http://localhost:5000/api/records/${recordId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setRecord(response.data.record);
    } catch (err) {
      setError('Failed to load record details');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStopCase = async () => {
    try {
      setStopping(true);
      const response = await axios.put(
        `http://localhost:5000/api/records/${recordId}/stop`,
        { reason: stopReason },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.data.success) {
        setRecord(response.data.record);
        setShowStopConfirm(false);
        setStopReason('');
        if (onStopSuccess) {
          onStopSuccess();
        }
      }
    } catch (err) {
      setError('Failed to stop case: ' + (err.response?.data?.message || err.message));
      console.error('Error stopping case:', err);
    } finally {
      setStopping(false);
    }
  };

  const handleRevertCase = async () => {
    try {
      setReverting(true);
      const response = await axios.put(
        `http://localhost:5000/api/records/${recordId}/revert`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.data.success) {
        setRecord(response.data.record);
        setShowRevertConfirm(false);
        if (onStopSuccess) {
          onStopSuccess();
        }
      }
    } catch (err) {
      setError('Failed to revert case: ' + (err.response?.data?.message || err.message));
      console.error('Error reverting case:', err);
    } finally {
      setReverting(false);
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

      <DialogActions sx={{ p: 2, background: '#f9fafb', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {record?.status !== 'stopped' && (
            <Button 
              onClick={() => setShowStopConfirm(true)}
              variant="contained"
              color="error"
              disabled={stopping}
              sx={{
                '&:hover': {
                  background: '#d32f2f'
                }
              }}
            >
              Stop Case
            </Button>
          )}
          {record?.status === 'stopped' && (
            <Button 
              onClick={() => setShowRevertConfirm(true)}
              variant="contained"
              color="success"
              disabled={reverting}
              sx={{
                '&:hover': {
                  background: '#388e3c'
                }
              }}
            >
              Revert to Pending
            </Button>
          )}
        </Box>
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

      {/* Stop Confirmation Dialog */}
      <Dialog 
        open={showStopConfirm}
        onClose={() => setShowStopConfirm(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Stop Case</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Are you sure you want to stop this case? This action cannot be undone.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Reason for stopping (optional)"
              value={stopReason}
              onChange={(e) => setStopReason(e.target.value)}
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowStopConfirm(false)}
            disabled={stopping}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleStopCase}
            variant="contained"
            color="error"
            disabled={stopping}
          >
            {stopping ? 'Stopping...' : 'Stop Case'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Revert Confirmation Dialog */}
      <Dialog 
        open={showRevertConfirm}
        onClose={() => setShowRevertConfirm(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Revert Case to Pending</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Are you sure you want to revert this stopped case back to Pending status? 
            </Typography>
            <Typography variant="body2" color="warning.main" sx={{ mb: 0 }}>
              ⚠️ Current vendor and field officer assignments will be cleared.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowRevertConfirm(false)}
            disabled={reverting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRevertCase}
            variant="contained"
            color="success"
            disabled={reverting}
          >
            {reverting ? 'Reverting...' : 'Revert to Pending'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default ViewDetailsModal;
