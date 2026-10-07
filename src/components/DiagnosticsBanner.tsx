import React from 'react';
import { DailyReportDiagnostics } from '../types/analyzer';
import { FileText, Users, UserCheck, UserX, Briefcase, Copy, HelpCircle } from 'lucide-react';

interface DiagnosticsBannerProps {
  diagnostics: DailyReportDiagnostics;
  onOpenReview?: () => void;
}

export const DiagnosticsBanner: React.FC<DiagnosticsBannerProps> = ({
  diagnostics,
  onOpenReview,
}) => {
  const items = [
    {
      label: 'Raw Activities',
      value: diagnostics.rawActivitiesCount,
      icon: FileText,
      color: 'text-slate-700 bg-slate-100',
      description: 'Extracted Excel rows',
    },
    {
      label: 'Doctor Candidates',
      value: diagnostics.doctorCandidatesCount,
      icon: Users,
      color: 'text-blue-700 bg-blue-50',
      description: 'After multi-name split',
    },
    {
      label: 'Matched Assigned Doctors',
      value: diagnostics.matchedAssignedDoctorsCount,
      icon: UserCheck,
      color: 'text-emerald-700 bg-emerald-50',
      description: 'Mapped to Master List',
    },
    {
      label: 'Unmatched Candidates',
      value: diagnostics.unmatchedDoctorCandidatesCount,
      icon: UserX,
      color: 'text-rose-700 bg-rose-50',
      description: 'Not on Assigned List',
    },
    {
      label: 'Non-Doctor Activities',
      value: diagnostics.nonDoctorActivitiesCount,
      icon: Briefcase,
      color: 'text-purple-700 bg-purple-50',
      description: 'Admin, Office, CME, etc.',
    },
    {
      label: 'Same-Day Duplicates Removed',
      value: diagnostics.duplicateSameDayRemovedCount,
      icon: Copy,
      color: 'text-amber-700 bg-amber-50',
      description: 'Deduplicated to 1 visit/date',
    },
    {
      label: 'Manual Reviews Required',
      value: diagnostics.manualReviewsRequiredCount,
      icon: HelpCircle,
      color: diagnostics.manualReviewsRequiredCount > 0 ? 'text-amber-800 bg-amber-100 animate-pulse' : 'text-slate-600 bg-slate-100',
      description: '70%–84% match score',
      clickable: diagnostics.manualReviewsRequiredCount > 0,
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-xs mb-6">
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Ingestion &amp; Normalization Diagnostics (Section 22)
          </h3>
          <p className="text-[11px] text-slate-400">
            Automated pipeline verification for date/city propagation, multi-doctor splitting, and visit deduplication
          </p>
        </div>
        {diagnostics.manualReviewsRequiredCount > 0 && onOpenReview && (
          <button
            onClick={onOpenReview}
            className="text-[11px] font-semibold px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition"
          >
            Review {diagnostics.manualReviewsRequiredCount} Uncertain Matches
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              onClick={item.clickable && onOpenReview ? onOpenReview : undefined}
              className={`p-2.5 rounded border border-slate-200 bg-slate-50/50 flex flex-col justify-between ${
                item.clickable ? 'cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight truncate">
                  {item.label}
                </span>
                <div className={`p-1 rounded ${item.color}`}>
                  <Icon className="w-3 h-3" />
                </div>
              </div>
              <div className="text-base font-bold text-slate-900">
                {item.value}
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5" title={item.description}>
                {item.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
