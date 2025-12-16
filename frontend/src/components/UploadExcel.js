import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Alert,
  LinearProgress,
  IconButton,
  Chip
} from '@mui/material';
import { 
  Upload as UploadIcon, 
  Close as CloseIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const UploadExcel = ({ onSuccess }) => {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
        setError('');
        setResult(null);
      }
    }
  });

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    // Basic client-side checks
    const allowedExt = ['.xlsx'];
    const name = file.name || '';
    const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
    if (!allowedExt.includes(ext)) {
      setError('Only .xlsx files are accepted');
      return;
    }
    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      setError('File size exceeds 5 MB limit');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Read file as binary (awaitable)
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsBinaryString(file);
      });

      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      // Helper: normalize whitespace and collapse multiple spaces
      const normalizeText = (v) => v.toString().replace(/\s+/g, ' ').trim();

      // Map Excel columns to required format with normalization
      const records = jsonData.map((row, idx) => {
        const caseNumber = row['Case Number'] || row['CaseNumber'] || row['Case No'] || '';

        return {
          caseNumber: normalizeText(caseNumber),
          firstName: normalizeText(row['First Name'] || row['FirstName'] || ''),
          lastName: normalizeText(row['Last Name'] || row['LastName'] || ''),
          contactNumber: (row['Contact Number'] || row['ContactNumber'] || row['Phone'] || '').toString().replace(/[^0-9]/g, '').slice(0, 10),
          email: normalizeText(row['Email'] || ''),
          address: normalizeText(row['Address'] || ''),
          state: normalizeText(row['State'] || ''),
          district: normalizeText(row['District'] || ''),
          pincode: (row['Pincode'] || row['PIN Code'] || '').toString().replace(/[^0-9]/g, '').slice(0, 6)
        };
      });

      // Send to backend and handle response/errors
      try {
        const response = await axios.post('http://localhost:5000/api/records/bulk-upload', {
          records,
          fileName: file.name
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        setResult(response.data);
        if (response.data && response.data.success && onSuccess) {
          onSuccess();
        }
      } catch (err) {
        // If server returned structured validation results, show them in UI
        if (err.response && err.response.data) {
          setResult(err.response.data);
        } else {
          setError(err.response?.data?.message || 'Error uploading file. Please check the format.');
          console.error('Upload error', err);
        }
      }

    } catch (err) {
      console.error('File read error', err);
      setError('Failed reading file: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const downloadReferences = () => {
    if (!result?.referenceNumbers) return;
    
    const content = result.referenceNumbers.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `macronix-references-${result.batchId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadErrorReport = () => {
    if (!result?.results?.failed?.length) return;
    const rows = result.results.failed.map(f => ({
      rowNumber: f.rowNumber,
      caseNumber: f.caseNumber,
      error: f.error
    }));
    const header = ['Row Number','Case Number','Error'];
    const csv = [header.join(',')].concat(rows.map(r => `${r.rowNumber},"${(r.caseNumber||'').replace(/"/g,'""')}","${(r.error||'').replace(/"/g,'""')}"`)).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `upload-errors-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<UploadIcon />}
        onClick={() => setOpen(true)}
        size="small"
      >
        Upload Excel
      </Button>

      <Dialog open={open} onClose={() => !loading && setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Upload Excel File</Typography>
            <IconButton onClick={() => setOpen(false)} disabled={loading}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {result ? (
            <Box>
              <Alert severity={result.success ? 'success' : 'warning'} sx={{ mb: 2 }}>
                <strong>{result.success ? 'Upload Successful!' : 'Upload Completed with Issues'}</strong>
                <br />
                {result.message}
              </Alert>

              {/* Success Summary */}
              {result.results?.success?.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'success.main', mb: 1 }}>
                    ✓ {result.results.success.length} Records Created Successfully
                  </Typography>
                  <Box sx={{ 
                    maxHeight: 150, 
                    overflow: 'auto', 
                    border: '1px solid #4caf50', 
                    borderRadius: 1,
                    p: 1,
                    mb: 2,
                    bgcolor: 'success.light'
                  }}>
                    {result.results.success.slice(0, 10).map((item, index) => (
                      <Chip
                        key={index}
                        icon={<CheckIcon />}
                        label={`${item.caseNumber} → ${item.referenceNumber}`}
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ m: 0.5 }}
                      />
                    ))}
                    {result.results.success.length > 10 && (
                      <Typography variant="caption" color="textSecondary" display="block">
                        ... and {result.results.success.length - 10} more
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}

              {/* Failed Summary */}
              {result.results?.failed?.length > 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    ✗ {result.results.failed.length} Records Failed
                  </Typography>
                  <Box sx={{ maxHeight: 120, overflow: 'auto' }}>
                    {result.results.failed.map((item, index) => (
                      <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                        Row {item.rowNumber}: {item.caseNumber} - {item.error}
                      </Typography>
                    ))}
                  </Box>
                </Alert>
              )}
            </Box>
          ) : (
            <>
              <Box
                {...getRootProps()}
                sx={{
                  border: '2px dashed #ccc',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <input {...getInputProps()} />
                <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" gutterBottom>
                  {file ? file.name : 'Drag & drop Excel file here'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Supported: .xls, .xlsx
                </Typography>
              </Box>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  ⓘ Required Excel Format (Columns in order):
                </Typography>
                <Typography variant="body2" component="div">
                  <ol style={{ margin: 0, paddingLeft: 20 }}>
                    <li><strong>Case Number</strong> (Required)</li>
                    <li>First Name (Required)</li>
                    <li>Last Name (Required)</li>
                    <li>Contact Number (Required)</li>
                    <li>Email (Optional)</li>
                    <li>Address (Required)</li>
                    <li>State (Required)</li>
                    <li>District (Required)</li>
                    <li>Pincode (Required)</li>
                  </ol>
                </Typography>
                <Typography variant="caption" color="primary" display="block" sx={{ mt: 1 }}>
                  Each record will auto-generate a unique MACRONIX-XXXXXX reference number
                </Typography>
              </Box>
            </>
          )}

          {loading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                Processing file and generating reference numbers...
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          {result ? (
            <>
              {result.results?.failed?.length > 0 && (
                <Button onClick={downloadErrorReport} variant="outlined" color="error">
                  Download Error Report
                </Button>
              )}
              <Button onClick={downloadReferences} variant="outlined">
                Download References
              </Button>
              <Button
                onClick={() => {
                  setOpen(false);
                  setFile(null);
                  setResult(null);
                }}
                variant="contained"
              >
                Done
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                variant="contained"
                disabled={!file || loading}
              >
                {loading ? 'Uploading...' : 'Upload & Generate'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UploadExcel;