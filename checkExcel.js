const XLSX = require('xlsx');

// Read the generated file to see what columns it has
const wb = XLSX.readFile('TEST_UPLOAD.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);

console.log('Current columns:', Object.keys(data[0] || {}));
console.log('\nFirst row data:');
console.log(JSON.stringify(data[0], null, 2));
