import { AssignedDoctor, NormalizedActivity } from '../types/analyzer';
import { analyzeReport } from '../analysis/analyzeReport';
import { normalizeDailyActivities } from '../analysis/activityNormalizer';
import { normalizeDoctorName } from '../analysis/normalizeDoctorName';
import { generateComplianceExcelWorkbook } from '../services/excelExporter';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`FAIL: ${msg}`);
  }
  console.log(`✓ PASS: ${msg}`);
}

export function runDetailedSummary6MonthTests() {
  console.log('=====================================================');
  console.log('RUNNING DETAILED 6-MONTH MANAGEMENT SUMMARY TEST SUITE');
  console.log('=====================================================\n');

  // Master Doctor List
  const docABC: AssignedDoctor = {
    id: 'DOC_ABC',
    srNo: 1,
    city: 'Ahmedabad',
    rawName: 'Doctor ABC',
    normalizedName: normalizeDoctorName('Doctor ABC'),
    hospital: 'Apollo Hospital',
    category: 'A',
  };

  const docXYZ: AssignedDoctor = {
    id: 'DOC_XYZ',
    srNo: 2,
    city: 'Ahmedabad',
    rawName: 'Doctor XYZ',
    normalizedName: normalizeDoctorName('Doctor XYZ'),
    hospital: 'Sterling Hospital',
    category: 'A',
  };

  const docB1: AssignedDoctor = {
    id: 'DOC_B1',
    srNo: 3,
    city: 'Surat',
    rawName: 'Doctor B One',
    normalizedName: normalizeDoctorName('Doctor B One'),
    hospital: 'Surat Civil Hospital',
    category: 'B',
  };

  const docC1: AssignedDoctor = {
    id: 'DOC_C1',
    srNo: 4,
    city: 'Vadodara',
    rawName: 'Doctor C One',
    normalizedName: normalizeDoctorName('Doctor C One'),
    hospital: 'SSG Hospital',
    category: 'C',
  };

  const assignedDoctors: AssignedDoctor[] = [docABC, docXYZ, docB1, docC1];

  // =========================================================================
  // 1. Acceptance Test 1 (Section 29) & Acceptance Test 2 (Section 30)
  // =========================================================================
  // Doctor ABC:
  // April: 11 and 27 (2 visits) -> 2/2 ✓
  // May: 24 (1 visit) -> 1/2 P
  // June: 5 (1 visit) -> 1/2 P
  // July: 5 and 20 (2 visits) -> 2/2 ✓
  // August: 14 and 25 (2 visits) -> 2/2 ✓
  // September: 3 (1 visit) -> 1/2 P
  //
  // Doctor XYZ:
  // April: 1 (1 visit) -> 1/2 P
  // May: 2, 10, 20 (3 visits) -> 3/2 ✓
  // June: 5, 20 (2 visits) -> 2/2 ✓
  // July: 8, 22 (2 visits) -> 2/2 ✓
  // August: 12, 26 (2 visits) -> 2/2 ✓
  // September: 10, 25 (2 visits) -> 2/2 ✓
  // Total = 12 visits, but April is 1/2 -> Pending, so Fully Compliant = NO!
  //
  // Doctor B1:
  // Apr: 1, May: 1, Jun: 1, Jul: 1, Aug: 1, Sep: 1 (6 visits) -> 1/1 ✓ in all 6 months -> Fully Compliant = YES!
  //
  // Doctor C1:
  // Visited in May and August -> Rotational compliant!
  //
  // Unlisted Doctor:
  // Dr NonMaster visited on 2026-05-15 and 2026-07-10 (2 visits)

  const activities: NormalizedActivity[] = [
    // Doctor ABC
    { id: '1', date: '2026-04-11', parsedDate: new Date('2026-04-11'), customerNames: ['Doctor ABC'], originalCustomerText: 'Doctor ABC', activityType: 'DOCTOR_VISIT', sourceRowNumber: 1 },
    { id: '2', date: '2026-04-27', parsedDate: new Date('2026-04-27'), customerNames: ['Doctor ABC'], originalCustomerText: 'Doctor ABC', activityType: 'DOCTOR_VISIT', sourceRowNumber: 2 },
    { id: '3', date: '2026-05-24', parsedDate: new Date('2026-05-24'), customerNames: ['Doctor ABC'], originalCustomerText: 'Doctor ABC', activityType: 'DOCTOR_VISIT', sourceRowNumber: 3 },
    { id: '4', date: '2026-06-05', parsedDate: new Date('2026-06-05'), customerNames: ['Doctor ABC'], originalCustomerText: 'Doctor ABC', activityType: 'DOCTOR_VISIT', sourceRowNumber: 4 },
    { id: '5', date: '2026-07-05', parsedDate: new Date('2026-07-05'), customerNames: ['Doctor ABC'], originalCustomerText: 'Doctor ABC', activityType: 'DOCTOR_VISIT', sourceRowNumber: 5 },
    { id: '6', date: '2026-07-20', parsedDate: new Date('2026-07-20'), customerNames: ['Doctor ABC'], originalCustomerText: 'Doctor ABC', activityType: 'DOCTOR_VISIT', sourceRowNumber: 6 },
    { id: '7', date: '2026-08-14', parsedDate: new Date('2026-08-14'), customerNames: ['Doctor ABC'], originalCustomerText: 'Doctor ABC', activityType: 'DOCTOR_VISIT', sourceRowNumber: 7 },
    { id: '8', date: '2026-08-25', parsedDate: new Date('2026-08-25'), customerNames: ['Doctor ABC'], originalCustomerText: 'Doctor ABC', activityType: 'DOCTOR_VISIT', sourceRowNumber: 8 },
    { id: '9', date: '2026-09-03', parsedDate: new Date('2026-09-03'), customerNames: ['Doctor ABC'], originalCustomerText: 'Doctor ABC', activityType: 'DOCTOR_VISIT', sourceRowNumber: 9 },

    // Doctor XYZ
    { id: '10', date: '2026-04-15', parsedDate: new Date('2026-04-15'), customerNames: ['Doctor XYZ'], originalCustomerText: 'Doctor XYZ', activityType: 'DOCTOR_VISIT', sourceRowNumber: 10 },
    { id: '11', date: '2026-05-02', parsedDate: new Date('2026-05-02'), customerNames: ['Doctor XYZ'], originalCustomerText: 'Doctor XYZ', activityType: 'DOCTOR_VISIT', sourceRowNumber: 11 },
    { id: '12', date: '2026-05-10', parsedDate: new Date('2026-05-10'), customerNames: ['Doctor XYZ'], originalCustomerText: 'Doctor XYZ', activityType: 'DOCTOR_VISIT', sourceRowNumber: 12 },
    { id: '13', date: '2026-05-20', parsedDate: new Date('2026-05-20'), customerNames: ['Doctor XYZ'], originalCustomerText: 'Doctor XYZ', activityType: 'DOCTOR_VISIT', sourceRowNumber: 13 },
    { id: '14', date: '2026-06-05', parsedDate: new Date('2026-06-05'), customerNames: ['Doctor XYZ'], originalCustomerText: 'Doctor XYZ', activityType: 'DOCTOR_VISIT', sourceRowNumber: 14 },
    { id: '15', date: '2026-06-20', parsedDate: new Date('2026-06-20'), customerNames: ['Doctor XYZ'], originalCustomerText: 'Doctor XYZ', activityType: 'DOCTOR_VISIT', sourceRowNumber: 15 },
    { id: '16', date: '2026-07-08', parsedDate: new Date('2026-07-08'), customerNames: ['Doctor XYZ'], originalCustomerText: 'Doctor XYZ', activityType: 'DOCTOR_VISIT', sourceRowNumber: 16 },
    { id: '17', date: '2026-07-22', parsedDate: new Date('2026-07-22'), customerNames: ['Doctor XYZ'], originalCustomerText: 'Doctor XYZ', activityType: 'DOCTOR_VISIT', sourceRowNumber: 17 },
    { id: '18', date: '2026-08-12', parsedDate: new Date('2026-08-12'), customerNames: ['Doctor XYZ'], originalCustomerText: 'Doctor XYZ', activityType: 'DOCTOR_VISIT', sourceRowNumber: 18 },
    { id: '19', date: '2026-08-26', parsedDate: new Date('2026-08-26'), customerNames: ['Doctor XYZ'], originalCustomerText: 'Doctor XYZ', activityType: 'DOCTOR_VISIT', sourceRowNumber: 19 },
    { id: '20', date: '2026-09-10', parsedDate: new Date('2026-09-10'), customerNames: ['Doctor XYZ'], originalCustomerText: 'Doctor XYZ', activityType: 'DOCTOR_VISIT', sourceRowNumber: 20 },
    { id: '21', date: '2026-09-25', parsedDate: new Date('2026-09-25'), customerNames: ['Doctor XYZ'], originalCustomerText: 'Doctor XYZ', activityType: 'DOCTOR_VISIT', sourceRowNumber: 21 },

    // Doctor B1 (all 6 months met)
    { id: '22', date: '2026-04-18', parsedDate: new Date('2026-04-18'), customerNames: ['Doctor B One'], originalCustomerText: 'Doctor B One', activityType: 'DOCTOR_VISIT', sourceRowNumber: 22 },
    { id: '23', date: '2026-05-18', parsedDate: new Date('2026-05-18'), customerNames: ['Doctor B One'], originalCustomerText: 'Doctor B One', activityType: 'DOCTOR_VISIT', sourceRowNumber: 23 },
    { id: '24', date: '2026-06-18', parsedDate: new Date('2026-06-18'), customerNames: ['Doctor B One'], originalCustomerText: 'Doctor B One', activityType: 'DOCTOR_VISIT', sourceRowNumber: 24 },
    { id: '25', date: '2026-07-18', parsedDate: new Date('2026-07-18'), customerNames: ['Doctor B One'], originalCustomerText: 'Doctor B One', activityType: 'DOCTOR_VISIT', sourceRowNumber: 25 },
    { id: '26', date: '2026-08-18', parsedDate: new Date('2026-08-18'), customerNames: ['Doctor B One'], originalCustomerText: 'Doctor B One', activityType: 'DOCTOR_VISIT', sourceRowNumber: 26 },
    { id: '27', date: '2026-09-18', parsedDate: new Date('2026-09-18'), customerNames: ['Doctor B One'], originalCustomerText: 'Doctor B One', activityType: 'DOCTOR_VISIT', sourceRowNumber: 27 },

    // Doctor C1
    { id: '28', date: '2026-05-10', parsedDate: new Date('2026-05-10'), customerNames: ['Doctor C One'], originalCustomerText: 'Doctor C One', activityType: 'DOCTOR_VISIT', sourceRowNumber: 28 },
    { id: '29', date: '2026-08-10', parsedDate: new Date('2026-08-10'), customerNames: ['Doctor C One'], originalCustomerText: 'Doctor C One', activityType: 'DOCTOR_VISIT', sourceRowNumber: 29 },

    // Unlisted Doctor (Outside assigned master)
    { id: '30', date: '2026-05-15', parsedDate: new Date('2026-05-15'), customerNames: ['Dr NonMaster Person'], originalCustomerText: 'Dr NonMaster Person', activityType: 'DOCTOR_VISIT', sourceRowNumber: 30 },
    { id: '31', date: '2026-07-10', parsedDate: new Date('2026-07-10'), customerNames: ['Dr NonMaster Person'], originalCustomerText: 'Dr NonMaster Person', activityType: 'DOCTOR_VISIT', sourceRowNumber: 31 },
  ];

  const result = analyzeReport(
    assignedDoctors,
    activities,
    { month: 'April', year: 2026 },
    'Paresh',
    {},
    'six_months'
  );

  console.log('\n--- VERIFYING SECTION 29 ACCEPTANCE TEST (Doctor ABC) ---');
  const abcRecord = result.sixMonthRecords?.find(r => r.doctor.id === 'DOC_ABC');
  assert(abcRecord !== undefined, 'Doctor ABC record found in sixMonthRecords');
  assert(abcRecord!.requiredVisits === 12, `Doctor ABC requiredVisits = 12 (actual: ${abcRecord?.requiredVisits})`);
  assert(abcRecord!.totalVisits === 9, `Doctor ABC totalVisits = 9 (actual: ${abcRecord?.totalVisits})`);
  assert(abcRecord!.monthsAchieved === 3, `Doctor ABC monthsAchieved = 3 (actual: ${abcRecord?.monthsAchieved})`);
  assert(abcRecord!.monthsPending === 3, `Doctor ABC monthsPending = 3 (actual: ${abcRecord?.monthsPending})`);
  assert(abcRecord!.overallEvaluation === 'Partially Compliant', `Doctor ABC overallEvaluation is Partially Compliant (not Fully Compliant)`);

  // Verify monthly symbols for Doctor ABC
  const abcMonthly = abcRecord!.monthlyRecords;
  assert(abcMonthly['2026-04']?.cellDisplay.includes('2/2 ✓'), `Apr cellDisplay contains "2/2 ✓" (${abcMonthly['2026-04']?.cellDisplay})`);
  assert(abcMonthly['2026-05']?.cellDisplay.includes('1/2 P'), `May cellDisplay contains "1/2 P" (${abcMonthly['2026-05']?.cellDisplay})`);
  assert(abcMonthly['2026-06']?.cellDisplay.includes('1/2 P'), `Jun cellDisplay contains "1/2 P" (${abcMonthly['2026-06']?.cellDisplay})`);
  assert(abcMonthly['2026-07']?.cellDisplay.includes('2/2 ✓'), `Jul cellDisplay contains "2/2 ✓" (${abcMonthly['2026-07']?.cellDisplay})`);
  assert(abcMonthly['2026-08']?.cellDisplay.includes('2/2 ✓'), `Aug cellDisplay contains "2/2 ✓" (${abcMonthly['2026-08']?.cellDisplay})`);
  assert(abcMonthly['2026-09']?.cellDisplay.includes('1/2 P'), `Sep cellDisplay contains "1/2 P" (${abcMonthly['2026-09']?.cellDisplay})`);

  console.log('\n--- VERIFYING SECTION 30 ACCEPTANCE TEST (Doctor XYZ) ---');
  const xyzRecord = result.sixMonthRecords?.find(r => r.doctor.id === 'DOC_XYZ');
  assert(xyzRecord !== undefined, 'Doctor XYZ record found in sixMonthRecords');
  assert(xyzRecord!.requiredVisits === 12, `Doctor XYZ requiredVisits = 12 (actual: ${xyzRecord?.requiredVisits})`);
  assert(xyzRecord!.totalVisits === 12, `Doctor XYZ totalVisits = 12 (actual: ${xyzRecord?.totalVisits})`);
  assert(xyzRecord!.monthsAchieved === 5, `Doctor XYZ monthsAchieved = 5 (actual: ${xyzRecord?.monthsAchieved})`);
  assert(xyzRecord!.monthsPending === 1, `Doctor XYZ monthsPending = 1 (April was 1/2) (actual: ${xyzRecord?.monthsPending})`);
  assert(xyzRecord!.overallEvaluation === 'Partially Compliant', `Doctor XYZ is Partially Compliant (not Fully Compliant, extra May visits do not compensate April)`);

  console.log('\n--- VERIFYING SECTION 10 & 31 PRIMARY MANAGEMENT TABLE ---');
  const mgmtRows = result.managementSummaryRows;
  assert(mgmtRows !== undefined && mgmtRows.length === 5, '5 rows present in Management Summary Table');

  const rowA = mgmtRows!.find(r => r.categoryKey === 'Class A')!;
  assert(rowA.totalDoctors === 2, `Class A totalDoctors = 2`);
  assert(rowA.uniqueDoctorsVisited === 2, `Class A uniqueDoctorsVisited = 2`);
  assert(rowA.fullyCompliant === 0, `Class A fullyCompliant = 0`);
  assert(rowA.doctorsBelowTarget === 2, `Class A doctorsBelowTarget = 2`);
  assert(rowA.visitsRequired === 24, `Class A visitsRequired = 24 (2 docs * 6 mos * 2) (actual: ${rowA.visitsRequired})`);
  assert(rowA.visitsCompleted === 21, `Class A visitsCompleted = 21 (9 + 12) (actual: ${rowA.visitsCompleted})`);
  assert(rowA.visitGap === -3, `Class A visitGap = -3 (actual: ${rowA.visitGap})`);
  assert(rowA.visitGapFormatted === '-3', `Class A visitGapFormatted = "-3"`);
  assert(rowA.targetAchievementFormatted === '87.5%', `Class A achievement % = 87.5% (21/24) (actual: ${rowA.targetAchievementFormatted})`);

  const rowB = mgmtRows!.find(r => r.categoryKey === 'Class B')!;
  assert(rowB.totalDoctors === 1, `Class B totalDoctors = 1`);
  assert(rowB.uniqueDoctorsVisited === 1, `Class B uniqueDoctorsVisited = 1`);
  assert(rowB.fullyCompliant === 1, `Class B fullyCompliant = 1`);
  assert(rowB.doctorsBelowTarget === 0, `Class B doctorsBelowTarget = 0`);
  assert(rowB.visitsRequired === 6, `Class B visitsRequired = 6 (actual: ${rowB.visitsRequired})`);
  assert(rowB.visitsCompleted === 6, `Class B visitsCompleted = 6 (actual: ${rowB.visitsCompleted})`);
  assert(rowB.visitGap === 0, `Class B visitGap = 0 (actual: ${rowB.visitGap})`);
  assert(rowB.targetAchievementFormatted === '100.0%', `Class B achievement % = 100.0%`);

  const rowC = mgmtRows!.find(r => r.categoryKey === 'Class C')!;
  assert(rowC.totalDoctors === 1, `Class C totalDoctors = 1`);
  assert(rowC.uniqueDoctorsVisited === 1, `Class C uniqueDoctorsVisited = 1`);
  assert(rowC.fullyCompliant === 1, `Class C fullyCompliant = 1`);
  assert(rowC.doctorsBelowTarget === 0, `Class C doctorsBelowTarget = 0`);
  assert(rowC.visitsRequired === 0, `Class C visitsRequired = 0 (rotational policy)`);
  assert(rowC.visitsCompleted === 2, `Class C visitsCompleted = 2`);
  assert(rowC.targetAchievementFormatted === '—', `Class C achievement is "—"`);

  const rowTotal = mgmtRows!.find(r => r.categoryKey === 'Total Assigned List')!;
  assert(rowTotal.totalDoctors === 4, `Total Assigned totalDoctors = 4 (2 + 1 + 1)`);
  assert(rowTotal.uniqueDoctorsVisited === 4, `Total Assigned uniqueDoctorsVisited = 4`);
  assert(rowTotal.fullyCompliant === 2, `Total Assigned fullyCompliant = 2 (B1 + C1)`);
  assert(rowTotal.doctorsBelowTarget === 2, `Total Assigned doctorsBelowTarget = 2 (ABC + XYZ)`);
  assert(rowTotal.visitsRequired === 30, `Total Assigned visitsRequired = 30 (24 + 6 + 0)`);
  assert(rowTotal.visitsCompleted === 29, `Total Assigned visitsCompleted = 29 (21 + 6 + 2)`);
  assert(rowTotal.visitGap === -1, `Total Assigned visitGap = -1 (29 - 30)`);
  assert(rowTotal.targetAchievementFormatted === '96.7%', `Total Assigned achievement = 96.7% (29/30)`);

  console.log('\n--- VERIFYING SECTION 19 & 20 UNLISTED DOCTORS ISOLATION ---');
  const rowUnlisted = mgmtRows!.find(r => r.categoryKey === 'Unlisted / Extra Doctors')!;
  assert(rowUnlisted.totalDoctors === '—', `Unlisted totalDoctors = "—"`);
  assert(rowUnlisted.uniqueDoctorsVisited === 1, `Unlisted uniqueDoctorsVisited = 1`);
  assert(rowUnlisted.fullyCompliant === '—', `Unlisted fullyCompliant = "—"`);
  assert(rowUnlisted.doctorsBelowTarget === '—', `Unlisted doctorsBelowTarget = "—"`);
  assert(rowUnlisted.visitsRequired === 0, `Unlisted visitsRequired = 0`);
  assert(rowUnlisted.visitsCompleted === 2, `Unlisted visitsCompleted = 2`);
  assert(rowUnlisted.visitGap === 2, `Unlisted visitGap = +2`);
  assert(rowUnlisted.visitGapFormatted === '+2', `Unlisted visitGapFormatted = "+2"`);
  assert(rowUnlisted.targetAchievementFormatted === '—', `Unlisted targetAchievementFormatted = "—"`);
  assert(rowUnlisted.auditStatus.includes('2 extra visits were made'), `Unlisted auditStatus mentions 2 extra visits`);

  // Verify Section 20: unlisted visits (2) are NOT added to assigned compliance numerator
  // (if added, completed would be 31/30 = 103.3%, which is forbidden by Section 20)
  assert(rowTotal.visitsCompleted === 29, `Assigned visits completed strictly excludes unlisted visits (29 != 31)`);
  assert(rowTotal.targetAchievementFormatted === '96.7%', `Compliance achievement strictly reflects assigned visits`);

  console.log('\n--- VERIFYING SECTION 24 MONTHLY PERFORMANCE SUMMARY ---');
  const monthlyPerf = result.monthlyPerformanceSummary;
  assert(monthlyPerf !== undefined && monthlyPerf.length === 6, 'Monthly performance summary has 6 months');
  // Monthly required visits = 2 A-docs * 2 + 1 B-doc * 1 = 5 visits/month
  monthlyPerf?.forEach(m => {
    assert(m.requiredVisits === 5, `${m.month} requiredVisits = 5 (2*2 + 1*1)`);
  });

  console.log('\n--- VERIFYING FORMAT C PARSER & NON-DOCTOR FILTER ---');
  const rawRowsFormatC = [
    ['Date', 'Town', "Dr's Met", 'Product Discussed', 'Mktg Commitment', 'Other Commitment', 'Next Visit Objective'],
    ['2026-05-01', 'Ahmedabad', 'Doctor ABC, Shivani Trivedi, Office', 'Cardio Drug', 'Brochures', 'None', 'Followup'],
  ];

  const parsedActivities = normalizeDailyActivities(
    rawRowsFormatC,
    rawRowsFormatC[0],
    'FormatC.xlsx'
  );

  assert(parsedActivities.length === 1, '1 activity row normalized from Format C');
  assert(parsedActivities[0].customerNames.length === 3, 'Split into 3 entities: Doctor ABC, Shivani Trivedi, Office');

  const formatCAnalysis = analyzeReport(
    assignedDoctors,
    parsedActivities,
    { month: 'May', year: 2026 },
    'Paresh',
    {},
    'single'
  );

  assert(formatCAnalysis.doctorRecords.find(r => r.doctor.id === 'DOC_ABC')?.visitCount === 1, 'Doctor ABC counted as 1 visit');
  assert(formatCAnalysis.unlistedVisits?.length === 1, 'Shivani Trivedi captured as unlisted doctor visit');
  assert(formatCAnalysis.unlistedVisits?.[0].candidateName === 'Shivani Trivedi', 'Unlisted candidate is Shivani Trivedi');
  assert(formatCAnalysis.validationStats.nonDoctorActivitiesFiltered >= 1, 'Office filtered as non-doctor activity');

  console.log('\n--- VERIFYING EXCEL WORKBOOK EXPORT ---');
  const wb = generateComplianceExcelWorkbook(result);
  assert(wb.SheetNames.includes('Executive Summary'), 'Excel includes Executive Summary');
  assert(wb.SheetNames.includes('Doctor Analysis'), 'Excel includes Doctor Analysis');
  assert(wb.SheetNames.includes('Visit Details'), 'Excel includes Visit Details');
  assert(wb.SheetNames.includes('Pending Doctors'), 'Excel includes Pending Doctors');
  assert(wb.SheetNames.includes('Unmatched Records'), 'Excel includes Unmatched Records');

  console.log('\n=====================================================');
  console.log('ALL DETAILED 6-MONTH MANAGEMENT SUMMARY TESTS PASSED!');
  console.log('=====================================================\n');
}

runDetailedSummary6MonthTests();
