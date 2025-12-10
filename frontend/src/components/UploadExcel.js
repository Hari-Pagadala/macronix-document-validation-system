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

    setLoading(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Map Excel columns to required format
        const records = jsonData.map((row) => {
          // Case Number is REQUIRED and must be first column
          const caseNumber = row['Case Number'] || row['CaseNumber'] || row['Case No'] || '';
          
          if (!caseNumber) {
            throw new Error('Case Number is required in Excel file');
          }

          return {
            caseNumber: caseNumber.toString().trim(),
            firstName: row['First Name'] || row['FirstName'] || '',
            lastName: row['Last Name'] || row['LastName'] || '',
            contactNumber: (row['Contact Number'] || row['ContactNumber'] || row['Phone'] || '').toString(),
            email: row['Email'] || '',
            address: row['Address'] || '',
            state: row['State'] || '',
            district: row['District'] || '',
            pincode: (row['Pincode'] || row['PIN Code'] || '').toString()
          };
        });

        // Send to backend
        const response = await axios.post('http://localhost:5000/api/records/bulk-upload', {
          records,
          fileName: file.name
        });

        setResult(response.data);
        
        if (onSuccess) {
          onSuccess();
        }
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      setError(err.response?.data?.message || 'Error uploading file. Please check the format.');
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
              <Alert severity="success" sx={{ mb: 2 }}>
                <strong>Upload Successful!</strong>
                <br />
                {result.message}
              </Alert>
              
              <Box sx={{ mb: 2 }}>
                <Chip 
                  icon={<CheckIcon />}
                  label={`Batch: ${result.batchId}`}
                  color="success"
                  variant="outlined"
                />
              </Box>
              
              <Typography variant="subtitle2" gutterBottom>
                Generated MACRONIX Reference Numbers:
              </Typography>
              
              <Box sx={{ 
                maxHeight: 150, 
                overflow: 'auto', 
                border: '1px solid #eee', 
                borderRadius: 1,
                p: 1,
                mb: 2
              }}>
                {result.referenceNumbers?.slice(0, 10).map((ref, index) => (
                  <Chip
                    key={index}
                    label={ref}
                    size="small"
                    sx={{ m: 0.5 }}
                  />
                ))}
                {result.referenceNumbers?.length > 10 && (
                  <Typography variant="caption" color="textSecondary">
                    ... and {result.referenceNumbers.length - 10} more
                  </Typography>
                )}
              </Box>
              
              {result.failedRecords?.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {result.failedRecords.length} records failed. Check format.
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