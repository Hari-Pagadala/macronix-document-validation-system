import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Card,
  CardContent,
  Divider,
  Chip
} from '@mui/material';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import { uploadToImageKit, uploadMultipleToImageKit } from '../utils/imagekitUpload';

const CandidateSubmissionPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const signatureCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const [tokenData, setTokenData] = useState(null);
  const [caseDetails, setCaseDetails] = useState(null);
  const [candidateInfo, setCandidateInfo] = useState(null);

  const [formData, setFormData] = useState({
    address: '',
    pincode: '',
    city: '',
    state: '',
    ownershipType: '',
    ownerName: '',
    relationWithOwner: '',
    periodOfStay: '',
    gpsLat: '',
    gpsLng: '',
    verificationNotes: ''
  });

  const [files, setFiles] = useState({
    candidateSelfie: null,
    housePhoto: null,
    selfieWithHouse: null,
    candidateSignature: null,
    documents: []
  });

  const ownershipTypes = ['owned', 'rented', 'family_owned', 'other'];

  useEffect(() => {
    if (!token) {
      setError('No token provided. Invalid access.');
      setValidating(false);
      setLoading(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      setValidating(true);
      const response = await axios.get(`${config}/candidate/validate/${token}`);
      
      if (response.data.success) {
        setTokenData(response.data);
        setCaseDetails(response.data.caseDetails);
        setCandidateInfo(response.data.candidateInfo);
        
        // Auto-fill address details from case
        const caseData = response.data.caseDetails;
        if (caseData) {
          setFormData(prev => ({
            ...prev,
            address: caseData.address || '',
            city: caseData.city || '',
            state: caseData.state || '',
            pincode: caseData.pincode || ''
          }));
        }
        
        // Auto-fill candidate location if available
        getCurrentLocation();
      }
    } catch (err) {
      console.error('Token validation error:', err);
      setError(err.response?.data?.message || 'Invalid or expired token');
    } finally {
      setValidating(false);
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            gpsLat: position.coords.latitude.toFixed(6),
            gpsLng: position.coords.longitude.toFixed(6)
          }));
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    
    if (name === 'documents' || name === 'photos') {
      setFiles(prev => ({ ...prev, [name]: Array.from(selectedFiles) }));
    } else {
      setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));
    }
  };

  // Signature canvas handlers
  const startDrawing = (e) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left || e.touches?.[0]?.clientX - rect.left;
    const y = e.clientY - rect.top || e.touches?.[0]?.clientY - rect.top;
    
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left || e.touches?.[0]?.clientX - rect.left;
    const y = e.clientY - rect.top || e.touches?.[0]?.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setFiles(prev => ({ ...prev, candidateSignature: null }));
  };

  const saveSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas || !hasSignature) return;
    
    canvas.toBlob((blob) => {
      const file = new File([blob], 'signature.png', { type: 'image/png' });
      setFiles(prev => ({ ...prev, candidateSignature: file }));
    }, 'image/png');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Validate required fields
      if (!formData.address || !formData.pincode || !formData.city || !formData.state) {
        throw new Error('Please fill all address details');
      }

      if (!formData.ownershipType) {
        throw new Error('Please select ownership type');
      }

      if (!formData.verificationNotes) {
        throw new Error('Please provide verification notes');
      }

      if (!formData.gpsLat || !formData.gpsLng) {
        throw new Error('GPS location is required');
      }

      if (!files.candidateSelfie) {
        throw new Error('Candidate selfie is required');
      }

      if (!files.housePhoto) {
        throw new Error('House photo is required');
      }

      if (!files.selfieWithHouse) {
        throw new Error('Selfie with house is required');
      }

      if (!files.candidateSignature) {
        throw new Error('Candidate signature is required');
      }

      // Upload images to ImageKit
      console.log('[Candidate] Uploading images to ImageKit...');
      
      const [candidateSelfieUrl, housePhotoUrl, selfieWithHouseUrl, signatureUrl, documentUrls] = await Promise.all([
        uploadToImageKit(files.candidateSelfie, 'candidate/selfies'),
        uploadToImageKit(files.housePhoto, 'candidate/photos'),
        uploadToImageKit(files.selfieWithHouse, 'candidate/selfies'),
        uploadToImageKit(files.candidateSignature, 'candidate/signatures'),
        files.documents.length > 0 ? uploadMultipleToImageKit(files.documents, 'candidate/documents') : Promise.resolve([])
      ]);

      console.log('[Candidate] All images uploaded to ImageKit successfully');

      // Prepare form data with ImageKit URLs
      const submitData = new FormData();
      
      // Add text fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          submitData.append(key, formData[key]);
        }
      });

      // Add ImageKit URLs
      submitData.append('candidateSelfie', candidateSelfieUrl);
      submitData.append('housePhoto', housePhotoUrl);
      submitData.append('selfieWithHouse', selfieWithHouseUrl);
      submitData.append('candidateSignature', signatureUrl);
      if (documentUrls.length > 0) {
        submitData.append('documents', JSON.stringify(documentUrls));
      }

      const response = await axios.post(
        `${config}/candidate/submit/${token}`,
        submitData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setSuccess(true);
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to submit verification');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || validating) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Validating access...
        </Typography>
      </Container>
    );
  }

  if (error && !tokenData) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Alert severity="error">
          <Typography variant="h6">Access Denied</Typography>
          <Typography>{error}</Typography>
        </Alert>
      </Container>
    );
  }

  if (success) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" color="success.main" gutterBottom>
            ✓ Submission Successful!
          </Typography>
          <Typography variant="body1" paragraph>
            Your verification has been submitted successfully.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Case Number: <strong>{caseDetails?.caseNumber}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your submission will be reviewed by our team. You will be notified of the outcome.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => window.close()}
            sx={{ mt: 3 }}
          >
            Close Window
          </Button>
        </Paper>
      </Container>
    );
  }

  const expiryDate = tokenData?.expiresAt ? new Date(tokenData.expiresAt) : null;
  const isExpiringSoon = expiryDate && (expiryDate - new Date()) < 3600000; // < 1 hour

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Verification Submission
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Submit verification details for case {caseDetails?.caseNumber}
          </Typography>
        </Box>

        {expiryDate && (
          <Alert severity={isExpiringSoon ? "warning" : "info"} sx={{ mb: 3 }}>
            This link expires at: <strong>{expiryDate.toLocaleString()}</strong>
            {isExpiringSoon && ' - Please submit soon!'}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Case Details */}
        <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Case Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Case Number</Typography>
                <Typography variant="body1"><strong>{caseDetails?.caseNumber}</strong></Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Reference Number</Typography>
                <Typography variant="body1"><strong>{caseDetails?.referenceNumber}</strong></Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Candidate Name</Typography>
                <Typography variant="body1">{caseDetails?.fullName}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Mobile Number</Typography>
                <Typography variant="body1">{caseDetails?.mobileNumber}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Submission Form */}
        <form onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Address Details
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                disabled
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                required
                disabled
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="State"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                required
                disabled
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Pincode"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                required
                disabled
                inputProps={{ pattern: '[0-9]{6}', maxLength: 6 }}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="GPS Latitude"
                name="gpsLat"
                value={formData.gpsLat}
                onChange={handleInputChange}
                required
                type="number"
                inputProps={{ step: 'any' }}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="GPS Longitude"
                name="gpsLng"
                value={formData.gpsLng}
                onChange={handleInputChange}
                required
                type="number"
                inputProps={{ step: 'any' }}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Ownership Details
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth required sx={{ minWidth: 200 }}>
                <InputLabel>Ownership Type</InputLabel>
                <Select
                  name="ownershipType"
                  value={formData.ownershipType}
                  onChange={handleInputChange}
                  label="Ownership Type"
                >
                  {ownershipTypes.map(type => (
                    <MenuItem key={type} value={type}>
                      {type.replace('_', ' ').toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Period of Stay (e.g., 2 years, 6 months)"
                name="periodOfStay"
                value={formData.periodOfStay}
                onChange={handleInputChange}
                required
                placeholder="Enter the period of stay at this address"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Verification Notes"
                name="verificationNotes"
                value={formData.verificationNotes}
                onChange={handleInputChange}
                required
                multiline
                rows={3}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Upload Files
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                color={files.candidateSelfie ? 'success' : 'primary'}
              >
                Candidate Selfie * {files.candidateSelfie && '✓'}
                <input
                  type="file"
                  name="candidateSelfie"
                  hidden
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </Button>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                color={files.housePhoto ? 'success' : 'primary'}
              >
                Candidate House Photo * {files.housePhoto && '✓'}
                <input
                  type="file"
                  name="housePhoto"
                  hidden
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </Button>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                color={files.selfieWithHouse ? 'success' : 'primary'}
              >
                Candidate Selfie with House * {files.selfieWithHouse && '✓'}
                <input
                  type="file"
                  name="selfieWithHouse"
                  hidden
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                color={files.documents.length > 0 ? 'success' : 'secondary'}
              >
                Supporting Documents (if any) {files.documents.length > 0 && `(${files.documents.length})`}
                <input
                  type="file"
                  name="documents"
                  hidden
                  accept="image/*,application/pdf"
                  multiple
                  onChange={handleFileChange}
                />
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  border: files.candidateSignature ? '2px solid #4caf50' : '2px dashed #ccc',
                  borderRadius: 1 
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  Candidate Signature * {files.candidateSignature && '✓'}
                </Typography>
                <Box
                  sx={{
                    border: '1px solid #ddd',
                    borderRadius: 1,
                    mb: 2,
                    backgroundColor: '#fff',
                    touchAction: 'none'
                  }}
                >
                  <canvas
                    ref={signatureCanvasRef}
                    width={600}
                    height={200}
                    style={{ 
                      width: '100%', 
                      height: '200px',
                      cursor: 'crosshair',
                      display: 'block'
                    }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={clearSignature}
                    disabled={!hasSignature}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={saveSignature}
                    disabled={!hasSignature}
                    color="success"
                  >
                    Save Signature
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting}
              sx={{ minWidth: 200 }}
            >
              {submitting ? <CircularProgress size={24} /> : 'Submit Verification'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default CandidateSubmissionPage;
