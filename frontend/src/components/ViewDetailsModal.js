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
  TextField,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RestartAlt as ResetIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import axios from 'axios';
// ImageKit images displayed as regular img tags with URL transformations
import { useAuth } from '../context/AuthContext';
import { UPLOADS_BASE_URL } from '../config';

// Helper to detect if URL is ImageKit URL or local file path
const isImageKitUrl = (url) => {
  return typeof url === 'string' && url.includes('ik.imagekit.io');
};

const ViewDetailsModal = ({ open, onClose, recordId, onStopSuccess }) => {
  const { token } = useAuth();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [error, setError] = useState('');
  const [verification, setVerification] = useState(null);
  const [stopReason, setStopReason] = useState('');
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reinitiating, setReinitiating] = useState(false);
  const [sendingBack, setSendingBack] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [showReinitiateConfirm, setShowReinitiateConfirm] = useState(false);
  const [showSendBackConfirm, setShowSendBackConfirm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [candidateLink, setCandidateLink] = useState(null);
  // Image preview (lightbox)
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const panStartRef = React.useRef({ x: 0, y: 0 });
  const offsetStartRef = React.useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (open && recordId) {
      fetchRecordDetails();
      fetchVerification();
      fetchCandidateLink();
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

  const fetchVerification = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/records/${recordId}/verification`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('[ViewDetails] Verification data:', response.data.verification);
      console.log('[ViewDetails] Photos:', response.data.verification?.photos);
      console.log('[ViewDetails] Documents:', response.data.verification?.documents);
      setVerification(response.data.verification);
    } catch (err) {
      // 404 means no verification yet; ignore
      setVerification(null);
    }
  };

  const fetchCandidateLink = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/records/${recordId}/candidate-link`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success && response.data.link) {
        setCandidateLink(response.data.link);
      }
    } catch (err) {
      // No link available
      setCandidateLink(null);
    }
  };

  const openPreview = (src, title = 'Preview') => {
    setPreviewSrc(src);
    setPreviewTitle(title);
    setPreviewOpen(true);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewSrc('');
    setPreviewTitle('');
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((z) => Math.min(4, Math.max(1, +(z + delta).toFixed(2))));
  };

  const startPan = (clientX, clientY) => {
    if (zoom === 1) return;
    setPanning(true);
    panStartRef.current = { x: clientX, y: clientY };
    offsetStartRef.current = { ...offset };
  };
  const movePan = (clientX, clientY) => {
    if (!panning) return;
    const dx = clientX - panStartRef.current.x;
    const dy = clientY - panStartRef.current.y;
    setOffset({ x: offsetStartRef.current.x + dx, y: offsetStartRef.current.y + dy });
  };
  const endPan = () => setPanning(false);
  const resetZoom = () => { setZoom(1); setOffset({ x: 0, y: 0 }); };
  const zoomIn = () => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)));
  const toggleZoom = () => { setZoom((z) => (z === 1 ? 2 : 1)); setOffset({ x: 0, y: 0 }); };

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

  const handleApproveCase = async () => {
    try {
      setApproving(true);
      const response = await axios.put(
        `http://localhost:5000/api/records/${recordId}/approve`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.data.success) {
        setRecord(response.data.record);
        setShowApproveConfirm(false);
        if (onStopSuccess) {
          onStopSuccess();
        }
      }
    } catch (err) {
      setError('Failed to approve case: ' + (err.response?.data?.message || err.message));
      console.error('Error approving case:', err);
    } finally {
      setApproving(false);
    }
  };

  const handleRejectCase = async () => {
    if (!rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }
    try {
      setRejecting(true);
      const response = await axios.put(
        `http://localhost:5000/api/records/${recordId}/reject`,
        { reason: rejectionReason },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.data.success) {
        setRecord(response.data.record);
        setShowRejectConfirm(false);
        setRejectionReason('');
        if (onStopSuccess) {
          onStopSuccess();
        }
      }
    } catch (err) {
      setError('Failed to reject case: ' + (err.response?.data?.message || err.message));
      console.error('Error rejecting case:', err);
    } finally {
      setRejecting(false);
    }
  };

  const handleReinitiateCase = async () => {
    try {
      setReinitiating(true);
      const response = await axios.put(
        `http://localhost:5000/api/records/${recordId}/reinitiate`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.data.success) {
        setRecord(response.data.record);
        setShowReinitiateConfirm(false);
        if (onStopSuccess) {
          onStopSuccess();
        }
      }
    } catch (err) {
      setError('Failed to re-initiate case: ' + (err.response?.data?.message || err.message));
      console.error('Error re-initiating case:', err);
    } finally {
      setReinitiating(false);
    }
  };

  const handleSendBackToFO = async () => {
    try {
      setSendingBack(true);
      const response = await axios.put(
        `http://localhost:5000/api/records/${recordId}/send-back`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.data.success) {
        setRecord(response.data.record);
        setShowSendBackConfirm(false);
        if (onStopSuccess) {
          onStopSuccess();
        }
      }
    } catch (err) {
      setError('Failed to send case back: ' + (err.response?.data?.message || err.message));
      console.error('Error sending case back:', err);
    } finally {
      setSendingBack(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      setError('');
      
      const response = await axios.get(
        `http://localhost:5000/api/download/case/${recordId}/pdf`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Case_${record?.caseNumber || recordId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      setError('Failed to download PDF: ' + (err.response?.data?.message || err.message));
      console.error('Error downloading PDF:', err);
    } finally {
      setDownloading(false);
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
    <>
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
              {record.status === 'rejected' && record.remarks && (
                <DetailRow label="Rejection Reason" value={record.remarks} />
              )}
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
              {record.completionDate && (
                <DetailRow label="Case Completed Date" value={formatDate(record.completionDate)} />
              )}
            </Paper>

            {/* Candidate Submission Link */}
            {candidateLink && record.status === 'candidate_assigned' && (
              <Paper sx={{ p: 2, mb: 3, background: '#fff3cd', border: '1px solid #ffc107' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#856404' }}>
                  🔗 Candidate Submission Link
                </Typography>
                <Box sx={{ p: 2, background: '#fff', borderRadius: 1, mb: 2 }}>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
                    {candidateLink}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    navigator.clipboard.writeText(candidateLink);
                    alert('Link copied to clipboard!');
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  Copy Link
                </Button>
              </Paper>
            )}

            {/* Verification Details */}
            {verification && (
              <Paper sx={{ p: 2, mb: 3, background: '#fff' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#667eea' }}>
                  ✅ Verification Submission
                </Typography>
                
                {/* Check if candidate submission (fieldOfficerId is null) */}
                {!verification.fieldOfficerId ? (
                  /* Candidate Submission Fields */
                  <>
                    <DetailRow label="Submitted By" value={verification.verifiedBy || `${record?.firstName || ''} ${record?.lastName || ''}`.trim() || 'Self'} />
                    <DetailRow label="Ownership Type" value={verification.ownershipType} />
                    {verification.ownerName && <DetailRow label="Owner Name" value={verification.ownerName} />}
                    {verification.relationWithOwner && <DetailRow label="Relation with Owner" value={verification.relationWithOwner} />}
                    <DetailRow label="Period of Stay" value={verification.periodOfStay} />
                    <DetailRow label="GPS" value={`${verification.gpsLat}, ${verification.gpsLng}`} />
                    <DetailRow label="Verification Notes" value={verification.verificationNotes} />
                  </>
                ) : (
                  /* Field Officer Submission Fields */
                  <>
                    <DetailRow label="Respondent Name" value={verification.respondentName} />
                    <DetailRow label="Relationship" value={verification.respondentRelationship} />
                    <DetailRow label="Respondent Contact" value={verification.respondentContact} />
                    <DetailRow label="Period of Stay" value={verification.periodOfStay} />
                    <DetailRow label="Ownership Type" value={verification.ownershipType} />
                    <DetailRow label="Verification Date" value={formatDate(verification.verificationDate)} />
                    <DetailRow label="Comments" value={verification.comments} />
                    <DetailRow label="GPS" value={`${verification.gpsLat}, ${verification.gpsLng}`} />
                  </>
                )}
                
                {/* Images Section - Different layout for candidate vs FO submissions */}
                {!verification.fieldOfficerId ? (
                  /* Candidate Submission Images */
                  <>
                    <Box sx={{ py: 1.5, borderBottom: '1px solid #eee' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#666', mb: 1 }}>
                        Candidate Selfie
                      </Typography>
                      {verification.candidateWithRespondentPath ? (
                        (() => {
                          const displayUrl = isImageKitUrl(verification.candidateWithRespondentPath) ? verification.candidateWithRespondentPath : `${UPLOADS_BASE_URL}/${verification.candidateWithRespondentPath}`;
                          return (
                            <Box sx={{ width: '100%', maxWidth: 300 }}>
                              <Box component="img" src={displayUrl} alt="Candidate Selfie" sx={{ width: '100%', height: 180, objectFit: 'cover', border: '1px solid #eee', mt: 1, cursor: 'pointer', borderRadius: 1 }} onClick={() => openPreview(displayUrl, 'Candidate Selfie')} />
                            </Box>
                          );
                        })()
                      ) : (
                        <Typography variant="body2" color="text.secondary">Not provided</Typography>
                      )}
                    </Box>
                    <Box sx={{ py: 1.5, borderBottom: '1px solid #eee' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#666', mb: 1 }}>
                        Candidate House Photo
                      </Typography>
                      {(verification.photos || []).length > 0 ? (
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 1.5 }}>
                          {(verification.photos || []).map((file, index) => {
                            const displayUrl = isImageKitUrl(file) ? file : `${UPLOADS_BASE_URL}/${file}`;
                            return (
                              <Box key={index} sx={{ border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
                                <Box component="img" src={displayUrl} alt="House Photo" sx={{ width: '100%', height: '150px', objectFit: 'cover', cursor: 'pointer' }} onClick={() => openPreview(displayUrl, 'House Photo')} />
                              </Box>
                            );
                          })}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">Not provided</Typography>
                      )}
                    </Box>
                    <Box sx={{ py: 1.5, borderBottom: '1px solid #eee' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#666', mb: 1 }}>
                        Candidate Selfie with House
                      </Typography>
                      {verification.selfieWithHousePath ? (
                        (() => {
                          const displayUrl = isImageKitUrl(verification.selfieWithHousePath) ? verification.selfieWithHousePath : `${UPLOADS_BASE_URL}/${verification.selfieWithHousePath}`;
                          return (
                            <Box sx={{ width: '100%', maxWidth: 300 }}>
                              <Box component="img" src={displayUrl} alt="Selfie with House" sx={{ width: '100%', height: 180, objectFit: 'cover', border: '1px solid #eee', mt: 1, cursor: 'pointer', borderRadius: 1 }} onClick={() => openPreview(displayUrl, 'Selfie with House')} />
                            </Box>
                          );
                        })()
                      ) : (
                        <Typography variant="body2" color="text.secondary">Not provided</Typography>
                      )}
                    </Box>
                    {(verification.documents || []).length > 0 && (
                      <Box sx={{ py: 1.5, borderBottom: '1px solid #eee' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#666', mb: 1 }}>
                          Additional Documents
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 1.5 }}>
                          {(verification.documents || []).map((file, index) => {
                            const displayUrl = isImageKitUrl(file) ? file : `${UPLOADS_BASE_URL}/${file}`;
                            return (
                              <Box key={index} sx={{ border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
                                <Box component="img" src={displayUrl} alt={`Document ${index + 1}`} sx={{ width: '100%', height: '150px', objectFit: 'cover', cursor: 'pointer' }} onClick={() => openPreview(displayUrl, `Document ${index + 1}`)} />
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    )}
                  </>
                ) : (
                  /* Field Officer Submission Images */
                  <>
                    <Box sx={{ py: 1.5, borderBottom: '1px solid #eee' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#666', mb: 1 }}>
                        Documents
                      </Typography>
                      {(verification.documents || []).length === 0 ? (
                        <Typography variant="body2" color="text.secondary">None</Typography>
                      ) : (
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 1.5 }}>
                          {(verification.documents || []).map((file, index) => {
                            const displayUrl = isImageKitUrl(file) ? file : `${UPLOADS_BASE_URL}/${file}`;
                            return (
                              <Box key={index} sx={{ border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
                                <Box component="img" src={displayUrl} alt={`Document ${index + 1}`} sx={{ width: '100%', height: '150px', objectFit: 'cover', cursor: 'pointer' }} onClick={() => openPreview(displayUrl, `Document ${index + 1}`)} />
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ py: 1.5, borderBottom: '1px solid #eee' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#666', mb: 1 }}>
                        Photos
                      </Typography>
                      {(verification.photos || []).length === 0 ? (
                        <Typography variant="body2" color="text.secondary">None</Typography>
                      ) : (
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 1.5 }}>
                          {(verification.photos || []).map((file, index) => {
                            const displayUrl = isImageKitUrl(file) ? file : `${UPLOADS_BASE_URL}/${file}`;
                            return (
                              <Box key={index} sx={{ border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
                                <Box component="img" src={displayUrl} alt={`Photo ${index + 1}`} sx={{ width: '100%', height: '150px', objectFit: 'cover', cursor: 'pointer' }} onClick={() => openPreview(displayUrl, `Photo ${index + 1}`)} />
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ py: 1.5, borderBottom: '1px solid #eee' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#666', mb: 1 }}>
                        Selfie Photo with House
                      </Typography>
                      {verification.selfieWithHousePath ? (
                        (() => {
                          const displayUrl = isImageKitUrl(verification.selfieWithHousePath) ? verification.selfieWithHousePath : `${UPLOADS_BASE_URL}/${verification.selfieWithHousePath}`;
                          return (
                            <Box sx={{ width: '100%', maxWidth: 300 }}>
                              <Box component="img" src={displayUrl} alt="Selfie with House" sx={{ width: '100%', height: 180, objectFit: 'cover', border: '1px solid #eee', mt: 1, cursor: 'pointer', borderRadius: 1 }} onClick={() => openPreview(displayUrl, 'Selfie with House')} />
                            </Box>
                          );
                        })()
                      ) : (
                        <Typography variant="body2" color="text.secondary">Not provided</Typography>
                      )}
                    </Box>
                    <Box sx={{ py: 1.5, borderBottom: '1px solid #eee' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#666', mb: 1 }}>
                        Candidate with Respondent Photo
                      </Typography>
                      {verification.candidateWithRespondentPath ? (
                        (() => {
                          const displayUrl = isImageKitUrl(verification.candidateWithRespondentPath) ? verification.candidateWithRespondentPath : `${UPLOADS_BASE_URL}/${verification.candidateWithRespondentPath}`;
                          return (
                            <Box sx={{ width: '100%', maxWidth: 300 }}>
                              <Box component="img" src={displayUrl} alt="Candidate with Respondent" sx={{ width: '100%', height: 180, objectFit: 'cover', border: '1px solid #eee', mt: 1, cursor: 'pointer', borderRadius: 1 }} onClick={() => openPreview(displayUrl, 'Candidate with Respondent')} />
                            </Box>
                          );
                        })()
                      ) : (
                        <Typography variant="body2" color="text.secondary">Not provided</Typography>
                      )}
                    </Box>
                  </>
                )}
                
                <Box sx={{ py: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#666', mb: 1 }}>
                    Signatures
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={!verification.fieldOfficerId ? 12 : 6}>
                      <Typography variant="caption" color="text.secondary">
                        {!verification.fieldOfficerId ? 'Candidate' : 'Field Officer'}
                      </Typography>
                      {verification.officerSignaturePath ? (
                        (() => {
                          const displayUrl = isImageKitUrl(verification.officerSignaturePath) ? verification.officerSignaturePath : `${UPLOADS_BASE_URL}/${verification.officerSignaturePath}`;
                          return (
                            <Box sx={{ width: '100%', maxWidth: 300 }}>
                              <Box component="img" src={displayUrl} alt={!verification.fieldOfficerId ? 'Candidate Signature' : 'Officer Signature'} sx={{ width: '100%', height: 160, objectFit: 'contain', border: '1px solid #eee', mt: 1, cursor: 'pointer', borderRadius: 1, backgroundColor: '#fafafa' }} onClick={() => openPreview(displayUrl, !verification.fieldOfficerId ? 'Candidate Signature' : 'Officer Signature')} />
                            </Box>
                          );
                        })()
                      ) : (
                        <Typography variant="body2" color="text.secondary">None</Typography>
                      )}
                    </Grid>
                    {verification.fieldOfficerId && (
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Respondent</Typography>
                        {verification.respondentSignaturePath ? (
                          (() => {
                            const displayUrl = isImageKitUrl(verification.respondentSignaturePath) ? verification.respondentSignaturePath : `${UPLOADS_BASE_URL}/${verification.respondentSignaturePath}`;
                            return (
                              <Box sx={{ width: '100%', maxWidth: 300 }}>
                                <Box component="img" src={displayUrl} alt="Respondent Signature" sx={{ width: '100%', height: 160, objectFit: 'contain', border: '1px solid #eee', mt: 1, cursor: 'pointer', borderRadius: 1, backgroundColor: '#fafafa' }} onClick={() => openPreview(displayUrl, 'Respondent Signature')} />
                              </Box>
                            );
                          })()
                        ) : (
                          <Typography variant="body2" color="text.secondary">None</Typography>
                        )}
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </Paper>
            )}

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
          {record?.status === 'approved' && (
            <Button 
              onClick={handleDownloadPDF}
              variant="contained"
              color="primary"
              disabled={downloading}
              startIcon={<DownloadIcon />}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #6a3f99 100%)'
                }
              }}
            >
              {downloading ? 'Downloading...' : 'Download Case PDF'}
            </Button>
          )}
          {record?.status === 'submitted' && (
            <>
              <Button 
                onClick={() => setShowApproveConfirm(true)}
                variant="contained"
                color="success"
                disabled={approving || rejecting}
                sx={{
                  '&:hover': {
                    background: '#388e3c'
                  }
                }}
              >
                Approve
              </Button>
              <Button 
                onClick={() => setShowRejectConfirm(true)}
                variant="contained"
                color="error"
                disabled={approving || rejecting}
                sx={{
                  '&:hover': {
                    background: '#d32f2f'
                  }
                }}
              >
                Reject
              </Button>
            </>
          )}
          {record?.status === 'insufficient' && (
            <Button 
              onClick={() => setShowSendBackConfirm(true)}
              variant="contained"
              color="primary"
              disabled={sendingBack}
              sx={{
                '&:hover': {
                  background: '#1565c0'
                }
              }}
            >
              Send Back to Field Officer
            </Button>
          )}
          {record?.status === 'rejected' && (
            <Button 
              onClick={() => setShowReinitiateConfirm(true)}
              variant="contained"
              color="primary"
              disabled={reinitiating}
              sx={{
                '&:hover': {
                  background: '#1565c0'
                }
              }}
            >
              Re-initiate Case
            </Button>
          )}
          {record?.status !== 'stopped' && record?.status !== 'submitted' && record?.status !== 'rejected' && record?.status !== 'insufficient' && (
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

      {/* Approve Confirmation Dialog */}
      <Dialog 
        open={showApproveConfirm}
        onClose={() => setShowApproveConfirm(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Approve Case</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Are you sure you want to approve this case?
            </Typography>
            <Typography variant="body2" color="success.main">
              ✓ Case will move to Approved tab
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ✓ No further action required from Field Officer
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowApproveConfirm(false)}
            disabled={approving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleApproveCase}
            variant="contained"
            color="success"
            disabled={approving}
          >
            {approving ? 'Approving...' : 'Approve Case'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog 
        open={showRejectConfirm}
        onClose={() => {
          setShowRejectConfirm(false);
          setRejectionReason('');
          setError('');
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Reject Case</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Please provide a reason for rejecting this case:
            </Typography>
            <TextField
              fullWidth
              required
              multiline
              rows={4}
              label="Rejection Reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              variant="outlined"
              error={error.includes('Rejection reason')}
              helperText={error.includes('Rejection reason') ? error : 'This reason will be shown to the Field Officer'}
            />
            <Typography variant="body2" color="warning.main" sx={{ mt: 2 }}>
              ⚠️ Field Officer must re-verify and resubmit after correction
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setShowRejectConfirm(false);
              setRejectionReason('');
              setError('');
            }}
            disabled={rejecting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRejectCase}
            variant="contained"
            color="error"
            disabled={rejecting || !rejectionReason.trim()}
          >
            {rejecting ? 'Rejecting...' : 'Reject Case'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Re-initiate Confirmation Dialog */}
      <Dialog 
        open={showReinitiateConfirm}
        onClose={() => setShowReinitiateConfirm(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Re-initiate Rejected Case</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Are you sure you want to re-initiate this rejected case?
            </Typography>
            <Typography variant="body2" color="primary.main" sx={{ mb: 1 }}>
              ✓ Case will move back to Pending status
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              ✓ All assignments will be cleared
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ✓ You can assign it to another vendor for reprocessing
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowReinitiateConfirm(false)}
            disabled={reinitiating}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleReinitiateCase}
            variant="contained"
            color="primary"
            disabled={reinitiating}
          >
            {reinitiating ? 'Re-initiating...' : 'Re-initiate Case'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Back to Field Officer Confirmation Dialog */}
      <Dialog 
        open={showSendBackConfirm}
        onClose={() => setShowSendBackConfirm(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Send Back to Field Officer</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Are you sure you want to send this insufficient case back to the Field Officer?
            </Typography>
            <Typography variant="body2" color="primary.main" sx={{ mb: 1 }}>
              ✓ Case will return to Assigned status
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              ✓ Same Field Officer will receive it for re-verification
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ✓ TAT due date will remain unchanged
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowSendBackConfirm(false)}
            disabled={sendingBack}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSendBackToFO}
            variant="contained"
            color="primary"
            disabled={sendingBack}
          >
            {sendingBack ? 'Sending...' : 'Send Back to FO'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>

    {/* Image Lightbox */}
    <Dialog open={previewOpen} onClose={closePreview} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1">{previewTitle}</Typography>
        <Button onClick={closePreview}>
          <CloseIcon />
        </Button>
      </DialogTitle>
      <DialogContent sx={{ position: 'relative', p: 0, backgroundColor: '#000' }}>
        {/* Controls */}
        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2, display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={zoomOut} sx={{ bgcolor: 'rgba(255,255,255,0.85)' }} title="Zoom out">
            <ZoomOutIcon />
          </IconButton>
          <IconButton size="small" onClick={resetZoom} sx={{ bgcolor: 'rgba(255,255,255,0.85)' }} title="Reset">
            <ResetIcon />
          </IconButton>
          <IconButton size="small" onClick={zoomIn} sx={{ bgcolor: 'rgba(255,255,255,0.85)' }} title="Zoom in">
            <ZoomInIcon />
          </IconButton>
        </Box>

        {/* Zoom/Pan stage */}
        <Box
          sx={{
            width: '100%',
            height: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            touchAction: 'none',
            cursor: panning && zoom > 1 ? 'grabbing' : zoom > 1 ? 'grab' : 'default'
          }}
          onWheel={handleWheel}
          onDoubleClick={toggleZoom}
          onMouseDown={(e) => startPan(e.clientX, e.clientY)}
          onMouseMove={(e) => movePan(e.clientX, e.clientY)}
          onMouseUp={endPan}
          onMouseLeave={endPan}
          onTouchStart={(e) => {
            if (e.touches.length === 1) {
              const t = e.touches[0];
              startPan(t.clientX, t.clientY);
            }
          }}
          onTouchMove={(e) => {
            if (e.touches.length === 1) {
              const t = e.touches[0];
              movePan(t.clientX, t.clientY);
            }
          }}
          onTouchEnd={endPan}
        >
          {previewSrc ? (
            <Box
              component="img"
              src={previewSrc}
              alt={previewTitle}
              sx={{
                maxWidth: zoom === 1 ? '100%' : 'none',
                maxHeight: zoom === 1 ? '100%' : 'none',
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                transition: panning ? 'none' : 'transform 0.08s ease-out',
                willChange: 'transform'
              }}
              draggable={false}
            />
          ) : (
            <Box sx={{ p: 4 }}>
              <Typography color="text.secondary">No image</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default ViewDetailsModal;
