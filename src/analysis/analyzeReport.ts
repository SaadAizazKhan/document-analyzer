import {
  AnalysisMode,
  AnalysisResult,
  AssignedDoctor,
  CategoryMonthlyBreakdownRow,
  DailyReportDiagnostics,
  DoctorAnalysisRecord,
  ManagementSummaryRow,
  MatchEvaluation,
  MonthlyPerformanceSummaryRow,
  NormalizedActivity,
  RawMatchedRecord,
  ReportingPeriod,
  SixMonthDoctorRecord,
  UnlistedDoctorVisit,
  UnmatchedActivityRecord,
} from '../types/analyzer';
import { matchDailyActivity } from './matchDoctor';
import { checkNonDoctorActivity } from './nonDoctorDetector';
import {
  calculateSixMonthDoctorMatrix,
  evaluateDoctorCompliance,
} from './calculateCompliance';
import {
  calculateCategoryMonthlyBreakdowns,
  calculateCategorySummaries,
  calculateCitySummaries,
  calculateMonthlyPerformanceSummary,
  calculateOverallSummary,
  calculateSixMonthManagementSummary,
  extractComplianceExceptions,
} from './calculateSummaries';

export interface ManualMatchOverride {
  activityId: string;
  candidateName?: string;
  action: 'confirm' | 'reject' | 'assign';
  assignedDoctorId?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function analyzeReport(
  assignedDoctors: AssignedDoctor[],
  dailyActivities: NormalizedActivity[],
  reportingPeriod: ReportingPeriod,
  employeeName?: string,
  manualOverrides: Record<string, ManualMatchOverride> = {},
  analysisMode: AnalysisMode = 'single'
): AnalysisResult {
  const doctorVisitsMap = new Map<string, NormalizedActivity[]>();
  assignedDoctors.forEach(doc => {
    doctorVisitsMap.set(doc.id, []);
  });

  const rawMatchedRecords: RawMatchedRecord[] = [];
  const unmatchedRecords: UnmatchedActivityRecord[] = [];
  const reviewQueue: MatchEvaluation[] = [];
  const unlistedVisits: UnlistedDoctorVisit[] = [];

  // Deduplication tracking: doctorId + visitDate
  const visitedDoctorDateSet = new Set<string>();

  // Diagnostic counters per Section 22
  const rawActivitiesCount = dailyActivities.length;
  let doctorCandidatesCount = 0;
  let matchedAssignedDoctorsCount = 0;
  let unmatchedDoctorCandidatesCount = 0;
  let nonDoctorActivitiesCount = 0;
  let duplicateSameDayRemovedCount = 0;
  let manualReviewsRequiredCount = 0;

  // Track all unique months present in daily activities: "YYYY-MM"
  const detectedMonthsSet = new Set<string>();

  dailyActivities.forEach((activity, rowIdx) => {
    if (activity.date && activity.date.length >= 7) {
      detectedMonthsSet.add(activity.date.substring(0, 7));
    }

    const isNonDoctor = activity.activityType && activity.activityType !== 'DOCTOR_VISIT';

    if (isNonDoctor) {
      nonDoctorActivitiesCount++;
      rawMatchedRecords.push({
        rowNumber: activity.sourceRowNumber || rowIdx + 1,
        date: activity.date || '—',
        originalDoctorName: activity.originalCustomerText || '—',
        candidateDoctorName: '—',
        matchedDoctor: '—',
        category: '—',
        city: activity.city || '—',
        hospital: activity.hospital || '—',
        matchScore: 0,
        matchStatus: 'Unmatched',
        countedAsVisit: 'No',
        isDuplicateSameDay: false,
        activityType: activity.activityType,
        reason: `Non-doctor activity (${activity.activityType})`,
      });
      return;
    }

    // Process doctor candidates (split multi-doctor cells)
    const candidates = activity.customerNames && activity.customerNames.length > 0
      ? activity.customerNames
      : [activity.originalCustomerText];

    // Track candidates within the same row to prevent duplicate counting in the same cell
    const seenDoctorsInCurrentRow = new Set<string>();

    candidates.forEach((candidateName, candidateIdx) => {
      const cleanCand = candidateName.trim();
      if (!cleanCand) return;

      // Candidate-level non-doctor filter (e.g. "Office", "xx", "CIMS Hospital Team" in comma-separated list)
      const candCheck = checkNonDoctorActivity(cleanCand);
      if (candCheck.isNonDoctor && !candCheck.isMultipleDoctors) {
        nonDoctorActivitiesCount++;
        rawMatchedRecords.push({
          rowNumber: activity.sourceRowNumber || rowIdx + 1,
          date: activity.date || '—',
          originalDoctorName: activity.originalCustomerText,
          candidateDoctorName: cleanCand,
          matchedDoctor: '—',
          category: '—',
          city: activity.city || '—',
          hospital: activity.hospital || '—',
          matchScore: 0,
          matchStatus: 'Unmatched',
          countedAsVisit: 'No',
          isDuplicateSameDay: false,
          activityType: 'OFFICE',
          reason: candCheck.reason || `Non-doctor entry (${cleanCand})`,
        });
        return;
      }

      doctorCandidatesCount++;

      const overrideKey = `${activity.id}_${candidateIdx}`;
      const generalKey = activity.id;
      const override = manualOverrides[overrideKey] || manualOverrides[generalKey];

      let evalResult = matchDailyActivity(activity, cleanCand, assignedDoctors);

      if (override) {
        if (override.action === 'confirm' && evalResult.matchedDoctor) {
          evalResult = {
            ...evalResult,
            status: 'Strong',
            score: 100,
            isCountedAsVisit: true,
            matchLevel: 'Manual',
            reason: `Manually confirmed by user (${evalResult.matchedDoctor.rawName})`,
          };
        } else if (override.action === 'reject') {
          evalResult = {
            ...evalResult,
            matchedDoctor: null,
            status: 'Unmatched',
            isCountedAsVisit: false,
            matchLevel: 'Manual',
            reason: 'Manually marked as non-doctor / unassigned by user',
          };
        } else if (override.action === 'assign' && override.assignedDoctorId) {
          const doc = assignedDoctors.find(d => d.id === override.assignedDoctorId);
          if (doc) {
            evalResult = {
              ...evalResult,
              matchedDoctor: doc,
              score: 100,
              status: 'Strong',
              isCountedAsVisit: true,
              matchLevel: 'Manual',
              reason: `Manually mapped to ${doc.rawName}`,
            };
          }
        }
      }

      const dateDisplay = activity.date || '—';

      // Check if this candidate matched an assigned doctor
      if (evalResult.isCountedAsVisit && evalResult.matchedDoctor) {
        matchedAssignedDoctorsCount++;
        const docId = evalResult.matchedDoctor.id;
        const dedupKey = `${docId}__${activity.date}`;

        const isDuplicateInRow = seenDoctorsInCurrentRow.has(docId);
        const isDuplicateSameDate = visitedDoctorDateSet.has(dedupKey);

        if (isDuplicateInRow || isDuplicateSameDate) {
          duplicateSameDayRemovedCount++;
          rawMatchedRecords.push({
            rowNumber: activity.sourceRowNumber || rowIdx + 1,
            date: dateDisplay,
            originalDoctorName: activity.originalCustomerText,
            candidateDoctorName: cleanCand,
            matchedDoctor: evalResult.matchedDoctor.rawName,
            category: evalResult.matchedDoctor.category,
            city: activity.city || evalResult.matchedDoctor.city,
            hospital: activity.hospital || evalResult.matchedDoctor.hospital,
            matchScore: evalResult.score,
            matchStatus: evalResult.status,
            countedAsVisit: 'No',
            isDuplicateSameDay: true,
            activityType: 'DOCTOR_VISIT',
            reason: isDuplicateInRow
              ? 'Duplicate doctor occurrence in same row (deduplicated)'
              : 'Multiple meetings with same doctor on same date (deduplicated to 1 valid visit)',
          });
        } else {
          // Valid distinct visit
          seenDoctorsInCurrentRow.add(docId);
          visitedDoctorDateSet.add(dedupKey);

          // Tag matched doctor ID on the activity instance for grouping
          const enrichedActivity: NormalizedActivity & { matchedDoctorId?: string } = {
            ...activity,
            matchedDoctorId: docId,
          };

          const visits = doctorVisitsMap.get(docId);
          if (visits) {
            visits.push(enrichedActivity);
          }

          rawMatchedRecords.push({
            rowNumber: activity.sourceRowNumber || rowIdx + 1,
            date: dateDisplay,
            originalDoctorName: activity.originalCustomerText,
            candidateDoctorName: cleanCand,
            matchedDoctor: evalResult.matchedDoctor.rawName,
            category: evalResult.matchedDoctor.category,
            city: activity.city || evalResult.matchedDoctor.city,
            hospital: activity.hospital || evalResult.matchedDoctor.hospital,
            matchScore: evalResult.score,
            matchStatus: evalResult.status,
            countedAsVisit: 'Yes',
            isDuplicateSameDay: false,
            activityType: 'DOCTOR_VISIT',
            reason: evalResult.reason,
          });
        }
      } else if (evalResult.status === 'Review Required') {
        manualReviewsRequiredCount++;
        reviewQueue.push(evalResult);

        rawMatchedRecords.push({
          rowNumber: activity.sourceRowNumber || rowIdx + 1,
          date: dateDisplay,
          originalDoctorName: activity.originalCustomerText,
          candidateDoctorName: cleanCand,
          matchedDoctor: evalResult.matchedDoctor ? evalResult.matchedDoctor.rawName : '—',
          category: evalResult.matchedDoctor ? evalResult.matchedDoctor.category : '—',
          city: activity.city || (evalResult.matchedDoctor ? evalResult.matchedDoctor.city : '—'),
          hospital: activity.hospital || (evalResult.matchedDoctor ? evalResult.matchedDoctor.hospital : '—'),
          matchScore: evalResult.score,
          matchStatus: evalResult.status,
          countedAsVisit: 'No',
          isDuplicateSameDay: false,
          activityType: 'DOCTOR_VISIT',
          reason: evalResult.reason,
        });
      } else {
        // Unmatched doctor candidate -> Unlisted / Extra Doctor Visit
        unmatchedDoctorCandidatesCount++;
        unlistedVisits.push({
          date: dateDisplay,
          month: activity.date ? activity.date.substring(0, 7) : '—',
          candidateName: cleanCand,
          hospital: activity.hospital || '—',
          city: activity.city || '—',
          sourceFile: activity.sourceFile,
          sourceRowNumber: activity.sourceRowNumber || rowIdx + 1,
        });

        unmatchedRecords.push({
          date: dateDisplay,
          dailyReportDoctorName: cleanCand,
          hospital: activity.hospital || '—',
          city: activity.city || '—',
          matchingScore: evalResult.score,
          reason: evalResult.reason,
          activityId: `${activity.id}_${candidateIdx}`,
        });

        rawMatchedRecords.push({
          rowNumber: activity.sourceRowNumber || rowIdx + 1,
          date: dateDisplay,
          originalDoctorName: activity.originalCustomerText,
          candidateDoctorName: cleanCand,
          matchedDoctor: '—',
          category: '—',
          city: activity.city || '—',
          hospital: activity.hospital || '—',
          matchScore: evalResult.score,
          matchStatus: evalResult.status,
          countedAsVisit: 'No',
          isDuplicateSameDay: false,
          activityType: 'DOCTOR_VISIT',
          reason: evalResult.reason,
        });
      }
    });
  });

  // Calculate reporting period string and end date
  const monthDisplay = `${reportingPeriod.month} ${reportingPeriod.year}`;
  const monthIndex = MONTH_NAMES.indexOf(reportingPeriod.month);
  const periodEndDate = monthIndex >= 0
    ? new Date(reportingPeriod.year, monthIndex + 1, 0)
    : null;

  // Calculate doctor compliance records for current selected period
  const doctorRecords: DoctorAnalysisRecord[] = assignedDoctors.map(doc => {
    const visits = doctorVisitsMap.get(doc.id) || [];
    // If in single-month mode, filter visits strictly belonging to this month
    const filteredVisits = analysisMode === 'single' && monthIndex >= 0
      ? visits.filter(v => {
          if (!v.date) return false;
          const [yStr, mStr] = v.date.split('-');
          return parseInt(yStr, 10) === reportingPeriod.year && parseInt(mStr, 10) === monthIndex + 1;
        })
      : visits;

    return evaluateDoctorCompliance(doc, filteredVisits, monthDisplay, periodEndDate);
  });

// Helper to build continuous inclusive month sequence between min and max month
function getInclusiveMonthKeys(
  detectedMonthKeys: string[],
  fallbackPeriod: ReportingPeriod,
  mode: AnalysisMode
): { key: string; name: string; year: number }[] {
  if (detectedMonthKeys.length === 0) {
    const mIdx = MONTH_NAMES.indexOf(fallbackPeriod.month);
    const mNum = mIdx >= 0 ? mIdx + 1 : 1;
    const key = `${fallbackPeriod.year}-${String(mNum).padStart(2, '0')}`;
    const name = mIdx >= 0 ? SHORT_MONTH_NAMES[mIdx] : fallbackPeriod.month.substring(0, 3);
    return [{ key, name, year: fallbackPeriod.year }];
  }

  const sorted = [...detectedMonthKeys].sort();
  let minKey = sorted[0];
  let maxKey = sorted[sorted.length - 1];

  // If in six_months mode and only 1 month detected, expand to 6 months ending in maxKey
  if (mode === 'six_months' && sorted.length === 1) {
    const [maxY, maxM] = maxKey.split('-').map(Number);
    let startM = maxM - 5;
    let startY = maxY;
    if (startM < 1) {
      startM += 12;
      startY -= 1;
    }
    minKey = `${startY}-${String(startM).padStart(2, '0')}`;
  }

  const [minY, minM] = minKey.split('-').map(Number);
  const [maxY, maxM] = maxKey.split('-').map(Number);

  const result: { key: string; name: string; year: number }[] = [];
  let y = minY;
  let m = minM;

  while (y < maxY || (y === maxY && m <= maxM)) {
    const key = `${y}-${String(m).padStart(2, '0')}`;
    result.push({
      key,
      name: SHORT_MONTH_NAMES[m - 1],
      year: y,
    });
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }

  return result;
}

  // Build multi-month / 6-month matrix if applicable or if multiple months detected
  const isMultiMonth = analysisMode === 'six_months' || detectedMonthsSet.size > 1;
  const monthKeys = isMultiMonth
    ? getInclusiveMonthKeys(Array.from(detectedMonthsSet), reportingPeriod, analysisMode)
    : (detectedMonthsSet.size > 0
        ? Array.from(detectedMonthsSet).sort().map(ym => {
            const [y, m] = ym.split('-');
            const mIdx = parseInt(m, 10) - 1;
            return { key: ym, name: SHORT_MONTH_NAMES[mIdx], year: parseInt(y, 10) };
          })
        : [{
            key: `${reportingPeriod.year}-${String(MONTH_NAMES.indexOf(reportingPeriod.month) + 1).padStart(2, '0')}`,
            name: SHORT_MONTH_NAMES[MONTH_NAMES.indexOf(reportingPeriod.month)] || reportingPeriod.month.substring(0, 3),
            year: reportingPeriod.year,
          }]);

  const monthsList = monthKeys.map(mk => `${mk.name} ${mk.year}`);
  const numMonths = isMultiMonth ? monthKeys.length : 1;

  const periodDisplay = isMultiMonth
    ? `${monthKeys[0].name} ${monthKeys[0].year} – ${monthKeys[monthKeys.length - 1].name} ${monthKeys[monthKeys.length - 1].year} (${numMonths} Months)`
    : `${reportingPeriod.month} ${reportingPeriod.year}`;

  let sixMonthRecords: SixMonthDoctorRecord[] | undefined;

  // Always compute sixMonthRecords if multi-month mode
  if (isMultiMonth) {
    // Group all valid visits by monthKey
    const monthlyActivitiesMap = new Map<string, NormalizedActivity[]>();
    monthKeys.forEach(mk => monthlyActivitiesMap.set(mk.key, []));

    assignedDoctors.forEach(doc => {
      const docVisits = doctorVisitsMap.get(doc.id) || [];
      docVisits.forEach(v => {
        if (v.date && v.date.length >= 7) {
          const mKey = v.date.substring(0, 7);
          const list = monthlyActivitiesMap.get(mKey);
          if (list) {
            list.push({ ...v, matchedDoctorId: doc.id } as any);
          }
        }
      });
    });

    sixMonthRecords = calculateSixMonthDoctorMatrix(
      assignedDoctors,
      monthlyActivitiesMap,
      monthKeys
    );
  }

  // Calculate summaries (multi-month aware per multi-month-logic.md and desire-output.md)
  const categorySummaries = calculateCategorySummaries(doctorRecords, sixMonthRecords, numMonths);
  const exceptions = extractComplianceExceptions(doctorRecords);
  const overallSummary = calculateOverallSummary(categorySummaries, exceptions.length, numMonths);
  const citySummaries = calculateCitySummaries(doctorRecords);

  let managementSummaryRows: ManagementSummaryRow[] | undefined;
  let monthlyPerformanceSummary: MonthlyPerformanceSummaryRow[] | undefined;
  let categoryMonthlyBreakdowns: {
    A: CategoryMonthlyBreakdownRow[];
    B: CategoryMonthlyBreakdownRow[];
    C: CategoryMonthlyBreakdownRow[];
  } | undefined;

  if (isMultiMonth && sixMonthRecords) {
    managementSummaryRows = calculateSixMonthManagementSummary(
      assignedDoctors,
      sixMonthRecords,
      numMonths,
      unlistedVisits
    );

    monthlyPerformanceSummary = calculateMonthlyPerformanceSummary(
      assignedDoctors,
      sixMonthRecords,
      monthKeys
    );

    categoryMonthlyBreakdowns = calculateCategoryMonthlyBreakdowns(
      sixMonthRecords,
      monthKeys
    );
  }

  const diagnostics: DailyReportDiagnostics = {
    rawActivitiesCount,
    doctorCandidatesCount,
    matchedAssignedDoctorsCount,
    unmatchedDoctorCandidatesCount,
    nonDoctorActivitiesCount,
    duplicateSameDayRemovedCount,
    manualReviewsRequiredCount,
  };

  return {
    employeeName,
    reportingPeriod,
    periodDisplay,
    analysisMode,
    monthsList,
    categorySummaries,
    overallSummary,
    managementSummaryRows,
    monthlyPerformanceSummary,
    categoryMonthlyBreakdowns,
    unlistedVisits,
    doctorRecords,
    sixMonthRecords,
    citySummaries,
    exceptions,
    unmatchedRecords,
    rawMatchedRecords,
    reviewQueue,
    normalizedActivities: dailyActivities,
    diagnostics,
    validationStats: {
      totalAssignedLoaded: assignedDoctors.length,
      totalActivitiesLoaded: dailyActivities.length,
      doctorVisitsIdentified: visitedDoctorDateSet.size,
      nonDoctorActivitiesFiltered: nonDoctorActivitiesCount,
      unmatchedCount: unmatchedDoctorCandidatesCount,
      reviewRequiredCount: manualReviewsRequiredCount,
    },
  };
}
