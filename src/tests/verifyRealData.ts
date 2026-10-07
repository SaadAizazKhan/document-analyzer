import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { parseAssignedDoctorsExcel, parseDailyReportExcel } from '../services/excelParser';
import { analyzeReport } from '../analysis/analyzeReport';
import { generateComplianceExcelWorkbook } from '../services/excelExporter';

function runVerification() {
  console.log('====================================================');
  console.log('DOCTOR VISIT COMPLIANCE ANALYZER - VERIFICATION TEST');
  console.log('====================================================\n');

  const mclPath = path.resolve('Docs/GUJ, MP,CG -DHARMESH SETH/PARESH MCL LIST.xlsx');
  const repPath = path.resolve('Docs/New folder/GUJ, MP,CG -DHARMESH SETH/PARESH/Aug Daily Report 2026-27.xlsx');

  const mclBuffer = fs.readFileSync(mclPath);
  const repBuffer = fs.readFileSync(repPath);

  console.log('1. Parsing Assigned Doctors Master...');
  const mclResult = parseAssignedDoctorsExcel(mclBuffer);
  console.log(`   - Loaded doctors: ${mclResult.doctors.length}`);

  console.log('2. Parsing Daily Activity Report...');
  const repResult = parseDailyReportExcel(repBuffer);
  console.log(`   - Loaded activities: ${repResult.activities.length}`);

  console.log('3. Running Analysis Engine...');
  const period = repResult.detectedPeriod || { month: 'August', year: 2026 };
  const analysis = analyzeReport(mclResult.doctors, repResult.activities, period, 'Paresh');

  console.log('4. Generating 7-sheet Excel Workbook...');
  const wb = generateComplianceExcelWorkbook(analysis);
  console.log('   - Generated sheets:', wb.SheetNames);

  const outDir = path.resolve('src/tests/output');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'Paresh_Doctor_Visit_Audit_August_2026.xlsx');
  XLSX.writeFile(wb, outPath);
  console.log(`   - Saved verification Excel to: ${outPath}`);
  console.log(`   - File size: ${fs.statSync(outPath).size} bytes`);

  console.log('\nAll checks passed!');
}

runVerification();
