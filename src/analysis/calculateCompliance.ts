import {
  AssignedDoctor,
  DailyActivity,
  DoctorAnalysisRecord,
  DoctorCategory,
  DoctorComplianceStatus,
  DoctorVisitGap,
  MonthComplianceRecord,
  NormalizedActivity,
  OverallDoctorStatus,
  SixMonthDoctorRecord,
  SpacingStatus,
  TargetStatus,
} from '../types/analyzer';

/**
 * Calculates day differences between consecutive sorted dates
 */
export function calculateVisitGaps(dates: Date[]): {
  gaps: number[];
  gapDetails: DoctorVisitGap[];
  avgGap: number | null;
  minGap: number | null;
  maxGap: number | null;
  formatted: string;
} {
  if (dates.length <= 1) {
    return {
      gaps: [],
      gapDetails: [],
      avgGap: null,
      minGap: null,
      maxGap: null,
      formatted: '—',
    };
  }

  // Sort dates ascending
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const gaps: number[] = [];
  const gapDetails: DoctorVisitGap[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const d1 = sorted[i];
    const d2 = sorted[i + 1];
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    gaps.push(diffDays);
    gapDetails.push({
      fromDate: d1.toISOString().split('T')[0],
      toDate: d2.toISOString().split('T')[0],
      days: diffDays,
    });
  }

  const sum = gaps.reduce((acc, g) => acc + g, 0);
  const avg = Number((sum / gaps.length).toFixed(1));
  const min = Math.min(...gaps);
  const max = Math.max(...gaps);

  const formatted = min === max
    ? `Avg: ${avg} Days (${min}d)`
    : `Avg: ${avg} Days (${min}–${max}d)`;

  return {
    gaps,
    gapDetails,
    avgGap: avg,
    minGap: min,
    maxGap: max,
    formatted,
  };
}

/**
 * Evaluates monthly target requirements based on category
 */
export function calculateMonthlyTarget(
  category: DoctorCategory,
  visitCount: number
): { requiredVisits: number; targetStatus: TargetStatus } {
  switch (category) {
    case 'A': {
      const requiredVisits = 2;
      return {
        requiredVisits,
        targetStatus: visitCount >= requiredVisits ? 'Achieved' : 'Pending',
      };
    }
    case 'B': {
      const requiredVisits = 1;
      return {
        requiredVisits,
        targetStatus: visitCount >= requiredVisits ? 'Achieved' : 'Pending',
      };
    }
    case 'C': {
      // C-Class rotational: 1 visit satisfies coverage within a rotational slot
      const requiredVisits = 1;
      return {
        requiredVisits,
        targetStatus: visitCount >= 1 ? 'Achieved' : 'Pending',
      };
    }
    default:
      return {
        requiredVisits: 1,
        targetStatus: visitCount >= 1 ? 'Achieved' : 'Pending',
      };
  }
}

/**
 * Evaluates visit spacing independently from monthly visit counts
 */
