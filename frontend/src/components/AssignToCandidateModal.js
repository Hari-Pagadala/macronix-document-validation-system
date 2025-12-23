import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  FormGroup
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import axios from 'axios';
import config from '../config';

const AssignToCandidateModal = ({ open, onClose, caseData, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submissionLink, setSubmissionLink] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [notificationStatus, setNotificationStatus] = useState(null);

  const [formData, setFormData] = useState({
    candidateName: '',
    candidateEmail: '',
    candidateMobile: '',
    expiryHours: 48,
    sendEmail: true,
    sendSMS: false
  });

  // Auto-populate candidate info from case data
  useEffect(() => {
    if (caseData && open) {
      setFormData({
        candidateName: caseData.fullName || `${caseData.firstName || ''} ${caseData.lastName || ''}`.trim() || '',
        candidateEmail: caseData.email || '',
        candidateMobile: caseData.contactNumber || '',
        expiryHours: 48,
        sendEmail: true,
        sendSMS: false
      });
      // Reset states
      setSubmissionLink('');
      setExpiresAt(null);
      setNotificationStatus(null);
      setError('');
    }
  }, [caseData, open]);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async () => {
    setError('');
    
    // Validation
    if (!formData.candidateName || !formData.candidateEmail || !formData.candidateMobile) {
      setError('Candidate information is missing from the case record. Please update the case details first.');
      return;
    }

    if (!formData.sendEmail && !formData.sendSMS) {
      setError('Please select at least one notification method (Email or SMS)');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.sendEmail && !emailRegex.test(formData.candidateEmail)) {
      setError('Invalid email format');
      return;
    }

    const mobileRegex = /^[0-9]{10}$/;
    if (formData.sendSMS && !mobileRegex.test(formData.candidateMobile)) {
      setError('Mobile number must be exactly 10 digits');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${config}/records/${caseData.id}/assign-to-candidate`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSubmissionLink(response.data.submissionLink);
        setExpiresAt(response.data.expiresAt);
        setNotificationStatus(response.data.notificationStatus);
        
        if (onSuccess) {
          onSuccess(response.data.record);
        }
      }
    } catch (err) {
      console.error('Assign to candidate error:', err);
      setError(err.response?.data?.message || 'Failed to assign case to candidate');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(submissionLink);
    alert('Link copied to clipboard!');
  };

  const handleClose = () => {
    setFormData({
      candidateName: '',
      candidateEmail: '',
      candidateMobile: '',
      expiryHours: 48
    });
    setSubmissionLink('');
    setExpiresAt(null);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Assign to Candidate
        <Typography variant="body2" color="text.secondary">
          Case: {caseData?.caseNumber}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {!submissionLink ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Alert severity="info" sx={{ mb: 1 }}>
              Review candidate information from case record
            </Alert>

            <TextField
              fullWidth
              label="Candidate Name"
              name="candidateName"
              value={formData.candidateName}
              InputProps={{
                readOnly: true,
              }}
              required
              disabled
            />

            <TextField
              fullWidth
              label="Candidate Email"
              name="candidateEmail"
              type="email"
              value={formData.candidateEmail}
              InputProps={{
                readOnly: true,
              }}
              required
              disabled
            />

            <TextField
              fullWidth
              label="Candidate Mobile"
              name="candidateMobile"
              value={formData.candidateMobile}
              InputProps={{
                readOnly: true,
              }}
              required
              disabled
              helperText="10 digits"
            />

            <TextField
              fullWidth
              label="Link Expiry (hours)"
              name="expiryHours"
              type="number"
              value={formData.expiryHours}
              onChange={handleChange}
              inputProps={{ min: 1, max: 168 }}
              helperText="Default: 48 hours (2 days)"
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Notification Channels
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.sendEmail}
                      onChange={handleChange}
                      name="sendEmail"
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">
                        Send Email
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Link will be sent to: {formData.candidateEmail || 'N/A'}
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.sendSMS}
                      onChange={handleChange}
                      name="sendSMS"
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">
                        Send SMS
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Link will be sent to: +91 {formData.candidateMobile || 'N/A'}
                      </Typography>
                    </Box>
                  }
                />
              </FormGroup>
              <Alert severity="warning" sx={{ mt: 1 }}>
                <Typography variant="caption">
                  At least one notification method must be selected. Email is recommended as primary channel.
                </Typography>
              </Alert>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Alert severity="success">
              Case assigned to candidate successfully!
            </Alert>

            <Typography variant="body2" color="text.secondary">
              <strong>Candidate:</strong> {formData.candidateName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Email:</strong> {formData.candidateEmail}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Mobile:</strong> {formData.candidateMobile}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Expires:</strong> {expiresAt ? new Date(expiresAt).toLocaleString() : 'N/A'}
            </Typography>

            {/* Notification Status */}
            {notificationStatus && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Notification Status:
                </Typography>
                {notificationStatus.email && (
                  <Alert 
                    severity={notificationStatus.email.sent ? "success" : "error"} 
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="caption">
                      <strong>Email:</strong> {notificationStatus.email.sent ? 
                        `✅ Sent successfully to ${notificationStatus.email.recipient}` : 
                        `❌ Failed: ${notificationStatus.email.error}`}
                    </Typography>
                  </Alert>
                )}
                {notificationStatus.sms && (
                  <Alert 
                    severity={notificationStatus.sms.sent ? "success" : "error"}
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="caption">
                      <strong>SMS:</strong> {notificationStatus.sms.sent ? 
                        `✅ Sent successfully to ${notificationStatus.sms.recipient}` : 
                        `❌ Failed: ${notificationStatus.sms.error}`}
                    </Typography>
                  </Alert>
                )}
              </Box>
            )}

            <TextField
              fullWidth
              label="Submission Link"
              value={submissionLink}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleCopyLink} edge="end">
                      <ContentCopyIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ mt: 2 }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {submissionLink ? 'Close' : 'Cancel'}
        </Button>
        {!submissionLink && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Send Link'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AssignToCandidateModal;
