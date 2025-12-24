const XLSX = require('xlsx');

// Create sample data with unique case numbers
const sampleData = [
    {
        caseNumber: 'TEST2024-001',
        firstName: 'Arjun',
        lastName: 'Patel',
        contactNumber: '9123456789',
        email: 'arjun.patel@example.com',
        address: '45 Park Street, Kolkata',
        state: 'West Bengal',
        district: 'Kolkata',
        pincode: '700016'
    },
    {
        caseNumber: 'TEST2024-002',
        firstName: 'Meera',
        lastName: 'Reddy',
        contactNumber: '9234567890',
        email: 'meera.reddy@example.com',
        address: '78 Brigade Road, Bangalore',
        state: 'Karnataka',
        district: 'Bangalore Urban',
        pincode: '560001'
    },
    {
        caseNumber: 'TEST2024-003',
        firstName: 'Vikram',
        lastName: 'Singh',
        contactNumber: '9345678901',
        email: 'vikram.singh@example.com',
        address: '12 Connaught Place, New Delhi',
        state: 'Delhi',
        district: 'Central Delhi',
        pincode: '110001'
    },
    {
        caseNumber: 'TEST2024-004',
        firstName: 'Ananya',
        lastName: 'Iyer',
        contactNumber: '9456789012',
        email: 'ananya.iyer@example.com',
        address: '34 Anna Salai, Chennai',
        state: 'Tamil Nadu',
        district: 'Chennai',
        pincode: '600002'
    },
    {
        caseNumber: 'TEST2024-005',
        firstName: 'Rohit',
        lastName: 'Sharma',
        contactNumber: '9567890123',
        email: 'rohit.sharma@example.com',
        address: '56 Marine Drive, Mumbai',
        state: 'Maharashtra',
        district: 'Mumbai City',
        pincode: '400020'
    }
];

// Create workbook
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(sampleData);

// Set column widths
ws['!cols'] = [
    { wch: 15 },  // caseNumber
    { wch: 15 },  // firstName
    { wch: 15 },  // lastName
    { wch: 15 },  // contactNumber
    { wch: 25 },  // email
    { wch: 30 },  // address
    { wch: 15 },  // state
    { wch: 20 },  // district
    { wch: 10 }   // pincode
];

XLSX.utils.book_append_sheet(wb, ws, 'Cases');
XLSX.writeFile(wb, 'TEST_UPLOAD.xlsx');

console.log(' New test file created: TEST_UPLOAD.xlsx');
console.log(' Contains 5 unique test cases (TEST2024-001 to TEST2024-005)');
