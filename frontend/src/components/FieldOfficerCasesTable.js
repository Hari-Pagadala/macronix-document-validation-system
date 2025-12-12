import React, { useEffect, useState } from 'react';
import { Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, TablePagination, Box, TextField, InputAdornment, Chip, IconButton, CircularProgress, Typography, Button } from '@mui/material';
import { Search as SearchIcon, MoreVert as MoreVertIcon, Visibility as ViewIcon } from '@mui/icons-material';
import SubmitVerificationModal from './SubmitVerificationModal';
import axios from 'axios';

const statusConfig = {
  assigned: { color: 'info', label: 'ASSIGNED' },
  submitted: { color: 'secondary', label: 'SUBMITTED' },
  approved: { color: 'success', label: 'APPROVED' },
  insufficient: { color: 'warning', label: 'INSUFFICIENT' },
  rejected: { color: 'error', label: 'REJECTED' }
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
                  <TableCell><strong>Created</strong></TableCell>
                  {status === 'assigned' && <TableCell><strong>Actions</strong></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={status === 'assigned' ? 8 : 7} align="center" sx={{ py: 3 }}>
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
                        <TableCell>{formatDate(record.createdAt)}</TableCell>
                        {status === 'assigned' && (
                          <TableCell>
                            <Button variant="contained" size="small" onClick={() => openSubmit(record)}>Submit Details</Button>
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
    </>
  );
};

export default FieldOfficerCasesTable;
