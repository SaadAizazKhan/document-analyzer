export type DoctorCategory = 'A' | 'B' | 'C';

export interface AssignedDoctor {
  id: string;
  srNo: number | string;
  city: string;
  rawName: string;
  normalizedName: string;
  hospital: string;
  category: DoctorCategory;
}

export type ActivityType =
  | 'DOCTOR_VISIT'
  | 'OFFICE'
  | 'ADMIN'
  | 'PURCHASE'
  | 'OT_ACTIVITY'
  | 'MEETING'
  | 'CME'
  | 'CONFERENCE'
  | 'TRANSIT'
  | 'OTHER'
  | 'UNKNOWN';

export interface NormalizedActivity {
  id: string;
  date: string; // YYYY-MM-DD
  parsedDate: Date | null;
  day?: string;
  city?: string;
  meetingNumber?: number;
  jointWorkingWith?: string;
  originalCustomerText: string;
  originalHospitalText?: string;
  customerNames: string[];
  hospital?: string;
  product?: string;
  outcome?: string;
  remarks?: string;
  supportRequired?: string;
  campaignFeedback?: string;
  activityType: ActivityType;
  sourceFile?: string;
  sourceRowNumber: number;
}

// Keep DailyActivity as an alias or extension for compatibility
export type DailyActivity = NormalizedActivity;

export type MatchStatus = 'Strong' | 'Good' | 'Review Required' | 'Unmatched';

export interface MatchEvaluation {
  activityId: string;
  candidateName: string;
  matchedDoctor: AssignedDoctor | null;
  score: number; // 0 - 100
  status: MatchStatus;
  matchLevel: 'Level 1: Exact' | 'Level 2: Hospital' | 'Level 3: City' | 'Level 4: Fuzzy' | 'Unmatched' | 'Manual' | 'Non-Doctor Activity';
  reason: string;
  isCountedAsVisit: boolean;
  isDuplicateSameDay?: boolean;
  manualOverrideDoctorId?: string;
}

export interface DoctorVisitGap {
  fromDate: string;
  toDate: string;
  days: number;
}

export type TargetStatus = 'Achieved' | 'Pending';

export type SpacingStatus =
  | 'Compliant'
  | 'Spacing Violation'
  | 'N/A'
  | 'Rotation Compliant'
  | 'Overdue'
  | 'Pending Rotation';

export type OverallDoctorStatus =
  | 'COMPLIANT'
  | 'SPACING VIOLATION'
  | 'PENDING'
  | 'ROTATION COMPLIANT'
  | 'OVERDUE'
  | 'PENDING ROTATION';

export type DoctorComplianceStatus =
  | 'Target Met'
  | 'Frequency Short'
  | 'Pending'
  | 'Premature Repeat'
  | 'Current Month Not Covered'
  | 'Covered';

export interface DoctorAnalysisRecord {
  doctor: AssignedDoctor;
  month: string;
  requiredVisits: number;
  actualVisits: number;
  visitCount: number;
  visits: NormalizedActivity[];
  visitDatesFormatted: string[];
  gaps: number[];
  gapDetails: DoctorVisitGap[];
  avgGap: number | null;
  minGap: number | null;
  maxGap: number | null;
  gapSummaryFormatted: string;
  targetStatus: TargetStatus;
  spacingStatus: SpacingStatus;
  overallStatus: OverallDoctorStatus;
  lastVisitDate: string | null;
  overdueDays: number | null;
  coverageStatus: 'Covered' | 'Pending';
  frequencyStatus: DoctorComplianceStatus;
  hasPrematureRepeat: boolean;
  complianceRemarks: string;
}

export interface MonthComplianceRecord {
  monthKey: string; // YYYY-MM
  monthName: string; // e.g. "Aug"
  monthDisplay: string; // e.g. "August 2026"
  year: number;
  requiredVisits: number;
  actualVisits: number;
  visitDates: string[];
  gaps: number[];
  targetStatus: TargetStatus;
  spacingStatus: SpacingStatus;
  overallStatus: OverallDoctorStatus;
  cellDisplay: string; // e.g. "2/2 ✓", "1/2 🔴", "0/1 🔴", "2/1 🟡"
  hasViolation: boolean;
}

export interface SixMonthDoctorRecord {
  doctor: AssignedDoctor;
  monthlyRecords: Record<string, MonthComplianceRecord>;
  requiredVisits: number;
  totalVisits: number;
  visitShortfall: number;
  visitSurplus: number;
  monthsAchieved: number;
  monthsPending: number;
  spacingViolations: number;
  overallEvaluation: 'Fully Compliant' | 'Partially Compliant' | 'Pending';
  lastVisitDate: string | null;
  overdueDays: number | null;
}

export type AnalysisMode = 'single' | 'six_months';

export interface CategorySummary {
  category: DoctorCategory;
  fovRule: string;
  targetVisitsPerMonth: number;
  numberMonths?: number;
  totalRequiredVisits?: number;
  visitShortfall?: number;
  visitSurplus?: number;
  assignedDoctors: number;
  drsMet: number;
  totalVisitsDone: number;
  repeatedDrs: number;
  pendingDrs: number;
  fullyCompliantDrs?: number;
  partiallyCompliantDrs?: number;
  drsWithPendingMonths?: number;
  pendingDoctorMonths?: number;
  totalDoctorMonthSlots?: number;
  uniqueCoveragePct: number;
  frequencyAchievementPct: number;
  avgGapDays: number | null;
  daysDifferenceFormatted: string;
  auditRemarks: string;
}

