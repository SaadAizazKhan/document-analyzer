import {
  AssignedDoctor,
  CategoryMonthlyBreakdownRow,
  CategorySummary,
  CitySummary,
  ComplianceException,
  DoctorAnalysisRecord,
  DoctorCategory,
  ManagementSummaryRow,
  MonthlyPerformanceSummaryRow,
  OverallSummary,
  SixMonthDoctorRecord,
  UnlistedDoctorVisit,
} from '../types/analyzer';
import { generateCategoryAuditRemark, generateOverallAuditRemark } from './generateAuditRemarks';

export function calculateCategorySummaries(
  records: DoctorAnalysisRecord[],
  sixMonthRecords?: SixMonthDoctorRecord[],
  numberMonths?: number
): CategorySummary[] {
  const categories: DoctorCategory[] = ['A', 'B', 'C'];
  const isMultiMonth = numberMonths !== undefined && numberMonths > 1 && sixMonthRecords && sixMonthRecords.length > 0;

  return categories.map(category => {
    const catRecords = records.filter(r => r.doctor.category === category);
    const assignedDoctors = catRecords.length;

    // Aggregate gaps for category
    const allGaps: number[] = [];
    catRecords.forEach(r => {
      if (r.gaps && r.gaps.length > 0) {
        allGaps.push(...r.gaps);
      }
    });

    let daysDifferenceFormatted = '—';
    let avgGapDays: number | null = null;
    if (allGaps.length > 0) {
      const sum = allGaps.reduce((acc, g) => acc + g, 0);
      avgGapDays = Number((sum / allGaps.length).toFixed(1));
      const min = Math.min(...allGaps);
      const max = Math.max(...allGaps);
      daysDifferenceFormatted = min === max
        ? `Avg: ${avgGapDays} Days (${min}d)`
        : `Avg: ${avgGapDays} Days (${min}–${max}d)`;
    }

    if (isMultiMonth) {
      const catSixRecords = sixMonthRecords.filter(r => r.doctor.category === category);
      const drsMet = catSixRecords.filter(r => r.totalVisits > 0).length;
      const totalVisitsDone = catSixRecords.reduce((acc, r) => acc + r.totalVisits, 0);
      const repeatedDrs = catSixRecords.filter(r => r.totalVisits > 1).length;
      const numMonths = numberMonths!;

      let totalRequiredVisits = 0;
      let fovRule = '';
      let pendingDrs = 0;
      let drsWithPendingMonths = 0;
      let pendingDoctorMonths = 0;
      let totalDoctorMonthSlots = 0;

      if (category === 'A') {
        fovRule = '15 Days Rule (Target: 2 visits)';
        totalRequiredVisits = assignedDoctors * numMonths * 2;
        drsWithPendingMonths = catSixRecords.filter(r => r.monthsPending > 0).length;
        pendingDrs = drsWithPendingMonths;
        pendingDoctorMonths = catSixRecords.reduce((acc, r) => acc + r.monthsPending, 0);
        totalDoctorMonthSlots = assignedDoctors * numMonths;
      } else if (category === 'B') {
        fovRule = '30 Days Rule (Target: 1 visit)';
        totalRequiredVisits = assignedDoctors * numMonths * 1;
        drsWithPendingMonths = catSixRecords.filter(r => r.monthsPending > 0).length;
        pendingDrs = drsWithPendingMonths;
        pendingDoctorMonths = catSixRecords.reduce((acc, r) => acc + r.monthsPending, 0);
        totalDoctorMonthSlots = assignedDoctors * numMonths;
      } else {
        fovRule = '45 Days Rule (Rotational)';
        totalRequiredVisits = 0;
        pendingDrs = catSixRecords.filter(r => r.totalVisits === 0).length;
        drsWithPendingMonths = pendingDrs;
        pendingDoctorMonths = 0;
        totalDoctorMonthSlots = 0;
        daysDifferenceFormatted = '—';
        avgGapDays = null;
      }

      const visitShortfall = totalRequiredVisits > 0 ? Math.max(0, totalRequiredVisits - totalVisitsDone) : 0;
      const visitSurplus = totalRequiredVisits > 0 ? Math.max(0, totalVisitsDone - totalRequiredVisits) : 0;

      const fullyCompliantDrs = category === 'C'
        ? catSixRecords.filter(r => r.totalVisits > 0).length
        : catSixRecords.filter(r => r.overallEvaluation === 'Fully Compliant').length;
      const partiallyCompliantDrs = category === 'C'
        ? 0
        : catSixRecords.filter(r => r.overallEvaluation === 'Partially Compliant').length;

      const uniqueCoveragePct = assignedDoctors > 0 ? (drsMet / assignedDoctors) * 100 : 0;
      const frequencyAchievementPct = totalRequiredVisits > 0 ? (totalVisitsDone / totalRequiredVisits) * 100 : 0;

      const partialSummary: Omit<CategorySummary, 'auditRemarks'> = {
        category,
        fovRule,
        targetVisitsPerMonth: category === 'A' ? 2 : 1,
        numberMonths: numMonths,
        totalRequiredVisits: totalRequiredVisits > 0 ? totalRequiredVisits : undefined,
        visitShortfall: totalRequiredVisits > 0 ? visitShortfall : undefined,
        visitSurplus: totalRequiredVisits > 0 ? visitSurplus : undefined,
        assignedDoctors,
        drsMet,
        totalVisitsDone,
        repeatedDrs,
        pendingDrs,
        fullyCompliantDrs,
        partiallyCompliantDrs,
        drsWithPendingMonths,
        pendingDoctorMonths,
        totalDoctorMonthSlots,
        uniqueCoveragePct: Number(uniqueCoveragePct.toFixed(1)),
        frequencyAchievementPct: Number(frequencyAchievementPct.toFixed(1)),
        avgGapDays,
        daysDifferenceFormatted,
      };

      const auditRemarks = generateCategoryAuditRemark(category, catRecords, partialSummary);

      return {
        ...partialSummary,
        auditRemarks,
      };
    }

    // Single-Month Calculation
    const drsMet = catRecords.filter(r => r.visitCount > 0).length;
    const totalVisitsDone = catRecords.reduce((acc, r) => acc + r.visitCount, 0);
    const repeatedDrs = catRecords.filter(r => r.visitCount > 1).length;
    const pendingDrs = catRecords.filter(r => r.targetStatus === 'Pending').length;

    const uniqueCoveragePct = assignedDoctors > 0 ? (drsMet / assignedDoctors) * 100 : 0;

    let targetVisitsPerMonth = 1;
    let fovRule = '';
    let targetMetCount = 0;

    if (category === 'A') {
      fovRule = '15 Days Rule (Target: 2 visits)';
      targetVisitsPerMonth = 2;
      targetMetCount = catRecords.filter(r => r.visitCount >= 2).length;
    } else if (category === 'B') {
      fovRule = '30 Days Rule (Target: 1 visit)';
      targetVisitsPerMonth = 1;
      targetMetCount = catRecords.filter(r => r.visitCount >= 1).length;
    } else {
      fovRule = '45 Days Rule (Rotational)';
      targetVisitsPerMonth = 1;
      targetMetCount = drsMet;
      daysDifferenceFormatted = '—';
      avgGapDays = null;
    }

    const frequencyAchievementPct = assignedDoctors > 0 ? (targetMetCount / assignedDoctors) * 100 : 0;

    const partialSummary: Omit<CategorySummary, 'auditRemarks'> = {
      category,
      fovRule,
      targetVisitsPerMonth,
      assignedDoctors,
      drsMet,
      totalVisitsDone,
      repeatedDrs,
      pendingDrs,
      uniqueCoveragePct: Number(uniqueCoveragePct.toFixed(1)),
      frequencyAchievementPct: Number(frequencyAchievementPct.toFixed(1)),
      avgGapDays,
      daysDifferenceFormatted,
    };

    const auditRemarks = generateCategoryAuditRemark(category, catRecords, partialSummary);

    return {
      ...partialSummary,
      auditRemarks,
    };
  });
}

