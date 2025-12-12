import React, { useState, useEffect } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Box,
  CircularProgress,
  Alert,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import axios from 'axios';

const statusConfig = {
  pending: { color: 'warning', label: 'PENDING' },
  vendor_assigned: { color: 'info', label: 'VENDOR ASSIGNED' },
  assigned: { color: 'info', label: 'ASSIGNED' },
  submitted: { color: 'secondary', label: 'SUBMITTED' },
  approved: { color: 'success', label: 'APPROVED' },
  insufficient: { color: 'warning', label: 'INSUFFICIENT' },
  rejected: { color: 'error', label: 'REJECTED' },
  stopped: { color: 'error', label: 'STOPPED' }
};

const VendorCasesTable = ({ status = 'all', onUpdate }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [total, setTotal] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [fieldOfficers, setFieldOfficers] = useState([]);
  const [assignedFieldOfficer, setAssignedFieldOfficer] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, [status, page, rowsPerPage, search]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const vendorToken = localStorage.getItem('vendorToken');
      
      const response = await axios.get('http://localhost:5000/api/vendor-portal/cases', {
        params: {
          status: status === 'all' ? '' : status,
          search: search,
          page: page + 1,
          limit: rowsPerPage
        },
        headers: {
          'Authorization': `Bearer ${vendorToken}`
        }
      });

      setRecords(response.data.records || []);
      setTotal(response.data.pagination?.total || 0);
      setError('');
    } catch (err) {
      setError('Failed to load cases');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (e, record) => {
    setAnchorEl(e.currentTarget);
    setSelectedRecord(record);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewDetails = () => {
    setDetailsOpen(true);
    handleMenuClose();
    fetchFieldOfficers();
    // Preselect currently assigned field officer if present
    setAssignedFieldOfficer(selectedRecord?.assignedFieldOfficer || '');
  };

  const handleDetailsClose = () => {
    setDetailsOpen(false);
    setSelectedRecord(null);
    setAssignedFieldOfficer('');
  };

  const fetchFieldOfficers = async () => {
    try {
      const vendorToken = localStorage.getItem('vendorToken');
      const response = await axios.get('http://localhost:5000/api/vendor-portal/field-officers', {
        headers: { Authorization: `Bearer ${vendorToken}` }
      });
      setFieldOfficers(response.data.fieldOfficers || []);
    } catch (err) {
      console.error('Error fetching field officers:', err);
    }
  };

  const handleAssignFieldOfficer = async () => {
    if (!assignedFieldOfficer) {
      alert('Please select a field officer');
      return;
    }

    try {
      setAssignLoading(true);
      const vendorToken = localStorage.getItem('vendorToken');
      await axios.post(
        `http://localhost:5000/api/vendor-portal/cases/${selectedRecord.id}/assign-field-officer`,
        { fieldOfficerId: assignedFieldOfficer },
        { headers: { Authorization: `Bearer ${vendorToken}` } }
      );
      alert('Field officer assigned successfully');
      handleDetailsClose();
      fetchRecords();
      if (onUpdate) onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign field officer');
    } finally {
      setAssignLoading(false);
    }
  };

  const getTATStatus = (record) => {
    if (!record.tatDueDate || record.status === 'approved' || record.status === 'rejected') {
      return null;
    }

    const now = new Date();
    const dueDate = new Date(record.tatDueDate);
    dueDate.setHours(23, 59, 59, 999);
    const daysRemaining = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      return { type: 'breached', label: `Delayed by ${Math.abs(daysRemaining)} day(s)`, days: Math.abs(daysRemaining) };
    } else if (daysRemaining === 0) {
      return { type: 'due-today', label: 'Due Today', days: 0 };
    } else if (daysRemaining === 1) {
      return { type: 'urgent', label: 'Due Tomorrow', days: 1 };
    } else if (daysRemaining <= 3) {
      return { type: 'warning', label: `Due in ${daysRemaining} day(s)`, days: daysRemaining };
    }
    return { type: 'on-time', label: `On Time (${daysRemaining}d left)`, days: daysRemaining };
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Box sx={{ p: 2 }}>
          <TextField
            placeholder="Search by Case #, Ref #, Name, or Phone"
            value={search}
            onChange={handleSearch}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell><strong>Case #</strong></TableCell>
                  <TableCell><strong>Ref #</strong></TableCell>
                  <TableCell><strong>Customer Name</strong></TableCell>
                  <TableCell><strong>Contact</strong></TableCell>
                  <TableCell><strong>Location</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Created</strong></TableCell>
                  <TableCell><strong>TAT Status</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">
                        No cases found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => {
                    const statusInfo = statusConfig[record.status] || statusConfig.pending;
                    // Prefer company name for vendor label; fall back to any available vendor reference
                    const vendorName = record.assignedVendorCompanyName || record.vendor?.company || record.vendorName || record.assignedVendorName;
                    const fieldOfficerName = record.assignedFieldOfficerName || record.fieldOfficerName;
                    const displayName = record.fullName || [record.firstName, record.lastName].filter(Boolean).join(' ').trim() || 'N/A';
                    const displayContact = record.contactNumber || 'N/A';
                    const displayLocation = [record.district, record.state].filter(Boolean).join(', ') || 'N/A';
                    const displayCase = record.caseNumber || record.referenceNumber || 'N/A';
                    const tatStatus = getTATStatus(record);

                    return (
                      <TableRow key={record.id} hover>
                        <TableCell>
                          <strong>{displayCase}</strong>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ color: '#1976d2', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                            {record.referenceNumber || 'N/A'}
                          </Box>
                        </TableCell>
                        <TableCell>{displayName}</TableCell>
                        <TableCell>{displayContact}</TableCell>
                        <TableCell>{displayLocation}</TableCell>
                        <TableCell>
                          <Chip
                            label={statusInfo.label}
                            color={statusInfo.color}
                            size="small"
                            variant="outlined"
                          />
                          {(vendorName || fieldOfficerName) && (
                            <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                             
                              {fieldOfficerName && (
                                <Typography variant="caption" color="text.secondary">
                                  Field Officer: {fieldOfficerName}
                                </Typography>
                              )}
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(record.createdAt)}</TableCell>
                        <TableCell>
                          {tatStatus ? (
                            <Chip
                              label={tatStatus.label}
                              color={
                                tatStatus.type === 'breached' ? 'error' :
                                tatStatus.type === 'due-today' ? 'error' :
                                tatStatus.type === 'urgent' ? 'error' :
                                tatStatus.type === 'warning' ? 'warning' :
                                'success'
                              }
                              size="small"
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              N/A
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, record)}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={total}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </TableContainer>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewDetails}>
          <ViewIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
      </Menu>

      {/* Case Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={handleDetailsClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Case Details & Assignment</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedRecord && (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
              {/* Left Column - Case Details */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Case Information
                </Typography>
                <Box>
                  <Typography variant="caption" color="text.secondary">Case Number</Typography>
                  <Typography>{selectedRecord.caseNumber || 'N/A'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Reference Number</Typography>
                  <Typography>{selectedRecord.referenceNumber || 'N/A'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Chip label={statusConfig[selectedRecord.status]?.label} color={statusConfig[selectedRecord.status]?.color} size="small" />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Created</Typography>
                  <Typography>{formatDate(selectedRecord.createdAt)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">TAT Due Date</Typography>
                  <Typography>{formatDate(selectedRecord.tatDueDate)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">TAT Status</Typography>
                  {getTATStatus(selectedRecord) ? (
                    <Chip
                      label={getTATStatus(selectedRecord).label}
                      color={
                        getTATStatus(selectedRecord).type === 'breached' ? 'error' :
                        getTATStatus(selectedRecord).type === 'due-today' ? 'error' :
                        getTATStatus(selectedRecord).type === 'urgent' ? 'error' :
                        getTATStatus(selectedRecord).type === 'warning' ? 'warning' :
                        'success'
                      }
                      size="small"
                    />
                  ) : (
                    <Typography>N/A</Typography>
                  )}
                </Box>
              </Box>

              {/* Middle Column - Customer Details */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Customer Information
                </Typography>
                <Box>
                  <Typography variant="caption" color="text.secondary">Customer Name</Typography>
                  <Typography>{selectedRecord.fullName || 'N/A'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Contact Number</Typography>
                  <Typography>{selectedRecord.contactNumber || 'N/A'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Email</Typography>
                  <Typography>{selectedRecord.email || 'N/A'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Address</Typography>
                  <Typography>{selectedRecord.address || 'N/A'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Location</Typography>
                  <Typography>
                    {[selectedRecord.district, selectedRecord.state, selectedRecord.pincode].filter(Boolean).join(', ') || 'N/A'}
                  </Typography>
                </Box>
              </Box>

              {/* Full Width - Field Officer Assignment */}
              <Box sx={{ gridColumn: '1 / -1', mt: 2, pt: 2, borderTop: '1px solid #ddd' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Assign Field Officer
                </Typography>
                <FormControl fullWidth disabled={selectedRecord.status === 'submitted' || selectedRecord.status === 'approved' || selectedRecord.status === 'rejected' || selectedRecord.status === 'stopped'}>
                  <InputLabel>Select Field Officer</InputLabel>
                  <Select
                    value={assignedFieldOfficer}
                    onChange={(e) => setAssignedFieldOfficer(e.target.value)}
                    label="Select Field Officer"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {fieldOfficers.map((fo) => (
                      <MenuItem key={fo.id} value={fo.id}>
                        {fo.name} ({fo.email})
                      </MenuItem>
                    ))}
                  </Select>
                  {selectedRecord.assignedFieldOfficerName && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Current: {selectedRecord.assignedFieldOfficerName}
                    </Typography>
                  )}
                </FormControl>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDetailsClose}>Close</Button>
          <Button
            variant="contained"
            onClick={handleAssignFieldOfficer}
            disabled={assignLoading || !assignedFieldOfficer || selectedRecord?.status === 'submitted' || selectedRecord?.status === 'approved' || selectedRecord?.status === 'rejected' || selectedRecord?.status === 'stopped'}
          >
            {assignLoading ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default VendorCasesTable;

