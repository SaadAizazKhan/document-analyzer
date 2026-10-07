import React, { useState } from 'react';
import {
  Upload,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  Sparkles,
  X,
  Layers,
  Calendar,
} from 'lucide-react';
import {
  parseAssignedDoctorsExcel,
  parseMultipleDailyReportExcels,
  ParseDoctorsResult,
  ParseDailyReportResult,
  DailyReportFileItem,
} from '../services/excelParser';
import { AnalysisMode, ReportingPeriod } from '../types/analyzer';

interface UploadSectionProps {
  onAnalyze: (
    doctorsResult: ParseDoctorsResult,
    dailyResult: ParseDailyReportResult,
    period: ReportingPeriod,
    employeeName: string,
    mode: AnalysisMode
  ) => void;
  onLoadSampleData: (month?: 'August' | 'September') => void;
  isLoadingSample: boolean;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onAnalyze,
  onLoadSampleData,
  isLoadingSample,
}) => {
  const [doctorsResult, setDoctorsResult] = useState<ParseDoctorsResult | null>(null);
  const [doctorsFileName, setDoctorsFileName] = useState<string>('');

  // Daily report file items (supports multiple files per Section 43)
  const [dailyFiles, setDailyFiles] = useState<DailyReportFileItem[]>([]);
  const [dailyResult, setDailyResult] = useState<ParseDailyReportResult | null>(null);

  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('single');
  const [employeeName, setEmployeeName] = useState<string>('Paresh');
  const [month, setMonth] = useState<string>('August');
  const [year, setYear] = useState<number>(2026);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<number>(0);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleDoctorsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDoctorsFileName(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const res = parseAssignedDoctorsExcel(buffer);
      setDoctorsResult(res);
    } catch (err: any) {
      setDoctorsResult({
        doctors: [],
        errors: [`Failed to read file: ${err.message}`],
        warnings: [],
      });
    }
  };

  const handleDailyUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const newItems: DailyReportFileItem[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const buffer = await file.arrayBuffer();
      newItems.push({ name: file.name, buffer });
    }

    const updated = [...dailyFiles, ...newItems];
    setDailyFiles(updated);

    // Reparse combined files
    const res = parseMultipleDailyReportExcels(updated);
    setDailyResult(res);
    if (res.detectedPeriod) {
      setMonth(res.detectedPeriod.month);
      setYear(res.detectedPeriod.year);
    }
  };

  const handleRemoveDailyFile = (index: number) => {
    const updated = dailyFiles.filter((_, idx) => idx !== index);
    setDailyFiles(updated);
    if (updated.length === 0) {
      setDailyResult(null);
    } else {
      const res = parseMultipleDailyReportExcels(updated);
      setDailyResult(res);
    }
  };

  const handleStartAnalysis = async () => {
    if (!doctorsResult || !dailyResult) return;
    if (doctorsResult.doctors.length === 0 || dailyResult.activities.length === 0) return;

    setIsProcessing(true);
    setAnalysisStep(1); // Reading
    await new Promise(r => setTimeout(r, 150));

    setAnalysisStep(2); // Normalizing
    await new Promise(r => setTimeout(r, 150));

    setAnalysisStep(3); // Matching
    await new Promise(r => setTimeout(r, 200));

    setAnalysisStep(4); // Calculating
    await new Promise(r => setTimeout(r, 150));

    setAnalysisStep(5); // Generating
    await new Promise(r => setTimeout(r, 100));

    onAnalyze(doctorsResult, dailyResult, { month, year }, employeeName, analysisMode);
    setIsProcessing(false);
  };

  const canAnalyze =
    doctorsResult &&
    doctorsResult.doctors.length > 0 &&
    doctorsResult.errors.length === 0 &&
    dailyResult &&
    dailyResult.activities.length > 0 &&
    dailyResult.errors.length === 0;

  // Breakdown metrics for pre-validation card (Section 44)
  const aCount = doctorsResult?.doctors.filter(d => d.category === 'A').length || 0;
  const bCount = doctorsResult?.doctors.filter(d => d.category === 'B').length || 0;
  const cCount = doctorsResult?.doctors.filter(d => d.category === 'C').length || 0;

  const totalRawRows = dailyResult?.activities.length || 0;
  const formatARows = dailyResult?.activities.filter(a => !a.meetingNumber).length || 0;
  const formatBRows = dailyResult?.activities.filter(a => !!a.meetingNumber).length || 0;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Introduction Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Doctor Visit Compliance &amp; Field Report Analyzer
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Upload the employee&apos;s <strong>Assigned Doctor Master List</strong> and one or more <strong>Daily Field Activity Reports</strong> to evaluate 15-day (A-Class), 30-day (B-Class), and 45-day (C-Class) field compliance metrics.
            </p>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => onLoadSampleData('August')}
              disabled={isLoadingSample}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
              title="Load demo data for August 2026"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              Demo: Aug 2026
            </button>
            <button
              onClick={() => onLoadSampleData('September')}
              disabled={isLoadingSample}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition"
              title="Load demo data for September 2026"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
              Demo: Sep 2026
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Mode Selector (Section 42 & 43) */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Analysis Mode</span>
          <p className="text-xs text-slate-500 mt-0.5">Select single-month drilldown or 6-month continuous matrix evaluation</p>
        </div>
        <div className="inline-flex rounded-md shadow-xs p-1 bg-slate-100 border border-slate-200">
          <button
            onClick={() => setAnalysisMode('single')}
            className={`px-4 py-1.5 text-xs font-semibold rounded transition ${
              analysisMode === 'single'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 inline mr-1.5" />
            Single Month
          </button>
          <button
            onClick={() => setAnalysisMode('six_months')}
            className={`px-4 py-1.5 text-xs font-semibold rounded transition ${
              analysisMode === 'six_months'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 inline mr-1.5" />
            Six Months (Matrix)
          </button>
        </div>
      </div>

      {/* Upload Dual Panel (Section 43) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {/* Panel 1: Master Doctor List */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. Assigned Doctor Master List
                </h2>
              </div>
              <span className="text-[11px] font-medium text-slate-400">Master Roster</span>
            </div>

            <label className="border border-dashed border-slate-300 hover:border-blue-500 hover:bg-slate-50/50 rounded-md p-4 text-center cursor-pointer flex flex-col items-center justify-center transition">
              <Upload className="w-6 h-6 text-slate-400 mb-2" />
              <span className="text-xs font-semibold text-blue-700">Choose Master File (.xlsx, .xls)</span>
              <span className="text-[11px] text-slate-400 mt-0.5">Columns: Doctor Name, Category, Hospital, City</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleDoctorsUpload}
                className="hidden"
              />
            </label>

            {doctorsFileName && (
              <div className="mt-3 text-xs text-slate-700 flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
                <div className="flex items-center truncate">
                  <FileCheck className="w-4 h-4 text-blue-600 mr-1.5 shrink-0" />
                  <span className="truncate font-medium">{doctorsFileName}</span>
                </div>
              </div>
            )}
          </div>

          {/* Validation Feedback */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            {doctorsResult && doctorsResult.errors.length > 0 && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>{doctorsResult.errors[0]}</div>
              </div>
            )}

            {doctorsResult && doctorsResult.doctors.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded p-2.5 text-xs text-emerald-800">
                <div className="flex items-center font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-1.5 shrink-0" />
                  <span>{doctorsResult.doctors.length} Assigned Doctors Loaded</span>
                </div>
                <div className="mt-1 flex items-center space-x-3 text-[11px] text-emerald-700 font-mono">
                  <span>A: {aCount}</span>
                  <span>•</span>
                  <span>B: {bCount}</span>
                  <span>•</span>
                  <span>C: {cCount}</span>
                </div>
              </div>
            )}

            {!doctorsResult && (
              <div className="text-[11px] text-slate-400 italic">No master file selected</div>
            )}
          </div>
        </div>

        {/* Panel 2: Daily Activity Reports (Multiple files allowed) */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Daily Field Report(s)
                </h2>
              </div>
              <span className="text-[11px] font-medium text-slate-400">Multiple files supported</span>
            </div>

            <label className="border border-dashed border-slate-300 hover:border-blue-500 hover:bg-slate-50/50 rounded-md p-4 text-center cursor-pointer flex flex-col items-center justify-center transition">
              <Upload className="w-6 h-6 text-slate-400 mb-2" />
              <span className="text-xs font-semibold text-blue-700">Upload Excel Files (Single or Multi-Month)</span>
              <span className="text-[11px] text-slate-400 mt-0.5">Supports Format A (Flat) &amp; Format B (Grouped Meetings)</span>
              <input
                type="file"
                multiple
                accept=".xlsx,.xls,.csv"
                onChange={handleDailyUpload}
                className="hidden"
              />
            </label>

            {dailyFiles.length > 0 && (
              <div className="mt-3 space-y-1.5 max-h-36 overflow-y-auto">
                <div className="text-[11px] font-semibold text-slate-600 uppercase">Selected Files ({dailyFiles.length}):</div>
                {dailyFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-200 px-2.5 py-1 rounded text-xs">
                    <div className="flex items-center truncate mr-2">
                      <FileCheck className="w-3.5 h-3.5 text-blue-600 mr-1.5 shrink-0" />
                      <span className="truncate text-slate-700">{file.name}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveDailyFile(idx)}
                      className="text-slate-400 hover:text-red-600 p-0.5 rounded transition"
                      title="Remove file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Validation Feedback */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            {dailyResult && dailyResult.errors.length > 0 && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>{dailyResult.errors[0]}</div>
              </div>
            )}

            {dailyResult && dailyResult.activities.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded p-2.5 text-xs text-emerald-800">
                <div className="flex items-center font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-1.5 shrink-0" />
                  <span>{dailyResult.activities.length} Total Field Activities Detected</span>
                </div>
                {dailyResult.detectedPeriod && (
                  <div className="mt-1 text-[11px] text-emerald-700">
                    Detected Primary Period: {dailyResult.detectedPeriod.month} {dailyResult.detectedPeriod.year}
                  </div>
                )}
              </div>
            )}

            {!dailyResult && (
              <div className="text-[11px] text-slate-400 italic">No daily report files selected</div>
            )}
          </div>
        </div>
      </div>

      {/* Pre-Analysis Validation Summary Card (Section 44) */}
      {canAnalyze && (
        <div className="bg-slate-900 text-white rounded-lg p-5 shadow-xs mb-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Data Pre-Validation Summary (Section 44)
            </span>
            <span className="text-xs text-emerald-400 font-medium">Pre-Flight Checks Passed</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
              <div className="text-slate-400 text-[11px]">Assigned Doctors</div>
              <div className="text-lg font-bold text-white mt-0.5">{doctorsResult?.doctors.length}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">A: {aCount} | B: {bCount} | C: {cCount}</div>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
              <div className="text-slate-400 text-[11px]">Daily Files</div>
              <div className="text-lg font-bold text-white mt-0.5">{dailyFiles.length}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{totalRawRows} raw rows</div>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
              <div className="text-slate-400 text-[11px]">Format Breakdown</div>
              <div className="text-base font-bold text-white mt-0.5">A: {formatARows} | B: {formatBRows}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Flat vs Meeting-N</div>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
              <div className="text-slate-400 text-[11px]">Analysis Target</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">
                {analysisMode === 'six_months' ? 'Six Months' : `${month} ${year}`}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Strict Calendar Boundary</div>
            </div>
          </div>
        </div>
      )}

      {/* Reporting Period & Parameters Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
          Reporting Cycle Configuration
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Employee Name
            </label>
            <input
              type="text"
              value={employeeName}
              onChange={e => setEmployeeName(e.target.value)}
              placeholder="e.g. Paresh"
              className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Primary Month
            </label>
            <select
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {months.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Primary Year
            </label>
            <select
              value={year}
              onChange={e => setYear(parseInt(e.target.value, 10))}
              className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Button & Processing Stages */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            {!canAnalyze ? (
              <span>Please upload the Master List and at least one Daily Report file to proceed.</span>
            ) : (
              <span className="text-emerald-700 font-medium">All datasets validated and ready for compliance audit.</span>
            )}
          </div>

          <button
            onClick={handleStartAnalysis}
            disabled={!canAnalyze || isProcessing}
            className={`inline-flex items-center px-5 py-2.5 rounded text-xs font-semibold shadow-xs transition ${
              canAnalyze && !isProcessing
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>Analyze Data</span>
            <ChevronRight className="w-4 h-4 ml-1.5" />
          </button>
        </div>

        {/* Multi-stage Progress Breakdown */}
        {isProcessing && (
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded text-xs font-mono space-y-1 text-slate-600">
            <div className={analysisStep >= 1 ? 'text-emerald-700 font-medium' : ''}>
              {analysisStep >= 1 ? '✓' : '○'} Reading assigned doctors &amp; daily activities
            </div>
            <div className={analysisStep >= 2 ? 'text-emerald-700 font-medium' : ''}>
              {analysisStep >= 2 ? '✓' : '○'} Normalizing doctor names &amp; classifying non-doctor activities
            </div>
            <div className={analysisStep >= 3 ? 'text-emerald-700 font-medium' : ''}>
              {analysisStep >= 3 ? '✓' : '○'} Candidate doctor matching &amp; same-day visit deduplication
            </div>
            <div className={analysisStep >= 4 ? 'text-emerald-700 font-medium' : ''}>
              {analysisStep >= 4 ? '✓' : '○'} Calculating two-dimensional compliance (Target vs Spacing) &amp; C-class rotational logic
            </div>
            <div className={analysisStep >= 5 ? 'text-emerald-700 font-medium' : ''}>
              {analysisStep >= 5 ? '✓' : '○'} Generating executive audit remarks &amp; doctor matrices
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