export function calculateOverallSummary(
  categorySummaries: CategorySummary[],
  exceptionsCount: number,
  numberMonths?: number
): OverallSummary {
  const totalAssigned = categorySummaries.reduce((acc, c) => acc + c.assignedDoctors, 0);
  const totalDrsMet = categorySummaries.reduce((acc, c) => acc + c.drsMet, 0);
  const totalVisitsDone = categorySummaries.reduce((acc, c) => acc + c.totalVisitsDone, 0);
  const totalRepeatedDrs = categorySummaries.reduce((acc, c) => acc + c.repeatedDrs, 0);
  const totalPendingDrs = categorySummaries.reduce((acc, c) => acc + c.pendingDrs, 0);

  const overallCoveragePct = totalAssigned > 0
    ? Number(((totalDrsMet / totalAssigned) * 100).toFixed(1))
    : 0;

  const totalRequiredVisits = categorySummaries.reduce((acc, c) => acc + (c.totalRequiredVisits || 0), 0);
  const totalVisitShortfall = categorySummaries.reduce((acc, c) => acc + (c.visitShortfall || 0), 0);
  const totalFullyCompliantDrs = categorySummaries.reduce((acc, c) => acc + (c.fullyCompliantDrs || 0), 0);
  const totalPartiallyCompliantDrs = categorySummaries.reduce((acc, c) => acc + (c.partiallyCompliantDrs || 0), 0);
  const totalDrsWithPendingMonths = categorySummaries.reduce((acc, c) => acc + (c.drsWithPendingMonths || 0), 0);
  const totalPendingDoctorMonths = categorySummaries.reduce((acc, c) => acc + (c.pendingDoctorMonths || 0), 0);
  const totalDoctorMonthSlots = categorySummaries.reduce((acc, c) => acc + (c.totalDoctorMonthSlots || 0), 0);

  const partialOverall: Omit<OverallSummary, 'auditRemarks'> = {
    totalAssigned,
    totalDrsMet,
    overallCoveragePct,
    totalVisitsDone,
    totalRepeatedDrs,
    totalPendingDrs,
    numberMonths,
    totalRequiredVisits: totalRequiredVisits > 0 ? totalRequiredVisits : undefined,
    totalVisitShortfall: totalRequiredVisits > 0 ? totalVisitShortfall : undefined,
    totalFullyCompliantDrs: totalRequiredVisits > 0 ? totalFullyCompliantDrs : undefined,
    totalPartiallyCompliantDrs: totalRequiredVisits > 0 ? totalPartiallyCompliantDrs : undefined,
    totalDrsWithPendingMonths: totalRequiredVisits > 0 ? totalDrsWithPendingMonths : undefined,
    totalPendingDoctorMonths: totalRequiredVisits > 0 ? totalPendingDoctorMonths : undefined,
    totalDoctorMonthSlots: totalRequiredVisits > 0 ? totalDoctorMonthSlots : undefined,
    totalExceptions: exceptionsCount,
  };

  const auditRemarks = generateOverallAuditRemark(partialOverall);

  return {
    ...partialOverall,
    auditRemarks,
  };
}

