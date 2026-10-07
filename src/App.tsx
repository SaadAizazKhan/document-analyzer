import React, { useState } from 'react';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { KpiSummaryCards } from './components/KpiSummaryCards';
import { ExecutiveCategoryTable } from './components/ExecutiveCategoryTable';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { DoctorDataGrid } from './components/DoctorDataGrid';
import { SixMonthMatrixGrid } from './components/SixMonthMatrixGrid';
import { ExceptionsView } from './components/ExceptionsView';
import { CitySummaryView } from './components/CitySummaryView';
import { RawDataSheetView } from './components/RawDataSheetView';
import { ReviewQueueModal } from './components/ReviewQueueModal';
import { DiagnosticsBanner } from './components/DiagnosticsBanner';
import { DailyActivityReviewScreen } from './components/DailyActivityReviewScreen';
import {
  AnalysisMode,
  AnalysisResult,
  AssignedDoctor,
  NormalizedActivity,
  ReportingPeriod,
} from './types/analyzer';
import { ParseDoctorsResult, ParseDailyReportResult } from './services/excelParser';
import { analyzeReport, ManualMatchOverride } from './analysis/analyzeReport';
import { loadSampleDataFiles } from './data/sampleDataLoader';
import { exportComplianceExcel } from './services/excelExporter';
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  MapPin,
  FileText,
  CheckSquare,
  HelpCircle,
  Download,
  Layers,
} from 'lucide-react';

