import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import axios from 'axios';

const steps = ['Customer Information', 'Address Details', 'Assignment'];

const ManualEntryPage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [vendors, setVendors] = useState([]);
  const [fieldOfficers, setFieldOfficers] = useState([]);
  
  const [formData, setFormData] = useState({
    // Step 1: Customer Information
    caseNumber: '',
    firstName: '',
    lastName: '',
    contactNumber: '',
    email: '',
    
    // Step 2: Address Details
    address: '',
    state: '',
    district: '',
    pincode: '',
    
    // Step 3: Assignment
    assignedVendor: '',
    assignedFieldOfficer: ''
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    if (formData.assignedVendor) {
      fetchFieldOfficers(formData.assignedVendor);
    } else {
      setFieldOfficers([]);
    }
  }, [formData.assignedVendor]);

  const fetchVendors = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/vendors/active');
      setVendors(response.data.vendors);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchFieldOfficers = async (vendorId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/field-officers/vendor/${vendorId}`);
      setFieldOfficers(response.data.fieldOfficers);
    } catch (error) {
      console.error('Error fetching field officers:', error);
      setFieldOfficers([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNext = () => {
    // Validate current step
    if (activeStep === 0) {
      if (!formData.caseNumber || !formData.firstName || !formData.lastName || !formData.contactNumber) {
        setError('Please fill all required fields in Customer Information');
        return;
      }
    } else if (activeStep === 1) {
      if (!formData.address || !formData.state || !formData.district || !formData.pincode) {
        setError('Please fill all required fields in Address Details');
        return;
      }
    }
    
    setError('');
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:5000/api/records/manual', formData);
      
      setSuccess(`Case created successfully! Reference Number: ${response.data.record.referenceNumber}`);
      
      // Reset form
      setFormData({
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
      
      setActiveStep(0);
      
    } catch (error) {
      setError(error.response?.data?.message || 'Error creating case');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Customer Information (All fields are required except email)
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Case Number *"
                name="caseNumber"
                value={formData.caseNumber}
                onChange={handleChange}
                required
                helperText="Unique identifier for this case"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Reference Number"
                value="Auto-generated"
                disabled
                helperText="Will be generated automatically"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name *"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name *"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Number *"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                required
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
              />
            </Grid>
          </Grid>
        );
      
      case 1:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Address Details (All fields are required)
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address *"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="State *"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="District *"
                name="district"
                value={formData.district}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Pincode *"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                required
              />
            </Grid>
          </Grid>
        );
      
      case 2:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Assignment (Optional - can be assigned later)
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Assign Vendor</InputLabel>
                <Select
                  name="assignedVendor"
                  value={formData.assignedVendor}
                  onChange={handleChange}
                  label="Assign Vendor"
                >
                  <MenuItem value="">
                    <em>Select Vendor (Optional)</em>
                  </MenuItem>
                  {vendors.map((vendor) => (
                    <MenuItem key={vendor._id} value={vendor._id}>
                      {vendor.company} ({vendor.name})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!formData.assignedVendor}>
                <InputLabel>Assign Field Officer</InputLabel>
                <Select
                  name="assignedFieldOfficer"
                  value={formData.assignedFieldOfficer}
                  onChange={handleChange}
                  label="Assign Field Officer"
                >
                  <MenuItem value="">
                    <em>Select Field Officer (Optional)</em>
                  </MenuItem>
                  {fieldOfficers.map((officer) => (
                    <MenuItem key={officer._id} value={officer._id}>
                      {officer.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );
      
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
          sx={{ mb: 2 }}
        >
          Back to Dashboard
        </Button>
        
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom align="center" color="primary">
            Manual Case Entry
          </Typography>
          <Typography variant="subtitle1" gutterBottom align="center" color="textSecondary">
            Add new case records manually
          </Typography>
          
          <Stepper activeStep={activeStep} sx={{ mt: 4, mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
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
          
          <form onSubmit={handleSubmit}>
            {renderStepContent(activeStep)}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
              >
                Back
              </Button>
              
              <Box>
                {activeStep === steps.length - 1 ? (
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Case'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                  >
                    Next
                  </Button>
                )}
              </Box>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default ManualEntryPage;