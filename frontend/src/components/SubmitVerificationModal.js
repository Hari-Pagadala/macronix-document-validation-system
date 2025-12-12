import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, Typography, TextField, MenuItem, Box } from '@mui/material';

const ownershipOptions = ['Owned', 'Rented', 'PG', 'Hostel'];

const SignaturePad = ({ onChange }) => {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
  }, []);
  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    return { x, y };
  };
  const start = (e) => { setDrawing(true); const { x, y } = getPos(e); const ctx = canvasRef.current.getContext('2d'); ctx.beginPath(); ctx.moveTo(x, y); };
  const move = (e) => { if (!drawing) return; const { x, y } = getPos(e); const ctx = canvasRef.current.getContext('2d'); ctx.lineTo(x, y); ctx.stroke(); };
  const end = () => { setDrawing(false); onChange(canvasRef.current.toDataURL('image/png')); };
  const clear = () => { const ctx = canvasRef.current.getContext('2d'); ctx.clearRect(0,0,canvasRef.current.width, canvasRef.current.height); onChange(null); };
  return (
    <Box>
      <canvas
        ref={canvasRef}
        width={300}
        height={120}
        style={{ border: '1px solid #ccc', touchAction: 'none' }}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <Button size="small" onClick={clear} sx={{ mt: 1 }}>Clear</Button>
    </Box>
  );
};

