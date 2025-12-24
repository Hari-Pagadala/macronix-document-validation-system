# Location Map Visibility Fix - Candidate vs FO Verification

## Overview
Implemented role-based visibility for Location Comparison Map. The map now displays **ONLY for candidate self-submissions** and is hidden during **Field Officer (FO) verification**.

---

## Changes Made

### 1. Frontend - ViewDetailsModal.js (Line 797)
**File**: `frontend/src/components/ViewDetailsModal.js`

**Change**: Wrapped entire Location Verification section with conditional check:
```javascript
{!verification?.fieldOfficerId && (
  <Paper sx={{ ... }}>
    {/* Location Verification section with map */}
  </Paper>
)}
```

**Logic**:
- `verification.fieldOfficerId` = FO verification (hide map)
- `!verification.fieldOfficerId` = Candidate submission (show map)

**Result**: 
- ✅ Location Comparison Map **HIDDEN** when FO verifies a record
- ✅ Location Comparison Map **VISIBLE** when candidate submits self-verification
- ✅ GPS coordinates and distance still shown in GPS table for all verifications

---

### 2. Backend - PDF Download (downloadController.js, Line 413)
**File**: `backend/controllers/downloadController.js`

**Changes**:
1. Added `isCandidateSubmission` flag check before map generation
2. Only includes location comparison map in PDF for candidate submissions
3. Logs "Skipping location map for FO verification" when applicable
4. Removed duplicate declaration that was below

**Code Structure**:
```javascript
// Add location comparison map ONLY for candidate submissions
const isCandidateSubmission = !verification.fieldOfficerId;

if (isCandidateSubmission) {
  // Map generation logic (only runs for candidates)
} else {
  console.log('[PDF] Skipping location map for FO verification');
}
```

**Result**:
- ✅ PDF generated for FO verification: NO map section
- ✅ PDF generated for candidate submission: Map included with legend
- ✅ GPS table still appears in all PDFs for reference

---

## Verification Logic

### Field Officer (FO) Verification
- **Identifier**: `verification.fieldOfficerId` is populated
- **Frontend**: Location Verification section NOT displayed
- **PDF**: Location comparison map NOT included
- **Still Shows**: GPS table with coordinates and distance

### Candidate Self-Submission
- **Identifier**: `verification.fieldOfficerId` is null/undefined
- **Frontend**: Location Verification section fully displayed (if GPS data available)
- **PDF**: Location comparison map included with legend and embedded image
- **Shows**: Map with red/green markers + GPS coordinates + distance

---

## Testing Checklist

### Frontend Testing
- [ ] Open a Field Officer verification case → Location Verification section should NOT appear
- [ ] Open a Candidate self-submission case → Location Verification section should appear (if GPS available)
- [ ] Verify GPS table still shows for both types
- [ ] Verify coordinates and distance calculation work correctly

### PDF Download Testing
- [ ] Download PDF from FO verification → No "Location Comparison Map" section
- [ ] Download PDF from candidate submission → "Location Comparison Map" section included with map image
- [ ] Verify GPS table appears in both PDFs
- [ ] Verify PDF generation completes without errors in server logs

### Edge Cases
- [ ] FO verification with GPS data → Map hidden despite data availability
- [ ] Candidate with no GPS data → No map shown (already handled by `canShowMap` check)
- [ ] Multiple submissions of same record → Each shows/hides map appropriately

---

## Files Modified

1. **frontend/src/components/ViewDetailsModal.js** (Line 797)
   - Added conditional check: `{!verification?.fieldOfficerId && (...Location Verification...)}`
   - Wrapped entire Paper component for Location Verification section

2. **backend/controllers/downloadController.js** (Lines 413-463)
   - Added `isCandidateSubmission` flag before map generation
   - Moved map generation inside conditional for candidate submissions only
   - Removed duplicate variable declaration

---

## Backward Compatibility

✅ **No breaking changes**
- All existing data and verification records continue to work
- No database schema changes required
- No API contract changes
- Purely UI/PDF visibility logic change
- FO verification flow remains fully functional (just without map display)

---

## Next Steps

1. **Test both scenarios** as listed in Testing Checklist
2. **Verify PDF generation** completes without errors
3. **Check server logs** for any map API call errors
4. **Confirm user access levels** can properly load candidate vs FO cases
5. **Deploy to staging** for full integration testing

---

## Rollback Plan

If needed to revert:
1. Remove conditional in ViewDetailsModal.js line 797: Change `{!verification?.fieldOfficerId && (` to `{(`
2. Remove conditional in downloadController.js line 416: Change `if (isCandidateSubmission) {` to `if (uploadedLat && uploadedLng...`
3. Restore duplicate `isCandidateSubmission` declaration at line ~462

However, reverting will show location maps to FO officers during their verification process, which may not be desired.

---

## Summary

Location Comparison Map visibility is now **role-aware**:
- Candidates see their submitted location vs uploaded location
- Field Officers verify records without location map distraction
- Both types maintain full GPS data visibility in tables
- PDF downloads reflect the same visibility rules

This improves UX by showing relevant information to each user type and maintains audit clarity through the GPS data table that all verifications include.
