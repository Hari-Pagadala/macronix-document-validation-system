const ExcelJS = require('exceljs');
const path = require('path');

async function createExcelTemplate() {
    try {
        // Check if ExcelJS is available
        console.log('Creating Excel template...');
        
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

        // Add headers
        const headerRow = worksheet.addRow(headers);
        headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } };
        headerRow.alignment = { horizontal: 'center', vertical: 'center' };

        // Sample data
        const sampleData = [
            ['CASE-001', 'Rajesh', 'Kumar', '9876543210', 'rajesh.kumar@email.com', '123 Main Street Apt 5', 'Maharashtra', 'Mumbai', '400001'],
            ['CASE-002', 'Priya', 'Singh', '9876543211', 'priya.singh@email.com', '456 Oak Avenue', 'Karnataka', 'Bangalore', '560001'],
            ['CASE-003', 'Amit', 'Patel', '9876543212', 'amit.patel@email.com', '789 Elm Road', 'Gujarat', 'Ahmedabad', '380001'],
            ['CASE-004', 'Neha', 'Sharma', '9876543213', 'neha.sharma@email.com', '321 Pine Lane', 'Delhi', 'Central Delhi', '110001'],
            ['CASE-005', 'Vikram', 'Desai', '9876543214', 'vikram.desai@email.com', '654 Maple Drive', 'Telangana', 'Hyderabad', '500001'],
            ['CASE-006', 'Anjali', 'Gupta', '9876543215', 'anjali.gupta@email.com', '987 Cedar Street', 'Uttar Pradesh', 'Lucknow', '226001'],
            ['CASE-007', 'Rohan', 'Nair', '9876543216', 'rohan.nair@email.com', '147 Birch Road', 'Kerala', 'Kochi', '682001'],
            ['CASE-008', 'Divya', 'Menon', '9876543217', 'divya.menon@email.com', '258 Spruce Avenue', 'Tamil Nadu', 'Chennai', '600001'],
            ['CASE-009', 'Sanjay', 'Reddy', '9876543218', 'sanjay.reddy@email.com', '369 Walnut Lane', 'Andhra Pradesh', 'Visakhapatnam', '530001'],
            ['CASE-010', 'Pooja', 'Verma', '9876543219', 'pooja.verma@email.com', '741 Ash Drive', 'Rajasthan', 'Jaipur', '302001'],
        ];

        // Add data rows
        sampleData.forEach((rowData) => {
            worksheet.addRow(rowData);
        });

        // Set column widths
        const columnWidths = [15, 12, 12, 15, 25, 30, 15, 15, 12];
        columnWidths.forEach((width, index) => {
            worksheet.getColumn(index + 1).width = width;
        });

        // Save the workbook
        const outputPath = path.join(__dirname, 'SAMPLE_CASES.xlsx');
        await workbook.xlsx.writeFile(outputPath);
        
        console.log('✅ Excel file created successfully: SAMPLE_CASES.xlsx');
        console.log('📊 Sample data includes 10 test cases (CASE-001 to CASE-010)');
        console.log('📌 Ready to upload to the system!');
    } catch (error) {
        console.error('Error creating Excel file:', error.message);
        if (error.code === 'MODULE_NOT_FOUND') {
            console.log('\n⚠️  ExcelJS not installed. Installing...');
            const { execSync } = require('child_process');
            try {
                execSync('npm install exceljs', { stdio: 'inherit' });
                console.log('\n✅ ExcelJS installed. Please run this script again.');
            } catch (e) {
                console.error('Failed to install ExcelJS:', e.message);
            }
        }
    }
}

createExcelTemplate();