export function calculateCitySummaries(records: DoctorAnalysisRecord[]): CitySummary[] {
  const cityMap = new Map<string, { assigned: number; met: number; pending: number; totalVisits: number }>();

  records.forEach(r => {
    const rawCity = r.doctor.city.trim().toUpperCase() || 'UNKNOWN';
    const existing = cityMap.get(rawCity) || { assigned: 0, met: 0, pending: 0, totalVisits: 0 };
    existing.assigned += 1;
    if (r.visitCount > 0) {
      existing.met += 1;
    } else {
      existing.pending += 1;
    }
    existing.totalVisits += r.visitCount;
    cityMap.set(rawCity, existing);
  });

  const result: CitySummary[] = [];
  cityMap.forEach((stats, city) => {
    const coveragePct = stats.assigned > 0 ? Number(((stats.met / stats.assigned) * 100).toFixed(1)) : 0;
    result.push({
      city,
      assigned: stats.assigned,
      met: stats.met,
      pending: stats.pending,
      totalVisits: stats.totalVisits,
      coveragePct,
    });
  });

  return result.sort((a, b) => b.assigned - a.assigned);
}

export function extractComplianceExceptions(records: DoctorAnalysisRecord[]): ComplianceException[] {
  const exceptions: ComplianceException[] = [];

  records.forEach(r => {
    const doc = r.doctor;
    const datesStr = r.visitDatesFormatted.join(', ') || 'None';

    if (doc.category === 'A' && r.visitCount === 1) {
      exceptions.push({
        doctorName: doc.rawName,
        category: 'A',
        city: doc.city,
        hospital: doc.hospital,
        visitCount: 1,
        expectedVisits: 2,
        actualVisits: 1,
        visitDates: datesStr,
        gapSummary: '—',
        exceptionType: 'A-Class Single Visit (Frequency Short)',
        recommendation: 'Mandatory second visit required to meet 15-day compliance target.',
      });
    }

    if (doc.category === 'B' && r.hasPrematureRepeat) {
      exceptions.push({
        doctorName: doc.rawName,
        category: 'B',
        city: doc.city,
        hospital: doc.hospital,
        visitCount: r.visitCount,
        expectedVisits: 1,
        actualVisits: r.visitCount,
        visitDates: datesStr,
        gapSummary: r.gapSummaryFormatted,
        exceptionType: 'B-Class Premature Repeat',
        recommendation: `Multiple visits occurred within ${r.minGap} days against 30-day norm; investigate rationale.`,
      });
    }

    if (r.visitCount === 0) {
      exceptions.push({
        doctorName: doc.rawName,
        category: doc.category,
        city: doc.city,
        hospital: doc.hospital,
        visitCount: 0,
        expectedVisits: doc.category === 'A' ? 2 : 1,
        actualVisits: 0,
        visitDates: 'No visits',
        gapSummary: '—',
        exceptionType: 'Pending Doctor (Zero Visits)',
        recommendation: `Doctor untouched in reporting period. Prioritize visit in upcoming tour plan.`,
      });
    }
  });

  return exceptions;
}

