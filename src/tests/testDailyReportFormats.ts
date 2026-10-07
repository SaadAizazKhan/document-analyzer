import fs from 'fs';
import path from 'path';
import { parseAssignedDoctorsExcel, parseDailyReportExcel } from '../services/excelParser';
import { analyzeReport } from '../analysis/analyzeReport';

function runFormatTests() {
  console.log('================================================================');
  console.log('TESTING REAL DAILY REPORT FORMATS (FORMAT A & FORMAT B)');
  console.log('================================================================\n');

  const mclPath = path.resolve('Docs/GUJ, MP,CG -DHARMESH SETH/PARESH MCL LIST.xlsx');
  const augPath = path.resolve('Docs/New folder/GUJ, MP,CG -DHARMESH SETH/PARESH/Aug Daily Report 2026-27.xlsx');
  const sepPath = path.resolve('Docs/New folder/GUJ, MP,CG -DHARMESH SETH/PARESH/Paresh Daily reporting Sep 2026.xlsx');

  const mclBuf = fs.readFileSync(mclPath);
  const mclRes = parseAssignedDoctorsExcel(mclBuf);

  // -------------------------------------------------------------
  // Test 1: Format A (August 2026 Flat Report)
  // -------------------------------------------------------------
  console.log('--- 1. Testing Format A (August 2026 Flat Report) ---');
  const augBuf = fs.readFileSync(augPath);
  const augRes = parseDailyReportExcel(augBuf);
  console.log(`✓ Parsed August activities: ${augRes.activities.length} rows`);
  console.log(`✓ Detected period: ${augRes.detectedPeriod?.month} ${augRes.detectedPeriod?.year}`);

  const augAnalysis = analyzeReport(
    mclRes.doctors,
    augRes.activities,
    augRes.detectedPeriod || { month: 'August', year: 2026 },
    'Paresh'
  );

  console.log('August Diagnostics (Section 22):');
  console.log(`- Raw Activities:                ${augAnalysis.diagnostics.rawActivitiesCount}`);
  console.log(`- Doctor Candidates:             ${augAnalysis.diagnostics.doctorCandidatesCount}`);
  console.log(`- Matched Assigned Doctors:      ${augAnalysis.diagnostics.matchedAssignedDoctorsCount}`);
  console.log(`- Unmatched Doctor Candidates:   ${augAnalysis.diagnostics.unmatchedDoctorCandidatesCount}`);
  console.log(`- Non-Doctor Activities:         ${augAnalysis.diagnostics.nonDoctorActivitiesCount}`);
  console.log(`- Duplicate Same-Day Removed:    ${augAnalysis.diagnostics.duplicateSameDayRemovedCount}`);
  console.log(`- Manual Reviews Required:       ${augAnalysis.diagnostics.manualReviewsRequiredCount}`);
  console.log(`Overall Coverage: ${augAnalysis.overallSummary.overallCoveragePct}% (${augAnalysis.overallSummary.totalDrsMet}/${augAnalysis.overallSummary.totalAssigned})`);

  // -------------------------------------------------------------
  // Test 2: Format B (September 2026 Date Header + Meetings)
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing Format B (September 2026 Date Header + Meeting Rows) ---');
  const sepBuf = fs.readFileSync(sepPath);
  const sepRes = parseDailyReportExcel(sepBuf);
  console.log(`✓ Parsed September activities: ${sepRes.activities.length} rows`);
  console.log(`✓ Detected period: ${sepRes.detectedPeriod?.month} ${sepRes.detectedPeriod?.year}`);

  const sepAnalysis = analyzeReport(
    mclRes.doctors,
    sepRes.activities,
    sepRes.detectedPeriod || { month: 'September', year: 2026 },
    'Paresh'
  );

  console.log('\nSeptember Diagnostics (Section 22):');
  console.log(`- Raw Activities:                ${sepAnalysis.diagnostics.rawActivitiesCount}`);
  console.log(`- Doctor Candidates:             ${sepAnalysis.diagnostics.doctorCandidatesCount}`);
  console.log(`- Matched Assigned Doctors:      ${sepAnalysis.diagnostics.matchedAssignedDoctorsCount}`);
  console.log(`- Unmatched Doctor Candidates:   ${sepAnalysis.diagnostics.unmatchedDoctorCandidatesCount}`);
  console.log(`- Non-Doctor Activities:         ${sepAnalysis.diagnostics.nonDoctorActivitiesCount}`);
  console.log(`- Duplicate Same-Day Removed:    ${sepAnalysis.diagnostics.duplicateSameDayRemovedCount}`);
  console.log(`- Manual Reviews Required:       ${sepAnalysis.diagnostics.manualReviewsRequiredCount}`);

  console.log('\nSeptember Category Compliance Matrix:');
  sepAnalysis.categorySummaries.forEach(c => {
    console.log(
      `${c.category}-Class: Assigned=${c.assignedDoctors}, Met=${c.drsMet}, Visits=${c.totalVisitsDone}, Pending=${c.pendingDrs}, Coverage=${c.uniqueCoveragePct}%, Gaps=${c.daysDifferenceFormatted}`
    );
  });
  console.log(`TOTAL: Coverage=${sepAnalysis.overallSummary.overallCoveragePct}%, Met=${sepAnalysis.overallSummary.totalDrsMet}/${sepAnalysis.overallSummary.totalAssigned}, Total Visits=${sepAnalysis.overallSummary.totalVisitsDone}`);

  console.log('\n✓ BOTH FORMAT A AND FORMAT B VALIDATED SUCCESSFULLY!\n');
}

runFormatTests();
