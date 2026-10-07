import fs from 'fs';
import * as XLSX from 'xlsx';

const buf = fs.readFileSync('Docs/New folder/GUJ, MP,CG -DHARMESH SETH/PARESH/Paresh Daily reporting May 2026.xlsx');
const wb = XLSX.read(buf, { type: 'buffer' });
console.log('Sheets in May file:', wb.SheetNames);
for (const sName of wb.SheetNames) {
  const s = wb.Sheets[sName];
  const rows = XLSX.utils.sheet_to_json(s, { header: 1 }) as any[][];
  console.log('Sheet', sName, 'rows:', rows.length);
  for (let i = 0; i < Math.min(15, rows.length); i++) {
    console.log(`  Row ${i}:`, JSON.stringify(rows[i]));
  }
}
