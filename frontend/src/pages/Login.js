import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f5f5f5'
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" align="center" gutterBottom color="primary">
            Document Validation System
          </Typography>
          <Typography variant="subtitle1" align="center" color="textSecondary" gutterBottom>
            Super Admin Login
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} autoComplete="off">
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              disabled={loading}
              name="email"
              autoComplete="off"
            />
            <PasswordField
              label="Password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="off"
              email={email}
              showValidation={false}
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Login'}
            </Button>
          </form>

          <Typography variant="body2" align="center" sx={{ mt: 3, color: 'text.secondary' }}>
            {/* Credentials removed for security */}
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;