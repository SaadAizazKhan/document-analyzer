import assert from 'node:assert';
import { AssignedDoctor, NormalizedActivity, DoctorAnalysisRecord } from '../types/analyzer';
import {
  calculateSixMonthDoctorMatrix,
  evaluateDoctorCompliance,
} from '../analysis/calculateCompliance';
import {
  calculateCategorySummaries,
  calculateOverallSummary,
} from '../analysis/calculateSummaries';

function makeDoctor(id: string, name: string, category: 'A' | 'B' | 'C', srNo = 1): AssignedDoctor {
  return {
    id,
    srNo,
    city: 'Ahmedabad',
    rawName: name,
    normalizedName: name.toLowerCase(),
    hospital: 'Apex Hospital',
    category,
  };
}

function makeActivity(id: string, date: string, docName: string, docId?: string): NormalizedActivity & { matchedDoctorId?: string } {
  return {
    id,
    date,
    parsedDate: new Date(date),
    originalCustomerText: docName,
    customerNames: [docName],
    activityType: 'DOCTOR_VISIT',
    sourceRowNumber: 1,
    matchedDoctorId: docId,
  };
}

console.log('=== Starting Section 30 & 31 Multi-Month Logic Acceptance Tests ===\n');

// Helper to construct monthKeys and monthlyActivitiesMap
function setupMonthlyData(
  months: { key: string; name: string; year: number }[],
  activities: (NormalizedActivity & { matchedDoctorId?: string })[]
) {
  const monthlyMap = new Map<string, NormalizedActivity[]>();
  months.forEach(m => monthlyMap.set(m.key, []));

  activities.forEach(act => {
    const key = act.date.substring(0, 7);
    const list = monthlyMap.get(key);
    if (list) {
      list.push(act);
    }
  });

  return monthlyMap;
}

// =========================================================================
// SECTION 30: Single A-Class Doctor across 6 Months
// April (2), May (1), June (1), July (2), August (2), September (1) = 9 visits
// =========================================================================
{
  console.log('--- Test 1: Section 30 - Single Doctor Multi-Month Compliance ---');
  const doc = makeDoctor('doc-1', 'Dr. Alpha', 'A');
  const monthKeys = [
    { key: '2026-04', name: 'Apr', year: 2026 },
    { key: '2026-05', name: 'May', year: 2026 },
    { key: '2026-06', name: 'Jun', year: 2026 },
    { key: '2026-07', name: 'Jul', year: 2026 },
    { key: '2026-08', name: 'Aug', year: 2026 },
    { key: '2026-09', name: 'Sep', year: 2026 },
  ];

  // Activities:
  const activities = [
    // April: 2 visits (Achieved)
    makeActivity('a1', '2026-04-05', 'Dr. Alpha', 'doc-1'),
    makeActivity('a2', '2026-04-20', 'Dr. Alpha', 'doc-1'),
    // May: 1 visit (Pending)
    makeActivity('m1', '2026-05-10', 'Dr. Alpha', 'doc-1'),
    // June: 1 visit (Pending)
    makeActivity('j1', '2026-06-12', 'Dr. Alpha', 'doc-1'),
    // July: 2 visits (Achieved)
    makeActivity('jl1', '2026-07-08', 'Dr. Alpha', 'doc-1'),
    makeActivity('jl2', '2026-07-25', 'Dr. Alpha', 'doc-1'),
    // August: 2 visits (Achieved)
    makeActivity('au1', '2026-08-04', 'Dr. Alpha', 'doc-1'),
    makeActivity('au2', '2026-08-22', 'Dr. Alpha', 'doc-1'),
    // September: 1 visit (Pending)
    makeActivity('s1', '2026-09-15', 'Dr. Alpha', 'doc-1'),
  ];

  const monthlyMap = setupMonthlyData(monthKeys, activities);
  const matrix = calculateSixMonthDoctorMatrix([doc], monthlyMap, monthKeys);

  assert.strictEqual(matrix.length, 1);
  const row = matrix[0];

  assert.strictEqual(row.totalVisits, 9, 'Total visits must be 9');
  assert.strictEqual(row.requiredVisits, 12, 'Required visits for 6 months A-Class must be 6 * 2 = 12');
  assert.strictEqual(row.visitShortfall, 3, 'Shortfall must be 12 - 9 = 3');
  assert.strictEqual(row.visitSurplus, 0, 'Surplus must be 0');
  assert.strictEqual(row.monthsAchieved, 3, 'Months achieved must be 3 (Apr, Jul, Aug)');
  assert.strictEqual(row.monthsPending, 3, 'Months pending must be 3 (May, Jun, Sep)');
  assert.strictEqual(
    row.overallEvaluation,
    'Partially Compliant',
    'Doctor must be classified as Partially Compliant, NOT Fully Compliant'
  );

  // Check specific month records
  assert.strictEqual(row.monthlyRecords['2026-04'].targetStatus, 'Achieved');
  assert.strictEqual(row.monthlyRecords['2026-05'].targetStatus, 'Pending');
  assert.strictEqual(row.monthlyRecords['2026-06'].targetStatus, 'Pending');
  assert.strictEqual(row.monthlyRecords['2026-07'].targetStatus, 'Achieved');
  assert.strictEqual(row.monthlyRecords['2026-08'].targetStatus, 'Achieved');
  assert.strictEqual(row.monthlyRecords['2026-09'].targetStatus, 'Pending');

  console.log('✓ Section 30 Single Doctor Test Passed:');
  console.log(`  Req: ${row.requiredVisits}, Actual: ${row.totalVisits}, Shortfall: ${row.visitShortfall}`);
  console.log(`  Months Achieved: ${row.monthsAchieved}/6, Pending: ${row.monthsPending}/6, Overall: ${row.overallEvaluation}\n`);
}

