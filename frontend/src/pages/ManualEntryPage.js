import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    TextField,
    Paper,
    Typography,
    Alert,
    Grid,
    AppBar,
    Toolbar,
    IconButton,
    Menu,
    MenuItem,
    Container
} from '@mui/material';
import {
    Menu as MenuIcon,
    Logout as LogoutIcon,
    Person as PersonIcon,
    Home as HomeIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ManualEntryPage = () => {
    const { user, logout, token } = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const [formData, setFormData] = useState({
        caseNumber: '',
        firstName: '',
        lastName: '',
        contactNumber: '',
        email: '',
        address: '',
        state: '',
        district: '',
        pincode: '',
        remarks: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [generatedRef, setGeneratedRef] = useState('');
    const [contactNumberError, setContactNumberError] = useState('');
    const [pincodeError, setPincodeError] = useState('');

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let newValue = value;
        let contactError = '';
        let pincodeError = '';

        if (name === 'contactNumber') {
            // Remove non-numeric characters
            newValue = value.replace(/[^0-9]/g, '');
            // Validate exactly 10 digits
            if (newValue.length > 0 && newValue.length !== 10) {
                contactError = 'Contact number must be exactly 10 digits';
            }
        } else if (name === 'pincode') {
            // Remove non-numeric characters
            newValue = value.replace(/[^0-9]/g, '');
        }

        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));
        
        if (name === 'contactNumber') {
            setContactNumberError(contactError);
        } else if (name === 'pincode') {
            setPincodeError(pincodeError);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        // Validate Contact Number
        if (!formData.contactNumber || formData.contactNumber.length !== 10) {
            setContactNumberError('Contact number must be exactly 10 digits');
            setError('Please fix validation errors before submitting');
            setLoading(false);
            return;
        }

        // Validate PIN Code (must be numeric)
        if (formData.pincode && !/^\d+$/.test(formData.pincode)) {
            setPincodeError('PIN code must contain only numeric characters');
            setError('Please fix validation errors before submitting');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:5000/api/records/manual',
                formData
            );

            setMessage('Record created successfully!');
            setGeneratedRef(response.data?.record?.referenceNumber || '');
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
                remarks: ''
            });
            setContactNumberError('');
            setPincodeError('');

            // Auto-clear message after 3 seconds
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Error creating record');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {/* App Bar */}
            <AppBar
                position="fixed"
                sx={{
                    width: '100%',
                    transition: 'all 0.3s ease',
                    zIndex: 1300
                }}
            >
                <Toolbar>
                    <HomeIcon sx={{ mr: 2 }} />
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        Manual Entry
                    </Typography>
                    <Button
                        variant="outlined"
                        color="inherit"
                        onClick={() => navigate('/dashboard')}
                        sx={{ mr: 2 }}
                    >
                        Back to Dashboard
                    </Button>
                    <IconButton
                        color="inherit"
                        onClick={handleMenuOpen}
                    >
                        <PersonIcon />
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                    >
                        <MenuItem disabled>
                            <Typography variant="body2">
                                {user?.email}
                            </Typography>
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>
                            <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
                            Logout
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            {/* Main Content */}
            <Box
                sx={{
                    flexGrow: 1,
                    p: 3,
                    mt: '64px',
                    width: '100%'
                }}
            >
                <Container maxWidth="md">
                    <Typography variant="h4" sx={{ mb: 3 }}>Manual Record Entry</Typography>

                    {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {generatedRef && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Macronix Reference: {generatedRef}
                        </Alert>
                    )}

                    <Paper sx={{ p: 3 }}>
                        <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Case Number"
                                name="caseNumber"
                                value={formData.caseNumber}
                                onChange={handleChange}
                                margin="normal"
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="First Name"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Last Name"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Contact Number"
                                name="contactNumber"
                                value={formData.contactNumber}
                                onChange={handleChange}
                                onKeyDown={(ev) => {
                                    if (!/^[0-9]$/.test(ev.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(ev.key)) {
                                        ev.preventDefault();
                                    }
                                }}
                                margin="normal"
                                required
                                error={!!contactNumberError}
                                helperText={contactNumberError}
                                inputProps={{ maxLength: 10, inputMode: 'numeric' }}
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
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                margin="normal"
                                multiline
                                rows={2}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="State"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="District"
                                name="district"
                                value={formData.district}
                                onChange={handleChange}
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Pincode"
                                name="pincode"
                                value={formData.pincode}
                                onChange={handleChange}
                                onKeyDown={(ev) => {
                                    if (!/^[0-9]$/.test(ev.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(ev.key)) {
                                        ev.preventDefault();
                                    }
                                }}
                                margin="normal"
                                error={!!pincodeError}
                                helperText={pincodeError}
                                inputProps={{ inputMode: 'numeric' }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Remarks"
                                name="remarks"
                                value={formData.remarks}
                                onChange={handleChange}
                                margin="normal"
                                multiline
                                rows={4}
                            />
                        </Grid>
                    </Grid>

                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        sx={{ mt: 2 }}
                        disabled={loading || !!contactNumberError || formData.contactNumber.length !== 10 || (formData.pincode && !/^\d+$/.test(formData.pincode))}
                    >
                        {loading ? 'Creating...' : 'Create Record'}
                    </Button>
                </form>
                    </Paper>
                </Container>
            </Box>
        </Box>
    );
};

export default ManualEntryPage;
