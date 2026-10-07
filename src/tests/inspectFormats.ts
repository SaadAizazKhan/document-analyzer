import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const files = [
  'Paresh Daily reporting May 2026.xlsx',
  'Aug Daily Report 2026-27.xlsx',
  'Paresh Daily reporting Sep 2026.xlsx',
  'Paresh Daily reporting July 2026.xlsx',
  'Paresh Daily reporting April 2026.xlsx',
];

const basePath = path.resolve('Docs/New folder/GUJ, MP,CG -DHARMESH SETH/PARESH');

for (const f of files) {
  const fullPath = path.join(basePath, f);
  console.log(`\n========================================`);
  console.log(`FILE: ${f}`);
  console.log(`========================================`);
  const buf = fs.readFileSync(fullPath);
  const wb = XLSX.read(buf, { type: 'buffer' });
  console.log('Sheets:', wb.SheetNames);

  for (const sName of wb.SheetNames) {
    const s = wb.Sheets[sName];
    const rows = XLSX.utils.sheet_to_json(s, { header: 1 }) as any[][];
    console.log(`\nSheet "${sName}": total rows = ${rows.length}`);
    for (let i = 0; i < Math.min(8, rows.length); i++) {
      console.log(`  Row ${i}:`, JSON.stringify(rows[i]));
    }
  }
}