export const App: React.FC = () => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [rawDoctors, setRawDoctors] = useState<AssignedDoctor[]>([]);
  const [rawActivities, setRawActivities] = useState<NormalizedActivity[]>([]);
  const [reportingPeriod, setReportingPeriod] = useState<ReportingPeriod>({ month: 'August', year: 2026 });
  const [employeeName, setEmployeeName] = useState<string>('Paresh');
  const [currentMode, setCurrentMode] = useState<AnalysisMode>('single');

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DOCTORS' | 'MATRIX' | 'EXCEPTIONS' | 'CITIES' | 'REVIEW' | 'AUDIT'>('OVERVIEW');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [manualOverrides, setManualOverrides] = useState<Record<string, ManualMatchOverride>>({});
  const [isLoadingSample, setIsLoadingSample] = useState<boolean>(false);

  const runAnalysis = (
    docs: AssignedDoctor[],
    acts: NormalizedActivity[],
    period: ReportingPeriod,
    emp: string,
    mode: AnalysisMode = currentMode,
    overrides = manualOverrides
  ) => {
    const res = analyzeReport(docs, acts, period, emp, overrides, mode);
    setAnalysis(res);
  };

  const handleAnalyzeUpload = (
    doctorsResult: ParseDoctorsResult,
    dailyResult: ParseDailyReportResult,
    period: ReportingPeriod,
    emp: string,
    mode: AnalysisMode
  ) => {
    setRawDoctors(doctorsResult.doctors);
    setRawActivities(dailyResult.activities);
    setReportingPeriod(period);
    setEmployeeName(emp);
    setCurrentMode(mode);
    setManualOverrides({});
    runAnalysis(doctorsResult.doctors, dailyResult.activities, period, emp, mode, {});
    setActiveTab(mode === 'six_months' ? 'MATRIX' : 'OVERVIEW');
  };

  const handleLoadSampleData = async (month: 'August' | 'September' = 'August') => {
    setIsLoadingSample(true);
    try {
      const { doctorsResult, dailyResult } = await loadSampleDataFiles(month);
      const period: ReportingPeriod = dailyResult.detectedPeriod || {
        month,
        year: 2026,
      };
      const emp = 'Paresh';
      setRawDoctors(doctorsResult.doctors);
      setRawActivities(dailyResult.activities);
      setReportingPeriod(period);
      setEmployeeName(emp);
      setCurrentMode('single');
      setManualOverrides({});
      runAnalysis(doctorsResult.doctors, dailyResult.activities, period, emp, 'single', {});
      setActiveTab('OVERVIEW');
    } catch (err: any) {
      alert(`Error loading sample data: ${err.message}`);
    } finally {
      setIsLoadingSample(false);
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setRawDoctors([]);
    setRawActivities([]);
    setManualOverrides({});
  };

  // Review queue & inline correction actions
  const handleConfirmMatch = (activityId: string) => {
    const updated: Record<string, ManualMatchOverride> = {
      ...manualOverrides,
      [activityId]: { activityId, action: 'confirm' },
    };
    setManualOverrides(updated);
    runAnalysis(rawDoctors, rawActivities, reportingPeriod, employeeName, currentMode, updated);
  };

  const handleRejectMatch = (activityId: string) => {
    const updated: Record<string, ManualMatchOverride> = {
      ...manualOverrides,
      [activityId]: { activityId, action: 'reject' },
    };
    setManualOverrides(updated);
    runAnalysis(rawDoctors, rawActivities, reportingPeriod, employeeName, currentMode, updated);
  };

  const handleAssignDoctor = (activityId: string, doctorId: string) => {
    const updated: Record<string, ManualMatchOverride> = {
      ...manualOverrides,
      [activityId]: { activityId, action: 'assign', assignedDoctorId: doctorId },
    };
    setManualOverrides(updated);
    runAnalysis(rawDoctors, rawActivities, reportingPeriod, employeeName, currentMode, updated);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Header
        analysis={analysis}
        onReset={handleReset}
        onLoadSampleData={handleLoadSampleData}
        isLoadingSample={isLoadingSample}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!analysis ? (
          <UploadSection
            onAnalyze={handleAnalyzeUpload}
            onLoadSampleData={handleLoadSampleData}
            isLoadingSample={isLoadingSample}
          />
        ) : (
          <div>
            {/* Diagnostics Banner (Section 22) */}
            <DiagnosticsBanner
              diagnostics={analysis.diagnostics}
              onOpenReview={() => setIsReviewModalOpen(true)}
            />

            {/* Top Sub-Bar with Tabs & Review Warning */}
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-5 border-b border-slate-200 gap-4">
              {/* Tab Navigation */}
              <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto text-xs">
                <button
                  onClick={() => setActiveTab('OVERVIEW')}
                  className={`inline-flex items-center px-3 py-2 rounded-md font-semibold transition cursor-pointer ${
                    activeTab === 'OVERVIEW'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
                  Overview &amp; Executive Summary
                </button>

                <button
                  onClick={() => setActiveTab('DOCTORS')}
                  className={`inline-flex items-center px-3 py-2 rounded-md font-semibold transition cursor-pointer ${
                    activeTab === 'DOCTORS'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 mr-1.5" />
                  Doctor Analysis ({analysis.doctorRecords.length})
                </button>

                {analysis.sixMonthRecords && analysis.sixMonthRecords.length > 0 && (
                  <button
                    onClick={() => setActiveTab('MATRIX')}
                    className={`inline-flex items-center px-3 py-2 rounded-md font-semibold transition cursor-pointer ${
                      activeTab === 'MATRIX'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 mr-1.5" />
                    6-Month Matrix
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('EXCEPTIONS')}
                  className={`inline-flex items-center px-3 py-2 rounded-md font-semibold transition cursor-pointer ${
                    activeTab === 'EXCEPTIONS'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                  Exceptions ({analysis.exceptions.length})
                </button>

                <button
                  onClick={() => setActiveTab('CITIES')}
                  className={`inline-flex items-center px-3 py-2 rounded-md font-semibold transition cursor-pointer ${
                    activeTab === 'CITIES'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 mr-1.5" />
                  City Summary ({analysis.citySummaries.length})
                </button>

                <button
                  onClick={() => setActiveTab('REVIEW')}
                  className={`inline-flex items-center px-3 py-2 rounded-md font-semibold transition cursor-pointer ${
                    activeTab === 'REVIEW'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
                  Activity Review ({analysis.rawMatchedRecords.length})
                </button>

                <button
                  onClick={() => setActiveTab('AUDIT')}
                  className={`inline-flex items-center px-3 py-2 rounded-md font-semibold transition cursor-pointer ${
                    activeTab === 'AUDIT'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  Audit Trail &amp; Raw Logs ({analysis.rawMatchedRecords.length})
                </button>
              </nav>

              {/* Review Queue Notification Button & Excel Export */}
              <div className="flex items-center space-x-2 shrink-0">
                {analysis.reviewQueue.length > 0 && (
                  <button
                    onClick={() => setIsReviewModalOpen(true)}
                    className="inline-flex items-center px-2.5 py-1.5 text-xs font-semibold rounded bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition animate-pulse cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                    Review Matches ({analysis.reviewQueue.length} pending)
                  </button>
                )}
                <button
                  onClick={() => exportComplianceExcel(analysis)}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition cursor-pointer"
                  title="Download complete 8-sheet corporate Excel workbook"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download Excel Report
                </button>
              </div>
            </div>

            {/* TAB CONTENTS */}
            {activeTab === 'OVERVIEW' && (
              <div>
                <KpiSummaryCards analysis={analysis} />
                <ExecutiveCategoryTable
                  categorySummaries={analysis.categorySummaries}
                  overallSummary={analysis.overallSummary}
                  managementSummaryRows={analysis.managementSummaryRows}
                  monthlyPerformanceSummary={analysis.monthlyPerformanceSummary}
                  categoryMonthlyBreakdowns={analysis.categoryMonthlyBreakdowns}
                />
                <AnalyticsCharts analysis={analysis} />
              </div>
            )}

            {activeTab === 'DOCTORS' && (
              <DoctorDataGrid records={analysis.doctorRecords} />
            )}

            {activeTab === 'MATRIX' && analysis.sixMonthRecords && (
              <SixMonthMatrixGrid
                records={analysis.sixMonthRecords}
                monthsList={analysis.monthsList}
              />
            )}

            {activeTab === 'EXCEPTIONS' && (
              <ExceptionsView exceptions={analysis.exceptions} />
            )}

            {activeTab === 'CITIES' && (
              <CitySummaryView citySummaries={analysis.citySummaries} />
            )}

            {activeTab === 'REVIEW' && (
              <DailyActivityReviewScreen
                rawMatchedRecords={analysis.rawMatchedRecords}
                assignedDoctors={rawDoctors}
                onConfirmMatch={handleConfirmMatch}
                onRejectMatch={handleRejectMatch}
                onAssignDoctor={handleAssignDoctor}
              />
            )}

            {activeTab === 'AUDIT' && (
              <RawDataSheetView
                rawMatchedRecords={analysis.rawMatchedRecords}
                unmatchedRecords={analysis.unmatchedRecords}
              />
            )}
          </div>
        )}
      </main>

      {/* Review Queue Modal */}
      {analysis && isReviewModalOpen && (
        <ReviewQueueModal
          reviewQueue={analysis.reviewQueue}
          assignedDoctors={rawDoctors}
          onConfirmMatch={handleConfirmMatch}
          onRejectMatch={handleRejectMatch}
          onAssignDoctor={handleAssignDoctor}
          onClose={() => setIsReviewModalOpen(false)}
        />
      )}

      {/* Minimal Enterprise Footer */}
      <footer className="bg-slate-100 border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        Doctor Visit Compliance Analyzer • In-Memory Calculation Engine • Enterprise Field Force Audit
      </footer>
    </div>
  );
};