/**
 * Generates the Primary 6-Month Management Summary Table (Sections 10 & 31)
 */
export function calculateSixMonthManagementSummary(
  _assignedDoctors: AssignedDoctor[],
  sixMonthRecords: SixMonthDoctorRecord[],
  numMonths: number,
  unlistedVisits: UnlistedDoctorVisit[] = []
): ManagementSummaryRow[] {
  const getCatRecords = (cat: DoctorCategory) => sixMonthRecords.filter(r => r.doctor.category === cat);

  const aRecords = getCatRecords('A');
  const bRecords = getCatRecords('B');
  const cRecords = getCatRecords('C');

  // --- Class A ---
  const aTotal = aRecords.length;
  const aUniqueVisited = aRecords.filter(r => r.totalVisits > 0).length;
  const aFullyCompliant = aRecords.filter(r => r.overallEvaluation === 'Fully Compliant').length;
  const aBelowTarget = aTotal - aFullyCompliant;
  const aRequired = aTotal * numMonths * 2;
  const aCompleted = aRecords.reduce((acc, r) => acc + r.totalVisits, 0);
  const aGap = aCompleted - aRequired;
  const aGapFormatted = aGap > 0 ? `+${aGap}` : `${aGap}`;
  const aAchPct = aRequired > 0 ? Number(((aCompleted / aRequired) * 100).toFixed(1)) : 0;
  const aStatus = aBelowTarget === 0
    ? `All ${aTotal} doctors achieved the complete monthly quota.`
    : `${aBelowTarget} doctors did not achieve the complete monthly quota.`;

  const rowA: ManagementSummaryRow = {
    categoryKey: 'Class A',
    categoryLabel: 'Class A',
    visitRule: '2 Visits / Month (15-Day Frequency)',
    totalDoctors: aTotal,
    uniqueDoctorsVisited: aUniqueVisited,
    fullyCompliant: aFullyCompliant,
    doctorsBelowTarget: aBelowTarget,
    visitsRequired: aRequired,
    visitsCompleted: aCompleted,
    visitGap: aGap,
    visitGapFormatted: aGapFormatted,
    targetAchievementPct: aAchPct,
    targetAchievementFormatted: `${aAchPct.toFixed(1)}%`,
    auditStatus: aStatus,
  };

  // --- Class B ---
  const bTotal = bRecords.length;
  const bUniqueVisited = bRecords.filter(r => r.totalVisits > 0).length;
  const bFullyCompliant = bRecords.filter(r => r.overallEvaluation === 'Fully Compliant').length;
  const bBelowTarget = bTotal - bFullyCompliant;
  const bRequired = bTotal * numMonths * 1;
  const bCompleted = bRecords.reduce((acc, r) => acc + r.totalVisits, 0);
  const bGap = bCompleted - bRequired;
  const bGapFormatted = bGap > 0 ? `+${bGap}` : `${bGap}`;
  const bAchPct = bRequired > 0 ? Number(((bCompleted / bRequired) * 100).toFixed(1)) : 0;
  const bStatus = bBelowTarget === 0
    ? `All ${bTotal} doctors met monthly compliance.`
    : `${bBelowTarget} doctors missed one or more monthly targets.`;

  const rowB: ManagementSummaryRow = {
    categoryKey: 'Class B',
    categoryLabel: 'Class B',
    visitRule: '1 Visit / Month (30-Day Frequency)',
    totalDoctors: bTotal,
    uniqueDoctorsVisited: bUniqueVisited,
    fullyCompliant: bFullyCompliant,
    doctorsBelowTarget: bBelowTarget,
    visitsRequired: bRequired,
    visitsCompleted: bCompleted,
    visitGap: bGap,
    visitGapFormatted: bGapFormatted,
    targetAchievementPct: bAchPct,
    targetAchievementFormatted: `${bAchPct.toFixed(1)}%`,
    auditStatus: bStatus,
  };

  // --- Class C ---
  const cTotal = cRecords.length;
  const cUniqueVisited = cRecords.filter(r => r.totalVisits > 0).length;
  const cFullyCompliant = cRecords.filter(r => r.totalVisits > 0).length;
  const cBelowTarget = cTotal - cFullyCompliant;
  const cRequired = 0; // 45-day rotational coverage policy (not monthly target)
  const cCompleted = cRecords.reduce((acc, r) => acc + r.totalVisits, 0);
  const cGap = cCompleted;
  const cGapFormatted = cGap > 0 ? `+${cGap}` : `${cGap}`;
  const cStatus = cBelowTarget === 0
    ? `All ${cTotal} doctors covered within rotational cycle.`
    : `${cBelowTarget} doctors had insufficient or overdue rotational coverage.`;

  const rowC: ManagementSummaryRow = {
    categoryKey: 'Class C',
    categoryLabel: 'Class C',
    visitRule: '45-Day Rotational Coverage',
    totalDoctors: cTotal,
    uniqueDoctorsVisited: cUniqueVisited,
    fullyCompliant: cFullyCompliant,
    doctorsBelowTarget: cBelowTarget,
    visitsRequired: cRequired,
    visitsCompleted: cCompleted,
    visitGap: cGap,
    visitGapFormatted: cGapFormatted,
    targetAchievementPct: null,
    targetAchievementFormatted: '—',
    auditStatus: cStatus,
  };

  // --- Total Assigned List (A + B + C) ---
  const totalAssignedDoctors = aTotal + bTotal + cTotal;
  const totalUniqueVisited = aUniqueVisited + bUniqueVisited + cUniqueVisited;
  const totalFullyCompliant = aFullyCompliant + bFullyCompliant + cFullyCompliant;
  const totalBelowTarget = aBelowTarget + bBelowTarget + cBelowTarget;
  const totalAssignedRequired = aRequired + bRequired + cRequired;
  const totalAssignedCompleted = aCompleted + bCompleted + cCompleted;
  const totalAssignedGap = totalAssignedCompleted - totalAssignedRequired;
  const totalAssignedGapFormatted = totalAssignedGap > 0 ? `+${totalAssignedGap}` : `${totalAssignedGap}`;
  // Compliance achievement must NEVER include unlisted visits (Section 20 & 28)
  const totalAssignedAchPct = totalAssignedRequired > 0
    ? Number(((totalAssignedCompleted / totalAssignedRequired) * 100).toFixed(1))
    : 0;
  const totalAssignedStatus = totalBelowTarget === 0
    ? 'All assigned doctors achieved assigned compliance targets.'
    : `${totalBelowTarget} assigned doctors missed one or more monthly/rotational targets.`;

  const rowTotalAssigned: ManagementSummaryRow = {
    categoryKey: 'Total Assigned List',
    categoryLabel: 'Total Assigned List',
    visitRule: 'Standard Policy',
    totalDoctors: totalAssignedDoctors,
    uniqueDoctorsVisited: totalUniqueVisited,
    fullyCompliant: totalFullyCompliant,
    doctorsBelowTarget: totalBelowTarget,
    visitsRequired: totalAssignedRequired,
    visitsCompleted: totalAssignedCompleted,
    visitGap: totalAssignedGap,
    visitGapFormatted: totalAssignedGapFormatted,
    targetAchievementPct: totalAssignedAchPct,
    targetAchievementFormatted: `${totalAssignedAchPct.toFixed(1)}%`,
    auditStatus: totalAssignedStatus,
  };

  // --- Unlisted / Extra Doctors ---
  const unlistedUniqueNames = new Set(unlistedVisits.map(v => v.candidateName.trim().toUpperCase())).size;
  const unlistedCompleted = unlistedVisits.length;
  const unlistedGapFormatted = unlistedCompleted > 0 ? `+${unlistedCompleted}` : '0';
  const unlistedStatus = `${unlistedCompleted} extra visits were made to doctors/persons outside the assigned list.`;

  const rowUnlisted: ManagementSummaryRow = {
    categoryKey: 'Unlisted / Extra Doctors',
    categoryLabel: 'Unlisted / Extra Doctors',
    visitRule: 'As Needed (Non-List)',
    totalDoctors: '—',
    uniqueDoctorsVisited: unlistedUniqueNames,
    fullyCompliant: '—',
    doctorsBelowTarget: '—',
    visitsRequired: 0,
    visitsCompleted: unlistedCompleted,
    visitGap: unlistedCompleted,
    visitGapFormatted: unlistedGapFormatted,
    targetAchievementPct: null,
    targetAchievementFormatted: '—',
    auditStatus: unlistedStatus,
  };

  return [rowA, rowB, rowC, rowTotalAssigned, rowUnlisted];
}

