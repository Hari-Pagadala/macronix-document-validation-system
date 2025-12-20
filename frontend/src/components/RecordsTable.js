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
  Typography,
  Button
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Assignment as AssignIcon,
  CheckCircle as ApprovedIcon,
  Pending as PendingIcon,
  Schedule as InProgressIcon,
  Error as RejectedIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import axios from 'axios';
import EditCaseModal from './EditCaseModal';
import ViewDetailsModal from './ViewDetailsModal';
import { useAuth } from '../context/AuthContext';

const statusConfig = {
  pending: { color: 'warning', icon: <PendingIcon />, label: 'PENDING' },
  vendor_assigned: { color: 'info', icon: <AssignIcon />, label: 'VENDOR ASSIGNED' },
  assigned: { color: 'info', icon: <AssignIcon />, label: 'ASSIGNED' },
  in_progress: { color: 'primary', icon: <InProgressIcon />, label: 'IN PROGRESS' },
  submitted: { color: 'secondary', icon: <PendingIcon />, label: 'SUBMITTED' },
  approved: { color: 'success', icon: <ApprovedIcon />, label: 'APPROVED' },
  insufficient: { color: 'warning', icon: <WarningIcon />, label: 'INSUFFICIENT' },
  rejected: { color: 'error', icon: <RejectedIcon />, label: 'REJECTED' },
  stopped: { color: 'error', icon: <RejectedIcon />, label: 'STOPPED' }
};

const RecordsTable = ({ status = 'all' }) => {
  const { token, loading: authLoading } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewRecordId, setViewRecordId] = useState(null);

  useEffect(() => {
    if (token && !authLoading) {
      fetchRecords();
    }
  }, [status, page, rowsPerPage, search, token, authLoading]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/records', {
        params: {
          status: status === 'all' ? '' : status,
          search: search,
          page: page + 1,
          limit: rowsPerPage
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setRecords(response.data.records || []);
      setTotal(response.data.pagination?.total || 0);
      setError('');
    } catch (err) {
      setError('Failed to load records');
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

  const handleMenuOpen = (event, record) => {
    setAnchorEl(event.currentTarget);
    setSelectedRecord(record);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRecord(null);
  };

  const handleEdit = () => {
    setEditModalOpen(true);
    // Close menu but keep selectedRecord available for EditCaseModal
    setAnchorEl(null);
  };

  const handleView = () => {
    if (selectedRecord) {
      setViewRecordId(selectedRecord.id);
      setViewModalOpen(true);
    }
    handleMenuClose();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getTATStatus = (record) => {
    if (!record.tatDueDate || record.status === 'approved' || record.status === 'rejected') {
      return null;
    }

    const now = new Date();
    const dueDate = new Date(record.tatDueDate);
    
    // Set dueDate to end of day for accurate comparison
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

  const handleUpdateSuccess = () => {
    fetchRecords();
    setEditModalOpen(false);
  };



  return (
    <>
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <TextField
              placeholder="Search by Case Number, Reference, Name, Phone..."
              value={search}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              size="small"
              sx={{ flex: 1, mr: 2 }}
            />
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', width: 120 }}>Case Number</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 160 }}>MACRONIX Reference</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Customer Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Contact</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 140 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 100 }}>Created</TableCell>
                {status === 'approved' && (
                  <TableCell sx={{ fontWeight: 'bold', width: 120 }}>Completed Date</TableCell>
                )}
                {status !== 'approved' && (
                  <TableCell sx={{ fontWeight: 'bold', width: 120 }}>TAT Status</TableCell>
                )}
                <TableCell sx={{ fontWeight: 'bold', width: 100 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={status === 'approved' ? 10 : 9} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={status === 'approved' ? 10 : 9} align="center" sx={{ py: 3 }}>
                    <Typography color="textSecondary">
                      No records found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => {
                  const statusInfo = statusConfig[record.status] || statusConfig.pending;
                  // Prefer company name for vendor label; fall back to any available vendor reference
                  const vendorName = record.assignedVendorCompanyName || record.vendor?.company || record.vendorName || record.assignedVendorName;
                  const fieldOfficerName = record.assignedFieldOfficerName || record.fieldOfficerName;
                  const tatStatus = getTATStatus(record);
                  const displayCase = record.caseNumber || record.referenceNumber || 'N/A';
                  const displayName = record.fullName || [record.firstName, record.lastName].filter(Boolean).join(' ').trim() || 'N/A';
                  const displayContact = record.contactNumber || 'N/A';
                  const displayEmail = record.email || '';
                  const displayLocation = [record.district, record.state].filter(Boolean).join(', ') || 'N/A';

                  return (
                    <TableRow key={record.id} hover>
                      <TableCell>
                        <strong>{displayCase}</strong>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <strong style={{ color: '#1976d2', fontFamily: 'monospace' }}>
                            {record.referenceNumber || 'N/A'}
                          </strong>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {displayName}
                      </TableCell>
                      <TableCell>
                        {displayContact}
                        {displayEmail && (
                          <div style={{ fontSize: '0.75rem', color: '#666' }}>
                            {displayEmail}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {displayLocation}
                        {record.pincode && (
                          <div style={{ fontSize: '0.75rem', color: '#666' }}>
                            {record.pincode}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={statusInfo.icon}
                          label={statusInfo.label}
                          color={statusInfo.color}
                          size="small"
                          variant="outlined"
                        />
                        {(vendorName || fieldOfficerName) && (
                          <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                            {vendorName && (
                              <Typography variant="caption" color="text.secondary">
                                Vendor: {vendorName}
                              </Typography>
                            )}
                            {fieldOfficerName && (
                              <Typography variant="caption" color="text.secondary">
                                Field Officer: {fieldOfficerName}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(record.createdAt)}</TableCell>
                      {status === 'approved' ? (
                        <TableCell>{formatDate(record.completionDate)}</TableCell>
                      ) : (
                        <TableCell>
                          {tatStatus ? (
                            <Chip
                              icon={<WarningIcon />}
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
                            <Typography variant="caption" color="textSecondary">
                              N/A
                            </Typography>
                          )}
                        </TableCell>
                      )}
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
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleView}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit / Assign
        </MenuItem>
      </Menu>

      {/* View Details Modal */}
      <ViewDetailsModal
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        recordId={viewRecordId}
        onStopSuccess={fetchRecords}
      />

      {/* Edit Modal */}
      {selectedRecord && (
        <EditCaseModal
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedRecord(null);
          }}
          record={selectedRecord}
          onUpdate={handleUpdateSuccess}
        />
      )}
    </>
  );
};

export default RecordsTable;