export function calculateSpacingStatus(
  category: DoctorCategory,
  visitCount: number,
  gaps: number[],
  lastVisitDate?: Date | null,
  periodEndDate?: Date | null
): {
  spacingStatus: SpacingStatus;
  overdueDays: number | null;
  hasPrematureRepeat: boolean;
} {
  let overdueDays: number | null = null;

  if (category === 'A') {
    if (visitCount < 2) {
      return { spacingStatus: 'N/A', overdueDays: null, hasPrematureRepeat: false };
    }
    // Check if any gap between consecutive visits is < 15 days
    const hasViolation = gaps.some(gap => gap < 15);
    return {
      spacingStatus: hasViolation ? 'Spacing Violation' : 'Compliant',
      overdueDays: null,
      hasPrematureRepeat: false,
    };
  }

  if (category === 'B') {
    if (visitCount <= 1) {
      return { spacingStatus: 'Compliant', overdueDays: null, hasPrematureRepeat: false };
    }
    // For 2+ visits in B-Class, norm is 30 days gap
    const shortestGap = Math.min(...gaps);
    if (shortestGap < 30) {
      return {
        spacingStatus: 'Spacing Violation',
        overdueDays: null,
        hasPrematureRepeat: true,
      };
    }
    return { spacingStatus: 'Compliant', overdueDays: null, hasPrematureRepeat: false };
  }

  if (category === 'C') {
    // C-Class 45-day rotational logic
    if (visitCount === 0) {
      return { spacingStatus: 'Pending Rotation', overdueDays: null, hasPrematureRepeat: false };
    }

    // Check gaps if multiple visits
    const maxGap = gaps.length > 0 ? Math.max(...gaps) : 0;
    if (maxGap > 45) {
      overdueDays = maxGap - 45;
      return { spacingStatus: 'Overdue', overdueDays, hasPrematureRepeat: false };
    }

    // Check overdue relative to period end date if provided
    if (lastVisitDate && periodEndDate) {
      const diffTime = periodEndDate.getTime() - lastVisitDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 45) {
        overdueDays = diffDays - 45;
        return { spacingStatus: 'Overdue', overdueDays, hasPrematureRepeat: false };
      }
    }

    return { spacingStatus: 'Rotation Compliant', overdueDays: 0, hasPrematureRepeat: false };
  }

  return { spacingStatus: 'Compliant', overdueDays: null, hasPrematureRepeat: false };
}

/**
 * Combines Target Status and Spacing Status into Overall Status per Section 28 & Final Rule
 */
export function calculateOverallStatus(
  category: DoctorCategory,
  targetStatus: TargetStatus,
  spacingStatus: SpacingStatus
): OverallDoctorStatus {
  if (category === 'C') {
    if (spacingStatus === 'Overdue') return 'OVERDUE';
    if (spacingStatus === 'Rotation Compliant') return 'ROTATION COMPLIANT';
    return targetStatus === 'Achieved' ? 'ROTATION COMPLIANT' : 'PENDING ROTATION';
  }

  // Non-negotiable rule:
  // Target NOT achieved => PENDING
  if (targetStatus === 'Pending') {
    return 'PENDING';
  }

  // Target achieved + Spacing Violation => SPACING VIOLATION
  if (spacingStatus === 'Spacing Violation') {
    return 'SPACING VIOLATION';
  }

  // Target achieved + Spacing Compliant => COMPLIANT
  return 'COMPLIANT';
}

/**
 * Evaluates individual doctor compliance record based on category rules
 */
