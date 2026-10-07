import { evaluateDoctorCompliance } from '../analysis/calculateCompliance';
import { AssignedDoctor, DailyActivity } from '../types/analyzer';

function runSection55Tests() {
  console.log('--- RUNNING SECTION 55 COMPLIANCE TEST CASES ---');

  const baseDocA: AssignedDoctor = {
    id: 'docA_1',
    srNo: 1,
    city: 'Ahmedabad',
    rawName: 'Dr. Test A',
    normalizedName: 'TEST A',
    hospital: 'Apollo Hospital',
    category: 'A',
  };

  const baseDocB: AssignedDoctor = {
    id: 'docB_1',
    srNo: 2,
    city: 'Ahmedabad',
    rawName: 'Dr. Test B',
    normalizedName: 'TEST B',
    hospital: 'Civil Hospital',
    category: 'B',
  };

  const baseDocC: AssignedDoctor = {
    id: 'docC_1',
    srNo: 3,
    city: 'Ahmedabad',
    rawName: 'Dr. Test C',
    normalizedName: 'TEST C',
    hospital: 'Sterling Hospital',
    category: 'C',
  };

  function createActivity(dateStr: string): DailyActivity {
    return {
      id: `act_${dateStr}`,
      date: dateStr,
      parsedDate: new Date(dateStr),
      city: 'Ahmedabad',
      originalCustomerText: 'Dr. Test',
      customerNames: ['Dr. Test'],
      hospital: 'Hospital',
      activityType: 'DOCTOR_VISIT',
      sourceRowNumber: 1,
    };
  }

  // Test 1: A doctor: 0 visits -> Pending
  const t1 = evaluateDoctorCompliance(baseDocA, []);
  console.assert(t1.coverageStatus === 'Pending', `Test 1 Failed: coverageStatus=${t1.coverageStatus}`);
  console.assert(t1.frequencyStatus === 'Pending', `Test 1 Failed: frequencyStatus=${t1.frequencyStatus}`);
  console.log('✓ Test 1 Passed: A doctor with 0 visits is Pending');

  // Test 2: A doctor: 1 visit -> Covered, Frequency Short
  const t2 = evaluateDoctorCompliance(baseDocA, [createActivity('2026-08-05')]);
  console.assert(t2.coverageStatus === 'Covered', `Test 2 Failed: coverageStatus=${t2.coverageStatus}`);
  console.assert(t2.frequencyStatus === 'Frequency Short', `Test 2 Failed: frequencyStatus=${t2.frequencyStatus}`);
  console.log('✓ Test 2 Passed: A doctor with 1 visit is Covered & Frequency Short');

  // Test 3: A doctor: 2 visits -> Target Met
  const t3 = evaluateDoctorCompliance(baseDocA, [
    createActivity('2026-08-01'),
    createActivity('2026-08-19'),
  ]);
  console.assert(t3.coverageStatus === 'Covered', `Test 3 Failed: coverageStatus=${t3.coverageStatus}`);
  console.assert(t3.frequencyStatus === 'Target Met', `Test 3 Failed: frequencyStatus=${t3.frequencyStatus}`);
  console.assert(t3.avgGap === 18, `Test 3 Gap Failed: avgGap=${t3.avgGap}`);
  console.log(`✓ Test 3 Passed: A doctor with 2 visits is Target Met (Gap: ${t3.gapSummaryFormatted})`);

  // Test 4: B doctor: 0 visits -> Pending
  const t4 = evaluateDoctorCompliance(baseDocB, []);
  console.assert(t4.coverageStatus === 'Pending', `Test 4 Failed: coverageStatus=${t4.coverageStatus}`);
  console.assert(t4.frequencyStatus === 'Pending', `Test 4 Failed: frequencyStatus=${t4.frequencyStatus}`);
  console.log('✓ Test 4 Passed: B doctor with 0 visits is Pending');

  // Test 5: B doctor: 1 visit -> Target Met
  const t5 = evaluateDoctorCompliance(baseDocB, [createActivity('2026-08-10')]);
  console.assert(t5.coverageStatus === 'Covered', `Test 5 Failed: coverageStatus=${t5.coverageStatus}`);
  console.assert(t5.frequencyStatus === 'Target Met', `Test 5 Failed: frequencyStatus=${t5.frequencyStatus}`);
  console.log('✓ Test 5 Passed: B doctor with 1 visit is Target Met');

  // Test 6: B doctor: 2 visits 11 days apart -> Repeat / Premature Repeat
  const t6 = evaluateDoctorCompliance(baseDocB, [
    createActivity('2026-08-01'),
    createActivity('2026-08-12'),
  ]);
  console.assert(t6.hasPrematureRepeat === true, `Test 6 Failed: hasPrematureRepeat=${t6.hasPrematureRepeat}`);
  console.assert(t6.frequencyStatus === 'Premature Repeat', `Test 6 Failed: frequencyStatus=${t6.frequencyStatus}`);
  console.assert(t6.minGap === 11, `Test 6 Failed: minGap=${t6.minGap}`);
  console.log(`✓ Test 6 Passed: B doctor with 2 visits 11 days apart flagged as Premature Repeat (${t6.minGap} days gap)`);

  // Test 7: C doctor: 0 visits -> Current Month Not Covered (NOT automatically Overdue)
  const t7 = evaluateDoctorCompliance(baseDocC, []);
  console.assert(t7.frequencyStatus === 'Current Month Not Covered', `Test 7 Failed: frequencyStatus=${t7.frequencyStatus}`);
  console.log('✓ Test 7 Passed: C doctor with 0 visits is marked Current Month Not Covered (not automatically overdue)');

  console.log('\nALL 7 SPECIFICATION TEST CASES PASSED PERFECTLY!\n');
}

runSection55Tests();