const SubmitVerificationModal = ({ open, onClose, record, onSubmitted }) => {
  const [form, setForm] = useState({
    respondentName: '',
    respondentRelationship: '',
    respondentContact: '',
    periodOfStay: '',
    ownershipType: '',
    verificationDate: '',
    comments: ''
  });
  const [gps, setGps] = useState({ lat: '', lng: '' });
  const [documents, setDocuments] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [officerSig, setOfficerSig] = useState(null);
  const [respondentSig, setRespondentSig] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [insufficientReason, setInsufficientReason] = useState('');

  useEffect(() => {
    if (open) {
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGeoError('');
        },
        () => {
          setGps({ lat: '', lng: '' });
          setGeoError('Location is required. Please enable GPS/location services and try again.');
        }
      );
    }
  }, [open]);

  const handleFile = (setter) => (e) => setter(Array.from(e.target.files || []));
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const displayCaseNumber = record?.caseNumber || record?.referenceNumber || 'N/A';
  const displayName = record?.fullName || [record?.firstName, record?.lastName].filter(Boolean).join(' ').trim() || 'N/A';
  const displayAddress = record?.address || [record?.addressLine1, record?.addressLine2, record?.city, record?.state, record?.pincode].filter(Boolean).join(', ').replace(/^,\s*/, '') || 'N/A';
  const displayContact = record?.contactNumber || record?.phone || 'N/A';

  const submitCommon = async (action) => {
    if (!gps.lat || !gps.lng) {
      alert('Location is required. Please enable GPS/location services.');
      return false;
    }
    if (!form.verificationDate || !form.ownershipType || !officerSig || !respondentSig) {
      alert('Please fill required fields and signatures');
      return false;
    }
    if (action === 'insufficient' && !insufficientReason.trim()) {
      alert('Please provide the insufficiency reason.');
      return false;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('fieldOfficerToken');
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => fd.append(k, v));
      fd.append('gpsLat', gps.lat);
      fd.append('gpsLng', gps.lng);
      fd.append('action', action);
      if (action === 'insufficient') {
        fd.append('comments', insufficientReason);
      }
      documents.forEach(f => fd.append('documents', f));
      photos.forEach(f => fd.append('photos', f));
      // Convert signatures dataURL to blobs
      const dataURLToBlob = (dataURL) => {
        const parts = dataURL.split(',');
        const mime = parts[0].match(/:(.*?);/)[1];
        const bstr = atob(parts[1]);
        let n = bstr.length; const u8arr = new Uint8Array(n);
        while (n--) { u8arr[n] = bstr.charCodeAt(n); }
        return new Blob([u8arr], { type: mime });
      };
      if (officerSig) fd.append('officerSignature', dataURLToBlob(officerSig), 'officer-sign.png');
      if (respondentSig) fd.append('respondentSignature', dataURLToBlob(respondentSig), 'respondent-sign.png');

      const resp = await fetch(`http://localhost:5000/api/fo-portal/cases/${record.id}/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        alert(data.message || 'Failed to submit verification');
        return false;
      }
      onSubmitted?.();
      return true;
    } catch (e) {
      alert('Error submitting verification');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => submitCommon('submitted');
  const handleInsufficient = () => submitCommon('insufficient');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Submit Verification Details</DialogTitle>
      <DialogContent dividers>
        {/* Read-only case info */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Case Information</Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}><TextField label="Case Number" value={displayCaseNumber} fullWidth disabled /></Grid>
            <Grid item xs={6}><TextField label="Full Name" value={displayName} fullWidth disabled /></Grid>
            <Grid item xs={12}><TextField label="Address" value={displayAddress} fullWidth disabled /></Grid>
            <Grid item xs={6}><TextField label="Contact Number" value={displayContact} fullWidth disabled /></Grid>
          </Grid>
        </Box>

        {/* Verification details */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Verification Details</Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}><TextField label="Respondent Name" name="respondentName" value={form.respondentName} onChange={handleChange} fullWidth /></Grid>
            <Grid item xs={6}><TextField label="Relationship with Candidate" name="respondentRelationship" value={form.respondentRelationship} onChange={handleChange} fullWidth /></Grid>
            <Grid item xs={6}><TextField label="Respondent Contact" name="respondentContact" value={form.respondentContact} onChange={handleChange} fullWidth /></Grid>
            <Grid item xs={6}><TextField label="Period of Stay" name="periodOfStay" value={form.periodOfStay} onChange={handleChange} fullWidth /></Grid>
            <Grid item xs={6}><TextField select label="Ownership Type" name="ownershipType" value={form.ownershipType} onChange={handleChange} fullWidth>
              {ownershipOptions.map(o => (<MenuItem key={o} value={o}>{o}</MenuItem>))}
            </TextField></Grid>
            <Grid item xs={6}><TextField type="date" label="Date of Verification" name="verificationDate" value={form.verificationDate} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
          </Grid>
        </Box>

        {/* Uploads */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Document Uploads</Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}><TextField type="file" inputProps={{ multiple: true }} onChange={handleFile(setDocuments)} fullWidth label="Documents (Proof of relationship)" /></Grid>
            <Grid item xs={12}><TextField type="file" inputProps={{ multiple: true }} onChange={handleFile(setPhotos)} fullWidth label="House Photographs" /></Grid>
          </Grid>
        </Box>

        {/* GPS */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Location Capture</Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}><TextField label="Latitude" value={gps.lat} fullWidth InputProps={{ readOnly: true }} /></Grid>
            <Grid item xs={6}><TextField label="Longitude" value={gps.lng} fullWidth InputProps={{ readOnly: true }} /></Grid>
          </Grid>
          {geoError && (
            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
              {geoError}
            </Typography>
          )}
        </Box>

        {/* Comments */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Verification Comments</Typography>
          <TextField multiline rows={3} fullWidth name="comments" value={form.comments} onChange={handleChange} />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Insufficient Reason (required if marking Insufficient)</Typography>
          <TextField multiline rows={2} fullWidth value={insufficientReason} onChange={(e) => setInsufficientReason(e.target.value)} />
        </Box>

        {/* Mandatory Note */}
        <Box sx={{ mb: 2, p: 2, bgcolor: '#fff3e0', border: '1px solid #ffe0b2' }}>
          <Typography variant="body2">
            Note: The cost of verification is paid by the employer. Please do not pay any cash or kind to the field executive as allowance.
          </Typography>
        </Box>

        {/* Signatures */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Signatures</Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <Typography variant="caption">Field Officer Signature</Typography>
              <SignaturePad onChange={setOfficerSig} />
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption">Respondent Signature</Typography>
              <SignaturePad onChange={setRespondentSig} />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="outlined" color="warning" onClick={handleInsufficient} disabled={submitting || !gps.lat || !gps.lng}>Mark as Insufficient</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting || !gps.lat || !gps.lng}>Submit</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubmitVerificationModal;