// =========================================================================
// SECTION 31: 9 Category A Doctors over 6 Months with 28 Total Visits
// =========================================================================
{
  console.log('--- Test 2: Section 31 - 9 A-Class Doctors over 6 Months Benchmark ---');
  const monthKeys = [
    { key: '2026-04', name: 'Apr', year: 2026 },
    { key: '2026-05', name: 'May', year: 2026 },
    { key: '2026-06', name: 'Jun', year: 2026 },
    { key: '2026-07', name: 'Jul', year: 2026 },
    { key: '2026-08', name: 'Aug', year: 2026 },
    { key: '2026-09', name: 'Sep', year: 2026 },
  ];

  // 9 Doctors
  const docs: AssignedDoctor[] = Array.from({ length: 9 }, (_, i) =>
    makeDoctor(`doc-${i + 1}`, `Dr. Doctor_${i + 1}`, 'A', i + 1)
  );

  // Distribute 28 visits among the 9 doctors across the 6 months:
  // E.g., doc 1-8 get 3 visits each (24 visits), doc 9 gets 4 visits (total 28 visits)
  const activities: (NormalizedActivity & { matchedDoctorId?: string })[] = [];
  let actId = 1;
  docs.forEach((doc, idx) => {
    const visitsForDoc = idx === 8 ? 4 : 3;
    for (let v = 0; v < visitsForDoc; v++) {
      const monthStr = ['2026-04-10', '2026-05-10', '2026-06-10', '2026-07-10'][v % 4];
      activities.push(makeActivity(`act-${actId++}`, monthStr, doc.rawName, doc.id));
    }
  });

  assert.strictEqual(activities.length, 28, 'Should have exactly 28 visits logged');

  const monthlyMap = setupMonthlyData(monthKeys, activities);
  const matrix = calculateSixMonthDoctorMatrix(docs, monthlyMap, monthKeys);
  assert.strictEqual(matrix.length, 9);

  // Evaluate doctor level compliance (for category summaries)
  const doctorRecords: DoctorAnalysisRecord[] = docs.map(doc => {
    const docVisits = activities.filter(a => a.matchedDoctorId === doc.id);
    return evaluateDoctorCompliance(doc, docVisits, 'Multi-Month Period');
  });

  // Calculate summaries with multi-month parameters
  const catSummaries = calculateCategorySummaries(
    doctorRecords,
    matrix,
    6
  );

  const aCat = catSummaries.find(c => c.category === 'A');
  assert.ok(aCat, 'Category A summary must exist');

  console.log('Category A Summary Results:');
  console.log(`  Assigned Doctors: ${aCat.assignedDoctors}`);
  console.log(`  Drs Met: ${aCat.drsMet}`);
  console.log(`  Total Required Visits: ${aCat.totalRequiredVisits} (Expected: 9 * 6 * 2 = 108)`);
  console.log(`  Total Visits Done: ${aCat.totalVisitsDone} (Expected: 28)`);
  console.log(`  Visit Shortfall: ${aCat.visitShortfall} (Expected: 80)`);
  console.log(`  Fully Compliant Drs: ${aCat.fullyCompliantDrs} (Expected: 0)`);
  console.log(`  Drs With Pending Months: ${aCat.drsWithPendingMonths} (Expected: 9)`);
  console.log(`  Pending Doctor-Months: ${aCat.pendingDoctorMonths} / ${aCat.totalDoctorMonthSlots} (54 slots)`);

  assert.strictEqual(aCat.totalRequiredVisits, 108, 'A-Class Required Visits must be 9 * 6 * 2 = 108');
  assert.strictEqual(aCat.totalVisitsDone, 28, 'Actual visits must be 28');
  assert.strictEqual(aCat.visitShortfall, 80, 'Visit Shortfall must be 108 - 28 = 80');
  assert.strictEqual(aCat.fullyCompliantDrs, 0, 'Fully Compliant Doctors must be 0 (no doctor achieved all 6 months)');
  assert.strictEqual(aCat.drsWithPendingMonths, 9, 'All 9 doctors have pending months');
  assert.strictEqual(aCat.totalDoctorMonthSlots, 54, 'Total slots must be 9 * 6 = 54');

  // Audit Remarks check
  console.log(`\nAudit Remarks generated:\n"${aCat.auditRemarks}"\n`);
  assert.ok(
    !aCat.auditRemarks.includes('8 doctors achieved the mandatory 2x monthly frequency target'),
    'Audit remarks MUST NOT falsely claim 8 doctors achieved target'
  );
  assert.ok(
    aCat.auditRemarks.includes('Total required visits: 108'),
    'Audit remarks must state Total required visits: 108'
  );
  assert.ok(
    aCat.auditRemarks.includes('Overall visit shortfall: 80'),
    'Audit remarks must state Overall visit shortfall: 80'
  );
  assert.ok(
    aCat.auditRemarks.includes('0 of 9 doctors were fully compliant across all 6 months'),
    'Audit remarks must state 0 of 9 doctors were fully compliant'
  );

  // Overall Summary check
  const overallSummary = calculateOverallSummary(
    catSummaries,
    0,
    6
  );
  assert.strictEqual(overallSummary.totalRequiredVisits, 108);
  assert.strictEqual(overallSummary.totalVisitsDone, 28);
  assert.strictEqual(overallSummary.totalVisitShortfall, 80);
  assert.strictEqual(overallSummary.totalFullyCompliantDrs, 0);
  assert.strictEqual(overallSummary.totalDrsWithPendingMonths, 9);

  console.log('✓ Section 31 Benchmark Test Passed!');
}