export function evaluateDoctorCompliance(
  doctor: AssignedDoctor,
  doctorVisits: DailyActivity[],
  monthDisplay: string = 'August 2026',
  periodEndDate?: Date | null
): DoctorAnalysisRecord {
  const visitCount = doctorVisits.length;
  const visitDates: Date[] = [];
  const visitDatesFormatted: string[] = [];

  doctorVisits.forEach(v => {
    if (v.parsedDate) {
      visitDates.push(v.parsedDate);
      visitDatesFormatted.push(v.date || v.parsedDate.toISOString().split('T')[0]);
    } else if (v.date) {
      visitDatesFormatted.push(v.date);
    }
  });

  // Sort formatted dates
  visitDatesFormatted.sort();

  const gapAnalysis = calculateVisitGaps(visitDates);
  const targetEval = calculateMonthlyTarget(doctor.category, visitCount);

  // Last visit date
  const sortedDates = [...visitDates].sort((a, b) => a.getTime() - b.getTime());
  const lastDateObj = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : null;
  const lastVisitDate = lastDateObj ? lastDateObj.toISOString().split('T')[0] : null;

  const spacingEval = calculateSpacingStatus(
    doctor.category,
    visitCount,
    gapAnalysis.gaps,
    lastDateObj,
    periodEndDate
  );

  const overallStatus = calculateOverallStatus(
    doctor.category,
    targetEval.targetStatus,
    spacingEval.spacingStatus
  );

  // Frequency status description
  let frequencyStatus: DoctorComplianceStatus;
  let complianceRemarks = '';

  if (doctor.category === 'A') {
    if (targetEval.targetStatus === 'Achieved') {
      frequencyStatus = 'Target Met';
      complianceRemarks = spacingEval.spacingStatus === 'Spacing Violation'
        ? `Target achieved (2/2) but spacing violated (${gapAnalysis.formatted})`
        : `Target achieved (2/2) with compliant spacing (${gapAnalysis.formatted})`;
    } else if (visitCount === 1) {
      frequencyStatus = 'Frequency Short';
      complianceRemarks = '1/2 visits completed (Pending 1 visit per 15-day rule)';
    } else {
      frequencyStatus = 'Pending';
      complianceRemarks = 'Pending (0/2 visits completed)';
    }
  } else if (doctor.category === 'B') {
    if (visitCount === 0) {
      frequencyStatus = 'Pending';
      complianceRemarks = 'Pending (0/1 visits completed)';
    } else if (visitCount === 1) {
      frequencyStatus = 'Target Met';
      complianceRemarks = 'Target achieved (1/1 visit completed)';
    } else {
      if (spacingEval.hasPrematureRepeat) {
        frequencyStatus = 'Premature Repeat';
        complianceRemarks = `Target achieved (${visitCount} visits) with premature repeat (${gapAnalysis.minGap}d vs 30d norm)`;
      } else {
        frequencyStatus = 'Target Met';
        complianceRemarks = `Target achieved (${visitCount} visits, compliant spacing)`;
      }
    }
  } else {
    // C-Class
    if (visitCount > 0) {
      frequencyStatus = 'Covered';
      complianceRemarks = spacingEval.spacingStatus === 'Overdue'
        ? `Covered (${visitCount} visit${visitCount > 1 ? 's' : ''}), but ${spacingEval.overdueDays} days overdue`
        : `Rotational coverage compliant (${visitCount} visit${visitCount > 1 ? 's' : ''})`;
    } else {
      frequencyStatus = 'Current Month Not Covered';
      complianceRemarks = 'Pending rotation / Not visited in current reporting cycle';
    }
  }

  return {
    doctor,
    month: monthDisplay,
    requiredVisits: targetEval.requiredVisits,
    actualVisits: visitCount,
    visitCount,
    visits: doctorVisits,
    visitDatesFormatted,
    gaps: gapAnalysis.gaps,
    gapDetails: gapAnalysis.gapDetails,
    avgGap: gapAnalysis.avgGap,
    minGap: gapAnalysis.minGap,
    maxGap: gapAnalysis.maxGap,
    gapSummaryFormatted: gapAnalysis.formatted,
    targetStatus: targetEval.targetStatus,
    spacingStatus: spacingEval.spacingStatus,
    overallStatus,
    lastVisitDate,
    overdueDays: spacingEval.overdueDays,
    coverageStatus: visitCount > 0 ? 'Covered' : 'Pending',
    frequencyStatus,
    hasPrematureRepeat: spacingEval.hasPrematureRepeat,
    complianceRemarks,
  };
}

/**
 * Builds the month compliance record for a doctor within a specific calendar month
 */
export function evaluateDoctorMonthRecord(
  doctor: AssignedDoctor,
  monthVisits: DailyActivity[],
  monthKey: string,
  monthName: string,
  year: number
): MonthComplianceRecord {
  const monthDisplay = `${monthName} ${year}`;
  const evalRecord = evaluateDoctorCompliance(doctor, monthVisits, monthDisplay);
  const required = doctor.category === 'C' ? 0 : evalRecord.requiredVisits;
  const actual = evalRecord.actualVisits;

  // Build cell display: e.g. "2/2 ✓", "1/2 🔴", "0/1 🔴", "2/1 🟡"
  let symbol = '✓';
  let hasViolation = false;

  if (doctor.category === 'C') {
    symbol = actual > 0 ? '✓' : '—';
  } else if (evalRecord.targetStatus === 'Pending') {
    symbol = 'P';
    hasViolation = true;
  } else if (evalRecord.spacingStatus === 'Spacing Violation') {
    symbol = '✓';
    hasViolation = true;
  }

  const cellDisplay = doctor.category === 'C'
    ? (actual > 0 ? `${actual} ✓` : `—`)
    : `${actual}/${required} ${symbol}`;

  return {
    monthKey,
    monthName,
    monthDisplay,
    year,
    requiredVisits: required,
    actualVisits: actual,
    visitDates: evalRecord.visitDatesFormatted,
    gaps: evalRecord.gaps,
    targetStatus: evalRecord.targetStatus,
    spacingStatus: evalRecord.spacingStatus,
    overallStatus: evalRecord.overallStatus,
    cellDisplay,
    hasViolation,
  };
}

