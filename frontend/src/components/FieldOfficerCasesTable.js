import React, { useEffect, useState } from 'react';
import { Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, TablePagination, Box, TextField, InputAdornment, Chip, IconButton, CircularProgress, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Search as SearchIcon, MoreVert as MoreVertIcon, Visibility as ViewIcon, AccessTime as AccessTimeIcon, Warning as WarningIcon } from '@mui/icons-material';
import SubmitVerificationModal from './SubmitVerificationModal';
import axios from 'axios';

const statusConfig = {
  assigned: { color: 'info', label: 'ASSIGNED' },
  submitted: { color: 'secondary', label: 'SUBMITTED' },
  approved: { color: 'success', label: 'APPROVED' },
  insufficient: { color: 'warning', label: 'INSUFFICIENT' },
  rejected: { color: 'error', label: 'REJECTED' }
};

const getTATStatus = (tatDueDate) => {
  if (!tatDueDate) return { status: 'N/A', color: 'default', icon: null };
  
  const dueDate = new Date(tatDueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  
  if (today > dueDate) {
    return { 
      status: 'BREACHED', 
      color: 'error', 
      icon: <WarningIcon sx={{ fontSize: '0.875rem', mr: 0.5 }} />,
      daysOverdue: Math.floor((today - dueDate) / (1000 * 60 * 60 * 24))
    };
  } else if (today.getTime() === dueDate.getTime()) {
    return { 
      status: 'DUE TODAY', 
      color: 'warning', 
      icon: <AccessTimeIcon sx={{ fontSize: '0.875rem', mr: 0.5 }} />,
      daysDue: 0
    };
  } else {
    const daysLeft = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
    return { 
      status: 'WITHIN TAT', 
      color: 'success', 
      icon: <AccessTimeIcon sx={{ fontSize: '0.875rem', mr: 0.5 }} />,
      daysLeft
    };
  }
};

const FieldOfficerCasesTable = ({ status = 'assigned' }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [submitOpen, setSubmitOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, [status, page, rowsPerPage, search]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('fieldOfficerUser') || '{}');

      const token = localStorage.getItem('fieldOfficerToken');
      const response = await axios.get('http://localhost:5000/api/fo-portal/cases', {
        params: {
          status: status === 'all' ? '' : status,
          search,
          page: page + 1,
          limit: rowsPerPage
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      setRecords(response.data.records || []);
      setTotal(response.data.pagination?.total || 0);
      setError('');
    } catch (err) {
      console.error('Error loading FO cases:', err);
      setError('Failed to load cases');
    } finally {
      setLoading(false);
    }
  };
  const openSubmit = (record) => { setSelectedRecord(record); setSubmitOpen(true); };
  const closeSubmit = () => { setSubmitOpen(false); setSelectedRecord(null); };
  const handleSubmitted = () => { closeSubmit(); fetchRecords(); };
  const openDetails = (record) => { setSelectedRecord(record); setDetailsOpen(true); };
  const closeDetails = () => { setDetailsOpen(false); setSelectedRecord(null); };

  const handleSearch = (e) => { setSearch(e.target.value); setPage(0); };
  const handleChangePage = (e, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  return (
    <>
    <Paper sx={{ width: '100%' }}>
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by Case #, Ref #, Name, or Phone"
          value={search}
          onChange={handleSearch}
          InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
      ) : error ? (
        <Box sx={{ p: 2 }}><Typography color="error">{error}</Typography></Box>
      ) : (
        <>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell><strong>Case #</strong></TableCell>
                  <TableCell><strong>Ref #</strong></TableCell>
                  <TableCell><strong>Customer Name</strong></TableCell>
                  <TableCell><strong>Contact</strong></TableCell>
                  <TableCell><strong>Location</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  {status !== 'approved' && (
                    <TableCell><strong>TAT Status</strong></TableCell>
                  )}
                  <TableCell><strong>Created</strong></TableCell>
                  {status === 'approved' && (
                    <TableCell><strong>Completed Date</strong></TableCell>
                  )}
                  {status === 'assigned' && <TableCell><strong>Actions</strong></TableCell>}
                  {status !== 'assigned' && status !== 'approved' && <TableCell><strong>Actions</strong></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={status === 'assigned' ? 9 : (status === 'approved' ? 9 : 9)} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">No cases found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map(record => {
                    const statusInfo = statusConfig[record.status] || statusConfig.assigned;
                    const displayName = record.fullName || [record.firstName, record.lastName].filter(Boolean).join(' ').trim() || 'N/A';
                    const displayContact = record.contactNumber || 'N/A';
                    const displayLocation = [record.district, record.state].filter(Boolean).join(', ') || 'N/A';
                    const displayCase = record.caseNumber || record.referenceNumber || 'N/A';
                    const tatStatus = getTATStatus(record.tatDueDate);
                    
                    return (
                      <TableRow key={record.id} hover>
                        <TableCell><strong>{displayCase}</strong></TableCell>
                        <TableCell>
                          <Box sx={{ color: '#1976d2', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                            {record.referenceNumber || 'N/A'}
                          </Box>
                        </TableCell>
                        <TableCell>{displayName}</TableCell>
                        <TableCell>{displayContact}</TableCell>
                        <TableCell>{displayLocation}</TableCell>
                        <TableCell>
                          <Chip label={statusInfo.label} color={statusInfo.color} size="small" variant="outlined" />
                        </TableCell>
                        {status !== 'approved' && (
                          <TableCell>
                            <Chip 
                              icon={tatStatus.icon}
                              label={tatStatus.status === 'N/A' ? 'N/A' : `${tatStatus.status}${tatStatus.daysLeft !== undefined ? ` (${tatStatus.daysLeft}d)` : tatStatus.daysOverdue !== undefined ? ` (${tatStatus.daysOverdue}d)` : ''}`}
                              color={tatStatus.color} 
                              size="small" 
                              variant="outlined"
                            />
                          </TableCell>
                        )}
                        <TableCell>{formatDate(record.createdAt)}</TableCell>
                        {status === 'approved' && (
                          <TableCell>{formatDate(record.completionDate)}</TableCell>
                        )}
                        {status === 'assigned' && (
                          <TableCell>
                            <Button variant="contained" size="small" onClick={() => openSubmit(record)}>Submit Details</Button>
                          </TableCell>
                        )}
                        {status !== 'assigned' && status !== 'approved' && (
                          <TableCell>
                            <IconButton size="small" onClick={() => openDetails(record)} title="View Details">
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

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
    </Paper>

    {selectedRecord && (
      <SubmitVerificationModal
        open={submitOpen}
        onClose={closeSubmit}
        record={selectedRecord}
        onSubmitted={handleSubmitted}
      />
    )}

    {/* Case Details Dialog */}
    <Dialog
      open={detailsOpen}
      onClose={closeDetails}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Case Details</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {selectedRecord && (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            {/* Left Column */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Case Information</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">Case Number</Typography>
                <Typography>{selectedRecord.caseNumber || 'N/A'}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">Reference Number</Typography>
                <Typography>{selectedRecord.referenceNumber || 'N/A'}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Chip label={statusConfig[selectedRecord.status]?.label} color={statusConfig[selectedRecord.status]?.color} size="small" />
              </Box>
              {selectedRecord.status === 'rejected' && selectedRecord.remarks && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">Rejection Reason</Typography>
                  <Typography sx={{ color: '#d32f2f', mt: 0.5, fontWeight: '500' }}>{selectedRecord.remarks}</Typography>
                </Box>
              )}
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">Created</Typography>
                <Typography>{formatDate(selectedRecord.createdAt)}</Typography>
              </Box>
            </Box>
            {/* Right Column */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Customer Information</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">Customer Name</Typography>
                <Typography>{selectedRecord.fullName || `${selectedRecord.firstName || ''} ${selectedRecord.lastName || ''}`.trim() || 'N/A'}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">Contact Number</Typography>
                <Typography>{selectedRecord.contactNumber || 'N/A'}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">Email</Typography>
                <Typography>{selectedRecord.email || 'N/A'}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">Location</Typography>
                <Typography>{[selectedRecord.address, selectedRecord.district, selectedRecord.state].filter(Boolean).join(', ') || 'N/A'}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">Pincode</Typography>
                <Typography>{selectedRecord.pincode || 'N/A'}</Typography>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDetails}>Close</Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default FieldOfficerCasesTable;
