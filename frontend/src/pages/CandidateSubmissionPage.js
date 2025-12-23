import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import { uploadToImageKit } from '../utils/imagekitUpload';

const CandidateSubmissionPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRefs = useRef({});
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);

  const [tokenData, setTokenData] = useState(null);
  const [caseDetails, setCaseDetails] = useState(null);
  const [candidateInfo, setCandidateInfo] = useState(null);

  const [photos, setPhotos] = useState({
    candidateSelfie: null, // { url, latitude, longitude, timestamp }
    idProof: null,
    houseDoorPhoto: null
  });

  const [formData, setFormData] = useState({
    ownershipType: '',
    periodOfStay: ''
  });

  const [currentPhotoType, setCurrentPhotoType] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const ownershipTypes = ['owned', 'rented', 'family_owned', 'other'];

  const photoLabels = {
    candidateSelfie: 'Candidate Selfie',
    idProof: 'ID Proof',
    houseDoorPhoto: 'House Door Photo'
  };

  // Request permissions on mount
  useEffect(() => {
    if (!token) {
      setError('No token provided. Invalid access.');
      setValidating(false);
      setLoading(false);
      return;
    }

    requestPermissions();
    validateToken();
  }, [token]);

  const requestPermissions = async () => {
    // Request location permission
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationPermission(true);
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date().toISOString()
          });
          console.log('[Candidate] Location obtained:', position.coords);
        },
        (error) => {
          console.warn('[Candidate] Location permission denied:', error);
          setLocationPermission(false);
        }
      );
    }

    // Request camera permission (will be granted on first camera access)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission(true);
      console.log('[Candidate] Camera permission granted');
    } catch (err) {
      console.warn('[Candidate] Camera permission denied:', err);
      setCameraPermission(false);
    }
  };

  const validateToken = async () => {
    try {
      setValidating(true);
      const response = await axios.get(`${config}/candidate/validate/${token}`);

      if (response.data.success) {
        setTokenData(response.data);
        setCaseDetails(response.data.caseDetails);
        setCandidateInfo(response.data.candidateInfo);
      }
    } catch (err) {
      console.error('Token validation error:', err);
      setError(err.response?.data?.message || 'Invalid or expired token');
    } finally {
      setValidating(false);
      setLoading(false);
    }
  };

  const startCamera = async (photoType) => {
    try {
      setCurrentPhotoType(photoType);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: photoType === 'candidateSelfie' ? 'user' : 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraStream(stream);
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      setCameraActive(false);
      setCurrentPhotoType(null);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const context = canvasRef.current.getContext('2d');
      const video = videoRef.current;

      // Set canvas dimensions to match video
      canvasRef.current.width = video.videoWidth;
      canvasRef.current.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0);

      // Convert to blob
      canvasRef.current.toBlob(async (blob) => {
        const file = new File(
          [blob],
          `${currentPhotoType}-${Date.now()}.jpg`,
          { type: 'image/jpeg' }
        );

        // Get current location
        const photoData = {
          file,
          latitude: userLocation?.latitude,
          longitude: userLocation?.longitude,
          timestamp: new Date().toISOString()
        };

        // Upload to ImageKit
        try {
          const url = await uploadToImageKit(file, `candidate/${currentPhotoType}`);

          setPhotos(prev => ({
            ...prev,
            [currentPhotoType]: {
              url,
              latitude: photoData.latitude,
              longitude: photoData.longitude,
              timestamp: photoData.timestamp
            }
          }));

          console.log(`[Candidate] ${currentPhotoType} uploaded:`, {
            url,
            ...photoData
          });

          stopCamera();
        } catch (uploadErr) {
          console.error('Upload error:', uploadErr);
          setError('Failed to upload photo. Please try again.');
        }
      }, 'image/jpeg', 0.95);
    } catch (err) {
      console.error('Capture error:', err);
      setError('Failed to capture photo. Please try again.');
    }
  };

  const handleFileUpload = async (e, photoType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Get current location
      const photoData = {
        file,
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
        timestamp: new Date().toISOString()
      };

      // Upload to ImageKit
      const url = await uploadToImageKit(file, `candidate/${photoType}`);

      setPhotos(prev => ({
        ...prev,
        [photoType]: {
          url,
          latitude: photoData.latitude,
          longitude: photoData.longitude,
          timestamp: photoData.timestamp
        }
      }));

      console.log(`[Candidate] ${photoType} uploaded:`, {
        url,
        ...photoData
      });
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload photo. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Validate ownership type
      if (!formData.ownershipType) {
        throw new Error('Ownership type is required');
      }

      // Validate period of stay
      if (!formData.periodOfStay) {
        throw new Error('Period of stay is required');
      }

      // Validate all photos are captured
      if (!photos.candidateSelfie) {
        throw new Error('Candidate Selfie is required');
      }
      if (!photos.idProof) {
        throw new Error('ID Proof is required');
      }
      if (!photos.houseDoorPhoto) {
        throw new Error('House Door Photo is required');
      }

      console.log('[Candidate] Submitting verification with photos:', photos);

      const submitData = {
        candidateSelfieData: photos.candidateSelfie,
        idProofData: photos.idProof,
        houseDoorPhotoData: photos.houseDoorPhoto,
        gpsLat: userLocation?.latitude || 0,
        gpsLng: userLocation?.longitude || 0,
        ownershipType: formData.ownershipType,
        periodOfStay: formData.periodOfStay
      };

      const response = await axios.post(
        `${config}/candidate/submit/${token}`,
        submitData,
        {
          headers: {
            'Content-Type': 'application/json'
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
  const isExpiringSoon = expiryDate && (expiryDate - new Date()) < 3600000;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Photo Verification Submission
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Submit verification photos for case {caseDetails?.caseNumber}
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

        {!locationPermission && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Location permission not granted. Photos will be submitted without GPS coordinates. Please enable location services.
          </Alert>
        )}

        {!cameraPermission && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Camera permission not granted. You can upload photos from your device instead.
          </Alert>
        )}

        {/* Case Details */}
        <Card sx={{ mb: 4, bgcolor: 'grey.50' }}>
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

        {/* Ownership Details */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Ownership Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sx={{ minWidth: '200px' }}>
                <FormControl fullWidth required>
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
            </Grid>
          </CardContent>
        </Card>

        {/* Photo Upload Section */}
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Required Photos
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          {Object.keys(photoLabels).map((photoType) => (
            <Grid item xs={12} key={photoType}>
              <Card
                sx={{
                  p: 2,
                  border: photos[photoType] ? '2px solid #4caf50' : '2px dashed #ccc',
                  borderRadius: 1,
                  backgroundColor: photos[photoType] ? '#f1f5f0' : '#fafafa'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle1">
                      {photoLabels[photoType]} *
                    </Typography>
                    {photos[photoType] && (
                      <Typography variant="caption" color="success.main">
                        ✓ Uploaded - {new Date(photos[photoType].timestamp).toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {photos[photoType] ? (
                  <Box sx={{ mb: 2 }}>
                    <Box
                      component="img"
                      src={photos[photoType].url}
                      sx={{
                        width: '100%',
                        maxHeight: 300,
                        objectFit: 'cover',
                        borderRadius: 1,
                        mb: 2
                      }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Latitude:</strong> {photos[photoType].latitude?.toFixed(6) || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Longitude:</strong> {photos[photoType].longitude?.toFixed(6) || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Timestamp:</strong> {new Date(photos[photoType].timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                ) : null}

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {cameraPermission && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => startCamera(photoType)}
                      disabled={cameraActive}
                    >
                      📷 Take Photo
                    </Button>
                  )}

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => fileInputRefs.current[photoType]?.click()}
                  >
                    📁 Choose File
                  </Button>
                  <input
                    ref={(el) => { if (el) fileInputRefs.current[photoType] = el; }}
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, photoType)}
                  />
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Camera Dialog */}
        <Dialog
          open={cameraActive}
          onClose={stopCamera}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Capture {photoLabels[currentPhotoType]}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ position: 'relative', width: '100%' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  borderRadius: '4px',
                  marginBottom: '16px'
                }}
              />
              <canvas
                ref={canvasRef}
                style={{ display: 'none' }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={stopCamera} variant="outlined">
              Cancel
            </Button>
            <Button
              onClick={capturePhoto}
              variant="contained"
              color="primary"
            >
              Capture Photo
            </Button>
          </DialogActions>
        </Dialog>

        {/* Submit Button */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={submitting || !photos.candidateSelfie || !photos.idProof || !photos.houseDoorPhoto}
            onClick={handleSubmit}
            sx={{ minWidth: 250 }}
          >
            {submitting ? <CircularProgress size={24} /> : '✓ Submit Verification'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default CandidateSubmissionPage;
