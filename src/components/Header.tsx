import React from 'react';
import { FileSpreadsheet, Download, RefreshCw, ShieldCheck } from 'lucide-react';
import { AnalysisResult } from '../types/analyzer';
import { exportComplianceExcel } from '../services/excelExporter';

interface HeaderProps {
  analysis: AnalysisResult | null;
  onReset: () => void;
  onLoadSampleData: (month?: 'August' | 'September') => void;
  isLoadingSample: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  analysis,
  onReset,
  onLoadSampleData,
  isLoadingSample,
}) => {
  const handleExport = () => {
    if (!analysis) return;
    exportComplianceExcel(analysis);
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Application Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white shadow-sm font-semibold">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm tracking-tight text-white">
                  Doctor Visit Compliance Analyzer
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-blue-300 border border-slate-700">
                  <ShieldCheck className="w-3 h-3 mr-1 text-blue-400" />
                  Enterprise MVP
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-none">
                Field Force Audit & Compliance Engine
              </p>
            </div>
          </div>

          {/* Actions & Status */}
          <div className="flex items-center space-x-2">
            {analysis && (
              <div className="hidden md:flex items-center space-x-2 mr-3 px-2.5 py-1 bg-slate-800/80 rounded border border-slate-700/60 text-xs">
                <span className="text-slate-400">Employee:</span>
                <span className="font-medium text-slate-200">{analysis.employeeName || 'Paresh'}</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">Period:</span>
                <span className="font-medium text-blue-300">
                  {analysis.periodDisplay || `${analysis.reportingPeriod.month} ${analysis.reportingPeriod.year}`}
                </span>
              </div>
            )}

            {!analysis && (
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => onLoadSampleData('August')}
                  disabled={isLoadingSample}
                  className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 transition"
                  title="Load August 2026 dataset (Format A: Flat)"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoadingSample ? 'animate-spin' : ''}`} />
                  Demo: Aug (Format A)
                </button>
                <button
                  onClick={() => onLoadSampleData('September')}
                  disabled={isLoadingSample}
                  className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded bg-blue-900/80 text-blue-200 hover:bg-blue-800 hover:text-white border border-blue-700 transition"
                  title="Load September 2026 dataset (Format B: Meetings)"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoadingSample ? 'animate-spin' : ''}`} />
                  Demo: Sep (Format B)
                </button>
              </div>
            )}

            {analysis && (
              <>
                <button
                  onClick={onReset}
                  className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  New Upload
                </button>
                <button
                  onClick={handleExport}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm transition cursor-pointer"
                  title="Download complete 8-sheet corporate Excel workbook"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download Excel Report
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
