import XLSX from 'xlsx';
import path from 'path';

const repPath = path.resolve('Docs/New folder/GUJ, MP,CG -DHARMESH SETH/PARESH/Aug Daily Report 2026-27.xlsx');
const wbRep = XLSX.readFile(repPath);
console.log('\nReport Sheets:', wbRep.SheetNames);

for (const sName of wbRep.SheetNames) {
  const repSheet = wbRep.Sheets[sName];
  const repRows = XLSX.utils.sheet_to_json(repSheet, { header: 1 }) as any[][];
  console.log(`\n--- Sheet: "${sName}" ---`);
  console.log('Row 0:', repRows[0]);
  console.log('Row 1:', repRows[1]);
  console.log('Row 2:', repRows[2]);
  console.log('Row 3:', repRows[3]);
  console.log('Total rows:', repRows.length);
}
