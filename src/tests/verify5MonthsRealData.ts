import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { parseAssignedDoctorsExcel, parseDailyReportExcel } from '../services/excelParser';
import { analyzeReport } from '../analysis/analyzeReport';
import { generateComplianceExcelWorkbook } from '../services/excelExporter';

function runMultiMonthVerification() {
  console.log('================================================================');
  console.log('REAL 5-MONTH DATASET VERIFICATION (PARESH - APR, MAY, JUL, AUG, SEP)');
  console.log('================================================================\n');

  const mclPath = path.resolve('Docs/GUJ, MP,CG -DHARMESH SETH/PARESH MCL LIST.xlsx');
  const repPaths = [
    'Docs/New folder/GUJ, MP,CG -DHARMESH SETH/PARESH/Paresh Daily reporting April 2026.xlsx',
    'Docs/New folder/GUJ, MP,CG -DHARMESH SETH/PARESH/Paresh Daily reporting May 2026.xlsx',
    'Docs/New folder/GUJ, MP,CG -DHARMESH SETH/PARESH/Paresh Daily reporting July 2026.xlsx',
    'Docs/New folder/GUJ, MP,CG -DHARMESH SETH/PARESH/Aug Daily Report 2026-27.xlsx',
    'Docs/New folder/GUJ, MP,CG -DHARMESH SETH/PARESH/Paresh Daily reporting Sep 2026.xlsx',
  ].map(p => path.resolve(p));

  const mclBuffer = fs.readFileSync(mclPath);
  const mclResult = parseAssignedDoctorsExcel(mclBuffer);
  console.log(`Loaded ${mclResult.doctors.length} doctors from MCL list.`);

  const allActivities: any[] = [];
  repPaths.forEach((repPath, idx) => {
    const repBuffer = fs.readFileSync(repPath);
    const repResult = parseDailyReportExcel(repBuffer);
    console.log(`File ${idx + 1} (${path.basename(repPath)}): loaded ${repResult.activities.length} activities (Detected Period: ${repResult.detectedPeriod?.month} ${repResult.detectedPeriod?.year})`);
    allActivities.push(...repResult.activities);
  });

  console.log(`\nTotal aggregated activities across 5 files: ${allActivities.length}`);

  console.log('\nRunning analyzeReport in multi-month mode (six_months)...');
  const analysis = analyzeReport(
    mclResult.doctors,
    allActivities,
    { month: 'September', year: 2026 },
    'Paresh',
    {},
    'six_months'
  );

  console.log('\n================================================================');
  console.log('MULTI-MONTH ANALYSIS RESULTS:');
  console.log('================================================================');
  console.log(`Detected Months (${analysis.monthsList?.length}): ${analysis.monthsList?.join(', ')}`);

  console.log('\nCategory Summaries:');
  analysis.categorySummaries.forEach(cat => {
    console.log(`\nCategory ${cat.category}:`);
    console.log(`  Assigned Doctors:         ${cat.assignedDoctors}`);
    console.log(`  Drs Met (Unique):         ${cat.drsMet} (${cat.uniqueCoveragePct}%)`);
    console.log(`  Required Visits (5 mos):  ${cat.totalRequiredVisits}`);
    console.log(`  Actual Visits Done:       ${cat.totalVisitsDone}`);
    console.log(`  Visit Shortfall:          ${cat.visitShortfall}`);
    console.log(`  Fully Compliant Doctors:  ${cat.fullyCompliantDrs}`);
    console.log(`  Drs w/ Pending Months:    ${cat.drsWithPendingMonths}`);
    console.log(`  Pending Doctor-Months:    ${cat.pendingDoctorMonths} / ${cat.totalDoctorMonthSlots}`);
    console.log(`  Audit Remarks:            "${cat.auditRemarks}"`);
  });

  console.log('\nOverall Summary:');
  const ov = analysis.overallSummary;
  console.log(`  Total Assigned:           ${ov.totalAssigned}`);
  console.log(`  Total Unique Met:         ${ov.totalDrsMet} (${ov.overallCoveragePct}%)`);
  console.log(`  Total Required Visits:    ${ov.totalRequiredVisits}`);
  console.log(`  Total Visits Done:        ${ov.totalVisitsDone}`);
  console.log(`  Total Visit Shortfall:    ${ov.totalVisitShortfall}`);
  console.log(`  Total Fully Compliant:    ${ov.totalFullyCompliantDrs}`);
  console.log(`  Total w/ Pending Months:  ${ov.totalDrsWithPendingMonths}`);
  console.log(`  Total Pending Mo-Slots:   ${ov.totalPendingDoctorMonths} / ${ov.totalDoctorMonthSlots}`);
  console.log(`  Audit Remarks:            "${ov.auditRemarks}"`);

  console.log('\nGenerating 8-sheet Excel Workbook...');
  const wb = generateComplianceExcelWorkbook(analysis);
  console.log('Workbook Sheet Names:', wb.SheetNames);

  const outDir = path.resolve('src/tests/output');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'Paresh_5Month_Audit_Reconciled.xlsx');
  XLSX.writeFile(wb, outPath);
  console.log(`Successfully saved multi-month workbook to: ${outPath}`);
  console.log(`File size: ${fs.statSync(outPath).size} bytes`);
}

runMultiMonthVerification();
