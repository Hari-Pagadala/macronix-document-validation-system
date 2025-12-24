import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import PasswordField from '../components/PasswordField';
import { Business as BusinessIcon } from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const VendorLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/vendor-portal/login', formData);
      
      if (response.data.success) {
        // Store vendor token and user data in localStorage
        localStorage.setItem('vendorToken', response.data.token);
        localStorage.setItem('vendorUser', JSON.stringify(response.data.user));
        
        // Set authorization header for vendor requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        navigate('/vendor/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <BusinessIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Vendor Portal
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to manage your cases
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
            autoComplete="email"
          />
          
          <Box sx={{ mb: 3 }}>
            <PasswordField
              label="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              autoComplete="current-password"
              email={formData.email}
              showValidation={false}
            />
          </Box>

          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default VendorLogin;
