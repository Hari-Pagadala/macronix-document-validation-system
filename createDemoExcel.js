const ExcelJS = require('exceljs');
const path = require('path');

async function createDemoExcel() {
    try {
        console.log('Creating Demo Excel file...');
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Cases');

        // Define headers
        const headers = [
            'Case Number',
            'First Name',
            'Last Name',
            'Contact Number',
            'Email',
            'Address',
            'State',
            'District',
            'Pincode'
        ];

        // Add headers with styling
        const headerRow = worksheet.addRow(headers);
        headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } };
        headerRow.alignment = { horizontal: 'center', vertical: 'center' };

        // Demo data with different cases
        const demoData = [
            ['DEMO-001', 'Arjun', 'Malhotra', '9123456780', 'arjun.malhotra@demo.com', '12 Brigade Road', 'Karnataka', 'Bangalore', '560025'],
            ['DEMO-002', 'Kavya', 'Iyer', '9123456781', 'kavya.iyer@demo.com', '45 Marina Beach Road', 'Tamil Nadu', 'Chennai', '600013'],
            ['DEMO-003', 'Rahul', 'Kapoor', '9123456782', 'rahul.kapoor@demo.com', '78 Connaught Place', 'Delhi', 'New Delhi', '110001'],
            ['DEMO-004', 'Meera', 'Joshi', '9123456783', 'meera.joshi@demo.com', '23 MG Road', 'Maharashtra', 'Pune', '411001'],
            ['DEMO-005', 'Karan', 'Bhatia', '9123456784', 'karan.bhatia@demo.com', '56 Park Street', 'West Bengal', 'Kolkata', '700016'],
            ['DEMO-006', 'Sneha', 'Agarwal', '9123456785', 'sneha.agarwal@demo.com', '89 Civil Lines', 'Uttar Pradesh', 'Agra', '282002'],
            ['DEMO-007', 'Nikhil', 'Chopra', '9123456786', 'nikhil.chopra@demo.com', '34 Residency Road', 'Madhya Pradesh', 'Indore', '452001'],
            ['DEMO-008', 'Aarti', 'Kulkarni', '9123456787', 'aarti.kulkarni@demo.com', '67 FC Road', 'Maharashtra', 'Pune', '411004'],
            ['DEMO-009', 'Varun', 'Pillai', '9123456788', 'varun.pillai@demo.com', '90 MG Road', 'Kerala', 'Ernakulam', '682016'],
            ['DEMO-010', 'Ishita', 'Bansal', '9123456789', 'ishita.bansal@demo.com', '12 Sector 17', 'Haryana', 'Gurgaon', '122001'],
            ['DEMO-011', 'Aditya', 'Shah', '9123456790', 'aditya.shah@demo.com', '45 CG Road', 'Gujarat', 'Ahmedabad', '380009'],
            ['DEMO-012', 'Riya', 'Rao', '9123456791', 'riya.rao@demo.com', '78 Banjara Hills', 'Telangana', 'Hyderabad', '500034'],
            ['DEMO-013', 'Siddharth', 'Mishra', '9123456792', 'siddharth.mishra@demo.com', '23 Hazratganj', 'Uttar Pradesh', 'Lucknow', '226001'],
            ['DEMO-014', 'Tanvi', 'Shetty', '9123456793', 'tanvi.shetty@demo.com', '56 MG Road', 'Karnataka', 'Mangalore', '575001'],
            ['DEMO-015', 'Abhishek', 'Saxena', '9123456794', 'abhishek.saxena@demo.com', '89 MI Road', 'Rajasthan', 'Jaipur', '302001'],
        ];

        // Add data rows
        demoData.forEach((rowData) => {
            worksheet.addRow(rowData);
        });

        // Set column widths for better readability
        const columnWidths = [15, 12, 12, 15, 30, 30, 15, 15, 12];
        columnWidths.forEach((width, index) => {
            worksheet.getColumn(index + 1).width = width;
        });

        // Add borders to all cells
        worksheet.eachRow((row, rowNumber) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });

        // Save the workbook
        const outputPath = path.join(__dirname, 'DEMO_CASES.xlsx');
        await workbook.xlsx.writeFile(outputPath);
        
        console.log('✅ Demo Excel file created successfully: DEMO_CASES.xlsx');
        console.log('📊 Contains 15 demo cases (DEMO-001 to DEMO-015)');
        console.log('📍 Covers multiple states and cities across India');
        console.log('📌 Ready to upload for testing!');
    } catch (error) {
        console.error('❌ Error creating Excel file:', error.message);
        if (error.code === 'MODULE_NOT_FOUND') {
            console.log('\n⚠️  ExcelJS not installed. Installing...');
            const { execSync } = require('child_process');
            try {
                execSync('npm install exceljs', { stdio: 'inherit', cwd: __dirname });
                console.log('\n✅ ExcelJS installed. Please run this script again.');
            } catch (e) {
                console.error('Failed to install ExcelJS:', e.message);
            }
        }
    }
}

createDemoExcel();