/**
 * Generates the Six-Month Monthly Performance Summary Table (Section 24)
 */
export function calculateMonthlyPerformanceSummary(
  assignedDoctors: AssignedDoctor[],
  sixMonthRecords: SixMonthDoctorRecord[],
  monthKeys: { key: string; name: string; year: number }[]
): MonthlyPerformanceSummaryRow[] {
  const numADoctors = assignedDoctors.filter(d => d.category === 'A').length;
  const numBDoctors = assignedDoctors.filter(d => d.category === 'B').length;
  const requiredMonthly = numADoctors * 2 + numBDoctors * 1;

  return monthKeys.map(m => {
    let uniqueDoctorsVisited = 0;
    let visitsCompleted = 0;
    let doctorsFullyMeetingMonthlyTarget = 0;
    let doctorsBelowMonthlyTarget = 0;

    sixMonthRecords.forEach(rec => {
      const mRec = rec.monthlyRecords[m.key];
      if (mRec) {
        if (mRec.actualVisits > 0) {
          uniqueDoctorsVisited++;
        }
        visitsCompleted += mRec.actualVisits;

        if (rec.doctor.category === 'A') {
          if (mRec.actualVisits >= 2) {
            doctorsFullyMeetingMonthlyTarget++;
          } else {
            doctorsBelowMonthlyTarget++;
          }
        } else if (rec.doctor.category === 'B') {
          if (mRec.actualVisits >= 1) {
            doctorsFullyMeetingMonthlyTarget++;
          } else {
            doctorsBelowMonthlyTarget++;
          }
        } else {
          // Category C
          if (mRec.actualVisits > 0) {
            doctorsFullyMeetingMonthlyTarget++;
          } else {
            doctorsBelowMonthlyTarget++;
          }
        }
      }
    });

    const visitGap = visitsCompleted - requiredMonthly;
    const visitGapFormatted = visitGap > 0 ? `+${visitGap}` : `${visitGap}`;
    const achievementPct = requiredMonthly > 0
      ? Number(((visitsCompleted / requiredMonthly) * 100).toFixed(1))
      : 0;

    return {
      monthKey: m.key,
      month: `${m.name} ${m.year}`,
      uniqueDoctorsVisited,
      visitsCompleted,
      requiredVisits: requiredMonthly,
      visitGap,
      visitGapFormatted,
      achievementPct,
      achievementPctFormatted: `${achievementPct.toFixed(1)}%`,
      doctorsFullyMeetingMonthlyTarget,
      doctorsBelowMonthlyTarget,
    };
  });
}