/**
 * Calculates six-month matrix analysis across multiple calendar months
 */
export function calculateSixMonthDoctorMatrix(
  assignedDoctors: AssignedDoctor[],
  monthlyActivitiesMap: Map<string, NormalizedActivity[]>,
  monthKeys: { key: string; name: string; year: number }[]
): SixMonthDoctorRecord[] {
  // Sort monthKeys chronologically
  const sortedMonths = [...monthKeys].sort((a, b) => a.key.localeCompare(b.key));

  return assignedDoctors.map(doctor => {
    const monthlyRecords: Record<string, MonthComplianceRecord> = {};
    let totalVisits = 0;
    let monthsAchieved = 0;
    let monthsPending = 0;
    let spacingViolations = 0;
    const allVisitDates: string[] = [];

    sortedMonths.forEach(m => {
      const monthActs = monthlyActivitiesMap.get(m.key) || [];
      // Filter activities for this doctor
      const docVisits = monthActs.filter(act => {
        // We match by docId if populated or name
        return (act as any).matchedDoctorId === doctor.id;
      });

      const mRecord = evaluateDoctorMonthRecord(doctor, docVisits, m.key, m.name, m.year);
      monthlyRecords[m.key] = mRecord;

      totalVisits += mRecord.actualVisits;
      if (doctor.category === 'C') {
        if (mRecord.actualVisits > 0) {
          monthsAchieved++;
        }
      } else {
        if (mRecord.targetStatus === 'Achieved') {
          monthsAchieved++;
        } else {
          monthsPending++;
        }
      }

      if (mRecord.spacingStatus === 'Spacing Violation') {
        spacingViolations++;
      }

      allVisitDates.push(...mRecord.visitDates);
    });

    const numMonths = sortedMonths.length;
    let requiredVisits = 0;
    if (doctor.category === 'A') {
      requiredVisits = numMonths * 2;
    } else if (doctor.category === 'B') {
      requiredVisits = numMonths * 1;
    } else {
      // C-Class 45-day rotation: rotational coverage, not fixed monthly target
      requiredVisits = 0;
    }

    const visitShortfall = Math.max(0, requiredVisits - totalVisits);
    const visitSurplus = Math.max(0, totalVisits - requiredVisits);

    // Section 12: Overall Status: Fully Compliant, Partially Compliant, Pending
    let overallEvaluation: 'Fully Compliant' | 'Partially Compliant' | 'Pending' = 'Fully Compliant';
    if (doctor.category === 'C') {
      overallEvaluation = totalVisits > 0 ? 'Fully Compliant' : 'Pending';
    } else {
      if (monthsPending === 0) {
        overallEvaluation = 'Fully Compliant';
      } else if (monthsAchieved > 0) {
        overallEvaluation = 'Partially Compliant';
      } else {
        overallEvaluation = 'Pending';
      }
    }

    allVisitDates.sort();
    const lastVisitDate = allVisitDates.length > 0 ? allVisitDates[allVisitDates.length - 1] : null;

    let overdueDays: number | null = null;
    if (doctor.category === 'C') {
      if (!lastVisitDate) {
        overdueDays = null;
      } else {
        const lastD = new Date(lastVisitDate);
        const now = new Date();
        const diff = Math.round((now.getTime() - lastD.getTime()) / (1000 * 60 * 60 * 24));
        if (diff > 45) {
          overdueDays = diff - 45;
        }
      }
    }

    return {
      doctor,
      monthlyRecords,
      requiredVisits,
      totalVisits,
      visitShortfall,
      visitSurplus,
      monthsAchieved,
      monthsPending,
      spacingViolations,
      overallEvaluation,
      lastVisitDate,
      overdueDays,
    };
  });
}
