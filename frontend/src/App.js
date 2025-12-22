import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ManualEntryPage from './pages/ManualEntryPage';
import VendorLogin from './pages/VendorLogin';
import VendorDashboard from './pages/VendorDashboard';
import FieldOfficerLogin from './pages/FieldOfficerLogin';
import FieldOfficerDashboard from './pages/FieldOfficerDashboard';
import CandidateSubmissionPage from './pages/CandidateSubmissionPage';

// Context
import { AuthProvider } from './context/AuthContext';
import ImageKitProvider from './context/ImageKitContext';
import PrivateRoute from './components/PrivateRoute';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ImageKitProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/vendor/login" element={<VendorLogin />} />
              <Route path="/field-officer/login" element={<FieldOfficerLogin />} />
              <Route path="/candidate/submit" element={<CandidateSubmissionPage />} />
              <Route 
                path="/dashboard/*" 
                element={
                  <PrivateRoute>
                    <Dashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/vendor/dashboard" 
              element={
                <PrivateRoute>
                  <VendorDashboard />
                </PrivateRoute>
              } 
            />
            <Route path="/field-officer/dashboard" element={<FieldOfficerDashboard />} />
            <Route 
              path="/manual-entry" 
              element={
                <PrivateRoute>
                  <ManualEntryPage />
                </PrivateRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Router>
        </AuthProvider>
      </ImageKitProvider>
    </ThemeProvider>
  );
}

export default App;