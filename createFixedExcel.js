const XLSX = require('xlsx');

// Create sample data with PROPER column headers (with spaces, matching frontend expectations)
const sampleData = [
    {
        'Case Number': 'TEST2024-001',
        'First Name': 'Arjun',
        'Last Name': 'Patel',
        'Contact Number': '9123456789',
        'Email': 'arjun.patel@example.com',
        'Address': '45 Park Street, Kolkata',
        'State': 'West Bengal',
        'District': 'Kolkata',
        'Pincode': '700016'
    },
    {
        'Case Number': 'TEST2024-002',
        'First Name': 'Meera',
        'Last Name': 'Reddy',
        'Contact Number': '9234567890',
        'Email': 'meera.reddy@example.com',
        'Address': '78 Brigade Road, Bangalore',
        'State': 'Karnataka',
        'District': 'Bangalore Urban',
        'Pincode': '560001'
    },
    {
        'Case Number': 'TEST2024-003',
        'First Name': 'Vikram',
        'Last Name': 'Singh',
        'Contact Number': '9345678901',
        'Email': 'vikram.singh@example.com',
        'Address': '12 Connaught Place, New Delhi',
        'State': 'Delhi',
        'District': 'Central Delhi',
        'Pincode': '110001'
    },
    {
        'Case Number': 'TEST2024-004',
        'First Name': 'Ananya',
        'Last Name': 'Iyer',
        'Contact Number': '9456789012',
        'Email': 'ananya.iyer@example.com',
        'Address': '34 Anna Salai, Chennai',
        'State': 'Tamil Nadu',
        'District': 'Chennai',
        'Pincode': '600002'
    },
    {
        'Case Number': 'TEST2024-005',
        'First Name': 'Rohit',
        'Last Name': 'Sharma',
        'Contact Number': '9567890123',
        'Email': 'rohit.sharma@example.com',
        'Address': '56 Marine Drive, Mumbai',
        'State': 'Maharashtra',
        'District': 'Mumbai City',
        'Pincode': '400020'
    }
];

// Create workbook
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(sampleData);

// Set column widths
ws['!cols'] = [
    { wch: 18 },  // Case Number
    { wch: 15 },  // First Name
    { wch: 15 },  // Last Name
    { wch: 18 },  // Contact Number
    { wch: 25 },  // Email
    { wch: 30 },  // Address
    { wch: 15 },  // State
    { wch: 20 },  // District
    { wch: 10 }   // Pincode
];

XLSX.utils.book_append_sheet(wb, ws, 'Cases');
XLSX.writeFile(wb, 'TEST_UPLOAD_FIXED.xlsx');

console.log(' Fixed Excel file created: TEST_UPLOAD_FIXED.xlsx');
console.log(' Contains 5 test cases with proper column headers');
console.log(' Columns: Case Number, First Name, Last Name, Contact Number, Email, Address, State, District, Pincode');
