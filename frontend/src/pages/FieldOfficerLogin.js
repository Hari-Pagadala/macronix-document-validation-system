import React, { useState } from 'react';
import { Container, Box, Paper, Typography, TextField, Button, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const FieldOfficerLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    setError('');
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return;
    }
    try {
      setLoading(true);
      const resp = await fetch('http://localhost:5000/api/fo-portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        setError(data.message || 'Login failed');
        return;
      }
      localStorage.setItem('fieldOfficerToken', data.token);
      localStorage.setItem('fieldOfficerUser', JSON.stringify(data.user));
      navigate('/field-officer/dashboard');
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Field Officer Login</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Email" name="email" value={formData.email} onChange={handleChange} fullWidth />
          <TextField label="Password" name="password" type="password" value={formData.password} onChange={handleChange} fullWidth />
          {error && (
            <Typography color="error" variant="body2">{error}</Typography>
          )}
          <Button variant="contained" onClick={handleLogin} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Login'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default FieldOfficerLogin;