// =========================================================================
// TEST 3: Inclusive Month Span (April through September = 6 Months even if June has 0 visits)
// =========================================================================
{
  console.log('\n--- Test 3: Inclusive Month Span (Missing June in Uploaded Files) ---');
  const { analyzeReport } = await import('../analysis/analyzeReport');

  const docs: AssignedDoctor[] = Array.from({ length: 9 }, (_, i) =>
    makeDoctor(`doc-${i + 1}`, `Dr. Doctor_${i + 1}`, 'A', i + 1)
  );

  // Activities across April, May, July, August, September (NO June activity)
  const activities: NormalizedActivity[] = [
    makeActivity('act-apr', '2026-04-10', 'Dr. Doctor_1', 'doc-1'),
    makeActivity('act-may', '2026-05-15', 'Dr. Doctor_1', 'doc-1'),
    makeActivity('act-jul', '2026-07-20', 'Dr. Doctor_1', 'doc-1'),
    makeActivity('act-aug', '2026-08-25', 'Dr. Doctor_1', 'doc-1'),
    makeActivity('act-sep', '2026-09-12', 'Dr. Doctor_1', 'doc-1'),
  ];

  const analysis = analyzeReport(
    docs,
    activities,
    { month: 'September', year: 2026 },
    'Paresh',
    {},
    'six_months'
  );

  assert.strictEqual(analysis.monthsList.length, 6, 'Months list must contain 6 months inclusive');
  assert.ok(analysis.monthsList.includes('Jun 2026'), 'June 2026 must be present in months list');
  assert.strictEqual(analysis.periodDisplay, 'Apr 2026 – Sep 2026 (6 Months)');
  
  const aCat = analysis.categorySummaries.find(c => c.category === 'A')!;
  assert.strictEqual(aCat.totalRequiredVisits, 108, '9 doctors * 6 months * 2 visits = 108 required visits');

  // Check June in doctor matrix
  const doc1Record = analysis.sixMonthRecords!.find(r => r.doctor.id === 'doc-1')!;
  assert.ok(doc1Record.monthlyRecords['2026-06'], 'June record must exist');
  assert.strictEqual(doc1Record.monthlyRecords['2026-06'].actualVisits, 0, 'June actual visits must be 0');
  assert.strictEqual(doc1Record.monthlyRecords['2026-06'].targetStatus, 'Pending', 'June target status must be Pending');

  console.log('✓ Test 3 Passed: Apr–Sep span inclusive = 6 Months, June 0 visits correctly flagged as Pending.');
}

console.log('\n=== All Multi-Month Acceptance Tests Passed Successfully! ===');
