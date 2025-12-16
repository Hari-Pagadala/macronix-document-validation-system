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
    const [caseNumberError, setCaseNumberError] = useState('');
    const [firstNameError, setFirstNameError] = useState('');
    const [lastNameError, setLastNameError] = useState('');
    const [stateError, setStateError] = useState('');
    const [districtError, setDistrictError] = useState('');
    const [checkingCase, setCheckingCase] = useState(false);

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

        // Normalization helpers similar to bulk upload
        const collapseSpaces = (v) => (v || '').toString().replace(/\s+/g, ' ');

        if (name === 'contactNumber') {
            newValue = value.replace(/[^0-9]/g, '');
            if (newValue.length > 0 && newValue.length !== 10) {
                setContactNumberError('Contact number must be exactly 10 digits');
            } else {
                setContactNumberError('');
            }
        } else if (name === 'pincode') {
            newValue = value.replace(/[^0-9]/g, '');
            if (newValue.length > 0 && !/^\d{6}$/.test(newValue)) {
                setPincodeError('Pincode must be numeric and exactly 6 digits');
            } else {
                setPincodeError('');
            }
        } else if (['firstName', 'lastName', 'state', 'district', 'address'].includes(name)) {
            // collapse multiple spaces but allow typing
            newValue = collapseSpaces(value);
        } else if (name === 'caseNumber') {
            newValue = value.trim();
            setCaseNumberError('');
        }

        setFormData(prev => ({ ...prev, [name]: newValue }));

        // Basic character validation for names/state/district
        const isAlphaName = (v) => /^[A-Za-z\s'\-]+$/.test(v || '');
        if (name === 'firstName') {
            setFirstNameError(newValue && !isAlphaName(newValue) ? 'First Name contains invalid characters' : '');
        }
        if (name === 'lastName') {
            setLastNameError(newValue && !isAlphaName(newValue) ? 'Last Name contains invalid characters' : '');
        }
        if (name === 'state') {
            setStateError(newValue && !isAlphaName(newValue) ? 'State contains invalid characters' : '');
        }
        if (name === 'district') {
            setDistrictError(newValue && !isAlphaName(newValue) ? 'District contains invalid characters' : '');
        }
    };

    const checkCaseDuplicate = async (caseNumber) => {
        const c = (caseNumber || '').toString().trim();
        if (!c) return;
        setCheckingCase(true);
        try {
            const token = localStorage.getItem('token');
            const resp = await axios.get('http://localhost:5000/api/records', {
                params: { search: c, limit: 1 },
                headers: { Authorization: `Bearer ${token}` }
            });
            const found = (resp.data?.records || []).some(r => (r.caseNumber || '').toString() === c);
            if (found) {
                setCaseNumberError('Case Number already exists in system');
            } else {
                setCaseNumberError('');
            }
        } catch (err) {
            // ignore network errors here; final check occurs on submit
        } finally {
            setCheckingCase(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        // Final normalization and validations (mirror bulk-upload rules)
        const norm = (v) => v === undefined || v === null ? '' : v.toString().replace(/\s+/g, ' ').trim();
        const isAlphaName = (v) => /^[A-Za-z\s'\-]+$/.test(v || '');

        const payload = {
            caseNumber: norm(formData.caseNumber),
            firstName: norm(formData.firstName),
            lastName: norm(formData.lastName),
            contactNumber: (formData.contactNumber || '').toString().replace(/[^0-9]/g, ''),
            email: norm(formData.email),
            address: norm(formData.address),
            state: norm(formData.state),
            district: norm(formData.district),
            pincode: (formData.pincode || '').toString().replace(/[^0-9]/g, ''),
            remarks: norm(formData.remarks)
        };

        // Mandatory checks
        if (!payload.caseNumber) {
            setCaseNumberError('Case Number is required');
            setError('Please fix validation errors before submitting');
            setLoading(false);
            return;
        }
        if (!payload.firstName) {
            setFirstNameError('First Name is required');
            setError('Please fix validation errors before submitting');
            setLoading(false);
            return;
        }
        if (!payload.lastName) {
            setLastNameError('Last Name is required');
            setError('Please fix validation errors before submitting');
            setLoading(false);
            return;
        }
        if (!payload.contactNumber) {
            setContactNumberError('Contact Number is required');
            setError('Please fix validation errors before submitting');
            setLoading(false);
            return;
        }
        if (!payload.address) {
            setError('Address is required');
            setLoading(false);
            return;
        }
        if (!payload.state) {
            setStateError('State is required');
            setError('Please fix validation errors before submitting');
            setLoading(false);
            return;
        }
        if (!payload.district) {
            setDistrictError('District is required');
            setError('Please fix validation errors before submitting');
            setLoading(false);
            return;
        }

        // Phone validation
        if (!/^[0-9]{10}$/.test(payload.contactNumber)) {
            setContactNumberError('Contact Number must be numeric and exactly 10 digits');
            setError('Please fix validation errors before submitting');
            setLoading(false);
            return;
        }

        // Pincode validation (6 digits)
        if (!/^[0-9]{6}$/.test(payload.pincode)) {
            setPincodeError('Pincode must be numeric and exactly 6 digits');
            setError('Please fix validation errors before submitting');
            setLoading(false);
            return;
        }

        // Name/state/district character restrictions
        if (!isAlphaName(payload.firstName)) {
            setFirstNameError('First Name contains invalid characters');
            setError('Please fix validation errors before submitting');
            setLoading(false);
            return;
        }
        if (!isAlphaName(payload.lastName)) {
            setLastNameError('Last Name contains invalid characters');
            setError('Please fix validation errors before submitting');
            setLoading(false);
            return;
        }
        if (!isAlphaName(payload.state)) {
            setStateError('State contains invalid characters');
            setError('Please fix validation errors before submitting');
            setLoading(false);
            return;
        }
        if (!isAlphaName(payload.district)) {
            setDistrictError('District contains invalid characters');
            setError('Please fix validation errors before submitting');
            setLoading(false);
            return;
        }

        // Server-side duplicate check before attempting create
        try {
            const token = localStorage.getItem('token');
            const resp = await axios.get('http://localhost:5000/api/records', {
                params: { search: payload.caseNumber, limit: 1 },
                headers: { Authorization: `Bearer ${token}` }
            });
            const found = (resp.data?.records || []).some(r => (r.caseNumber || '').toString() === payload.caseNumber);
            if (found) {
                setCaseNumberError('Case Number already exists in system');
                setError('Please fix validation errors before submitting');
                setLoading(false);
                return;
            }
        } catch (err) {
            // If check fails due to network, continue and let server validate on create
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:5000/api/records/manual',
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
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
            setCaseNumberError('');
            setFirstNameError('');
            setLastNameError('');
            setStateError('');
            setDistrictError('');

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
                                onBlur={() => checkCaseDuplicate(formData.caseNumber)}
                                margin="normal"
                                required
                                error={!!caseNumberError}
                                helperText={caseNumberError || (checkingCase ? 'Checking for duplicates...' : '')}
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
                                required
                                error={!!firstNameError}
                                helperText={firstNameError}
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
                                required
                                error={!!lastNameError}
                                helperText={lastNameError}
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
                                required
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
                                required
                                error={!!stateError}
                                helperText={stateError}
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
                                required
                                error={!!districtError}
                                helperText={districtError}
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
                                required
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
                        disabled={
                            loading ||
                            checkingCase ||
                            !!contactNumberError ||
                            !!caseNumberError ||
                            !!firstNameError ||
                            !!lastNameError ||
                            !!stateError ||
                            !!districtError ||
                            formData.contactNumber.length !== 10 ||
                            !formData.caseNumber ||
                            !formData.firstName ||
                            !formData.lastName ||
                            !formData.address ||
                            !formData.state ||
                            !formData.district ||
                            (formData.pincode && !/^\d{6}$/.test(formData.pincode))
                        }
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
