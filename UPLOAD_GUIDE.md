# Document Upload Test - Sample File Guide

## Overview
This guide helps you test the bulk document upload feature in the Macronix Document Validation System.

## Sample Files Provided

### 1. `SAMPLE_UPLOAD_TEMPLATE.csv`
A CSV template with 10 sample case records ready for upload.

## How to Create an Excel File from the CSV Sample

### Option 1: Using Microsoft Excel
1. Open `SAMPLE_UPLOAD_TEMPLATE.csv` in Microsoft Excel
2. File → Save As → Choose "Excel Workbook (.xlsx)" format
3. Save as `SAMPLE_CASES.xlsx`

### Option 2: Using Google Sheets
1. Go to https://sheets.google.com
2. File → Open → Select `SAMPLE_UPLOAD_TEMPLATE.csv`
3. File → Download → Microsoft Excel (.xlsx)

### Option 3: Using Online Converter
1. Visit https://cloudconvert.com/csv-to-xlsx
2. Upload `SAMPLE_UPLOAD_TEMPLATE.csv`
3. Download the converted Excel file

## Excel Column Format

The upload file must have the following columns (in any order):

| Column Name | Description | Required | Example |
|---|---|---|---|
| **Case Number** | Unique case identifier | ✅ Yes | CASE-001 |
| **First Name** | Person's first name | ❌ No | Rajesh |
| **Last Name** | Person's last name | ❌ No | Kumar |
| **Contact Number** | Phone number | ❌ No | 9876543210 |
| **Email** | Email address | ❌ No | rajesh@email.com |
| **Address** | Full address | ❌ No | 123 Main Street |
| **State** | State/Province | ❌ No | Maharashtra |
| **District** | District | ❌ No | Mumbai |
| **Pincode** | Postal code | ❌ No | 400001 |

## Important Notes

### Case Number Requirements
- **REQUIRED** for every row
- Must be unique across all records
- Can be any string (alphanumeric)
- Examples: `CASE-001`, `DOC-2024-1`, `REF-123`, etc.

### Optional Fields
- If any field is empty, it will be recorded as blank
- Optional fields can be left empty in the Excel file

### File Requirements
- File format: `.xlsx` or `.xls` (Excel format)
- First row must contain column headers
- No blank rows between data rows
- Maximum recommended: 100 records per upload

## Testing Steps

1. **Convert CSV to Excel**
   - Use one of the methods above to convert `SAMPLE_UPLOAD_TEMPLATE.csv` to `.xlsx` format
   - Save it as `SAMPLE_CASES.xlsx`

2. **Access the Dashboard**
   - Login to http://localhost:3000
   - Navigate to Dashboard

3. **Upload the File**
   - Click "Upload Excel" button (top right of Case Records section)
   - Drag & drop or select your `.xlsx` file
   - Click "Upload" button

4. **Verify Upload**
   - Check that 10 new cases appear in the "All Cases" tab
   - Verify case numbers: CASE-001 through CASE-010
   - Check that personal details are correctly populated

## Sample Data Details

The included sample has 10 test cases with:
- **Case Numbers**: CASE-001 to CASE-010
- **Names**: Mix of Indian first and last names
- **Phone Numbers**: Sample format (9876543210 - 9876543219)
- **Emails**: Format: firstname.lastname@email.com
- **Addresses**: Various locations across India
- **States**: Maharashtra, Karnataka, Gujarat, Delhi, Telangana, UP, Kerala, Tamil Nadu, Andhra Pradesh, Rajasthan
- **Districts**: Major cities in each state

## Troubleshooting

### "Case Number is required" Error
- Make sure the first column in your Excel file has the header "Case Number"
- Verify that all rows have a value in the Case Number column

### "Case Number already exists" Error
- A case with that number already exists in the database
- Change the Case Number in your Excel file to be unique
- Or delete the existing case first

### Upload Fails Silently
- Check browser console (F12) for error messages
- Verify the Excel file format is `.xlsx` or `.xls`
- Ensure column headers match exactly (case-sensitive)

### Missing Data After Upload
- Optional fields that are empty in Excel will be stored as empty strings
- This is expected behavior
- You can edit cases individually after upload if needed

## Alternative: Manual Entry

If you prefer to test without uploading:
1. Click "Manual Entry" button in the top navigation
2. Fill in the case details form manually
3. Click "Create Record"
4. A unique reference number will be automatically generated

## Next Steps After Upload

Once you've successfully uploaded test cases, you can:
- ✅ View cases in the Dashboard tabs
- ✅ Edit case details
- ✅ Assign vendors and field officers
- ✅ View assigned TAT dates
- ✅ View case details in the popup modal
- ✅ Stop and revert cases
- ✅ Track case status through the workflow

---

**Need Help?**
Refer to the system's main README or contact support for additional assistance.