export interface OverallSummary {
  totalAssigned: number;
  totalDrsMet: number;
  overallCoveragePct: number;
  totalVisitsDone: number;
  totalRepeatedDrs: number;
  totalPendingDrs: number;
  numberMonths?: number;
  totalRequiredVisits?: number;
  totalVisitShortfall?: number;
  totalFullyCompliantDrs?: number;
  totalPartiallyCompliantDrs?: number;
  totalDrsWithPendingMonths?: number;
  totalPendingDoctorMonths?: number;
  totalDoctorMonthSlots?: number;
  totalExceptions: number;
  auditRemarks: string;
}

export interface CitySummary {
  city: string;
  assigned: number;
  met: number;
  pending: number;
  totalVisits: number;
  coveragePct: number;
}

export interface ComplianceException {
  doctorName: string;
  category: DoctorCategory;
  city: string;
  hospital: string;
  visitCount: number;
  expectedVisits: number | string;
  actualVisits: number;
  visitDates: string;
  gapSummary: string;
  exceptionType: 'A-Class Single Visit (Frequency Short)' | 'B-Class Premature Repeat' | 'Pending Doctor (Zero Visits)' | 'Ambiguous Match';
  recommendation: string;
}

export interface UnmatchedActivityRecord {
  date: string;
  dailyReportDoctorName: string;
  hospital: string;
  city: string;
  matchingScore: number;
  reason: string;
  activityId: string;
}

export interface RawMatchedRecord {
  rowNumber: number;
  date: string;
  originalDoctorName: string;
  candidateDoctorName?: string;
  matchedDoctor: string;
  category: string;
  city: string;
  hospital: string;
  matchScore: number;
  matchStatus: MatchStatus;
  countedAsVisit: 'Yes' | 'No';
  isDuplicateSameDay?: boolean;
  activityType?: ActivityType;
  reason: string;
}

export interface ReportingPeriod {
  month: string;
  year: number;
}

export interface DailyReportDiagnostics {
  rawActivitiesCount: number;
  doctorCandidatesCount: number;
  matchedAssignedDoctorsCount: number;
  unmatchedDoctorCandidatesCount: number;
  nonDoctorActivitiesCount: number;
  duplicateSameDayRemovedCount: number;
  manualReviewsRequiredCount: number;
}

export interface ManagementSummaryRow {
  categoryKey: 'Class A' | 'Class B' | 'Class C' | 'Total Assigned List' | 'Unlisted / Extra Doctors';
  categoryLabel: string;
  visitRule: string;
  totalDoctors: number | '—';
  uniqueDoctorsVisited: number;
  fullyCompliant: number | '—';
  doctorsBelowTarget: number | '—';
  visitsRequired: number;
  visitsCompleted: number;
  visitGap: number;
  visitGapFormatted: string;
  targetAchievementPct: number | null;
  targetAchievementFormatted: string;
  auditStatus: string;
}

export interface MonthlyPerformanceSummaryRow {
  monthKey: string;
  month: string;
  uniqueDoctorsVisited: number;
  visitsCompleted: number;
  requiredVisits: number;
  visitGap: number;
  visitGapFormatted: string;
  achievementPct: number;
  achievementPctFormatted: string;
  doctorsFullyMeetingMonthlyTarget: number;
  doctorsBelowMonthlyTarget: number;
}

export interface CategoryMonthlyBreakdownRow {
  category: DoctorCategory;
  monthKey: string;
  month: string;
  assigned: number;
  required: number;
  completed: number;
  doctorsMet: number;
  doctorsMeetingTarget: number;
  doctorsBelowTarget: number;
}

export interface UnlistedDoctorVisit {
  date: string;
  month: string;
  candidateName: string;
  hospital: string;
  city: string;
  sourceFile?: string;
  sourceRowNumber?: number;
}

export interface AnalysisResult {
  employeeName?: string;
  reportingPeriod: ReportingPeriod;
  periodDisplay?: string;
  analysisMode: AnalysisMode;
  monthsList: string[];
  categorySummaries: CategorySummary[];
  overallSummary: OverallSummary;
  managementSummaryRows?: ManagementSummaryRow[];
  monthlyPerformanceSummary?: MonthlyPerformanceSummaryRow[];
  categoryMonthlyBreakdowns?: {
    A: CategoryMonthlyBreakdownRow[];
    B: CategoryMonthlyBreakdownRow[];
    C: CategoryMonthlyBreakdownRow[];
  };
  unlistedVisits?: UnlistedDoctorVisit[];
  doctorRecords: DoctorAnalysisRecord[];
  sixMonthRecords?: SixMonthDoctorRecord[];
  citySummaries: CitySummary[];
  exceptions: ComplianceException[];
  unmatchedRecords: UnmatchedActivityRecord[];
  rawMatchedRecords: RawMatchedRecord[];
  reviewQueue: MatchEvaluation[];
  normalizedActivities: NormalizedActivity[];
  diagnostics: DailyReportDiagnostics;
  validationStats: {
    totalAssignedLoaded: number;
    totalActivitiesLoaded: number;
    doctorVisitsIdentified: number;
    nonDoctorActivitiesFiltered: number;
    unmatchedCount: number;
    reviewRequiredCount: number;
  };
}