/**
 * Generates Category-Wise Monthly Analysis Tables for Class A, Class B, and Class C (Section 25)
 */
export function calculateCategoryMonthlyBreakdowns(
  sixMonthRecords: SixMonthDoctorRecord[],
  monthKeys: { key: string; name: string; year: number }[]
): {
  A: CategoryMonthlyBreakdownRow[];
  B: CategoryMonthlyBreakdownRow[];
  C: CategoryMonthlyBreakdownRow[];
} {
  const getCatRows = (cat: DoctorCategory, targetPerDoc: number) => {
    const catRecords = sixMonthRecords.filter(r => r.doctor.category === cat);
    const assigned = catRecords.length;
    const requiredPerMonth = assigned * targetPerDoc;

    return monthKeys.map(m => {
      let completed = 0;
      let doctorsMet = 0;
      let doctorsMeetingTarget = 0;

      catRecords.forEach(rec => {
        const mRec = rec.monthlyRecords[m.key];
        if (mRec) {
          completed += mRec.actualVisits;
          if (mRec.actualVisits > 0) doctorsMet++;
          if (targetPerDoc === 0) {
            if (mRec.actualVisits > 0) doctorsMeetingTarget++;
          } else if (mRec.actualVisits >= targetPerDoc) {
            doctorsMeetingTarget++;
          }
        }
      });

      const doctorsBelowTarget = assigned - doctorsMeetingTarget;

      return {
        category: cat,
        monthKey: m.key,
        month: `${m.name} ${m.year}`,
        assigned,
        required: requiredPerMonth,
        completed,
        doctorsMet,
        doctorsMeetingTarget,
        doctorsBelowTarget,
      };
    });
  };

  return {
    A: getCatRows('A', 2),
    B: getCatRows('B', 1),
    C: getCatRows('C', 0),
  };
}
