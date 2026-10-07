import React from 'react';
import { X, Calendar, MapPin, Building2, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { DoctorAnalysisRecord } from '../types/analyzer';

interface DoctorDetailDrawerProps {
  record: DoctorAnalysisRecord | null;
  onClose: () => void;
}

export const DoctorDetailDrawer: React.FC<DoctorDetailDrawerProps> = ({ record, onClose }) => {
  if (!record) return null;

  const doc = record.doctor;
  const isA = doc.category === 'A';
  const isB = doc.category === 'B';
  const isC = doc.category === 'C';

  const categoryColor =
    isA ? 'bg-purple-100 text-purple-800 border-purple-200' :
    isB ? 'bg-blue-100 text-blue-800 border-blue-200' :
    'bg-emerald-100 text-emerald-800 border-emerald-200';

  const overallBadgeColor =
    record.overallStatus === 'COMPLIANT' || record.overallStatus === 'ROTATION COMPLIANT'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
      : record.overallStatus === 'SPACING VIOLATION' || record.overallStatus === 'OVERDUE'
      ? 'bg-amber-50 text-amber-700 border-amber-300'
      : 'bg-rose-50 text-rose-700 border-rose-300';

  const targetBadgeColor =
    record.targetStatus === 'Achieved'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-rose-50 text-rose-700 border-rose-200';

  const spacingBadgeColor =
    record.spacingStatus === 'Compliant' || record.spacingStatus === 'Rotation Compliant'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : record.spacingStatus === 'Spacing Violation' || record.spacingStatus === 'Overdue'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-slate-100 text-slate-600 border-slate-200';

  const expectedGapDays = isA ? 15 : isB ? 30 : 45;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end transition-opacity">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Drawer Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${categoryColor}`}>
                {doc.category}-Class
              </span>
              <span className="text-xs text-slate-400">Sr No. {doc.srNo}</span>
            </div>
            <h2 className="text-base font-bold text-white mt-1">
              {doc.rawName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body (Section 49) */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs text-slate-700">
          {/* Metadata Card */}
          <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-2">
            <div className="flex items-center text-slate-600">
              <Building2 className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-800">{doc.hospital || 'Hospital not specified'}</span>
            </div>
            <div className="flex items-center text-slate-600">
              <MapPin className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
              <span>{doc.city || 'Territory not specified'}</span>
            </div>
            <div className="flex items-center text-slate-600">
              <Calendar className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
              <span>Month: {record.month}</span>
            </div>
          </div>

          {/* Overall Status Banner */}
          <div className={`p-3 rounded border flex items-center justify-between ${overallBadgeColor}`}>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider">Overall Status</div>
              <div className="text-sm font-bold mt-0.5">{record.overallStatus}</div>
            </div>
            {record.overallStatus === 'COMPLIANT' || record.overallStatus === 'ROTATION COMPLIANT' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            ) : record.overallStatus === 'SPACING VIOLATION' || record.overallStatus === 'OVERDUE' ? (
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            ) : (
              <Clock className="w-6 h-6 text-rose-600" />
            )}
          </div>

          {/* Dual Compliance Dimensions (Section 8 & 28) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Dimension 1: Monthly Target Status */}
            <div className="border border-slate-200 rounded p-3 bg-white">
              <div className="text-[10px] uppercase font-semibold text-slate-400">Monthly Target</div>
              <div className="text-base font-bold text-slate-900 mt-1">
                {record.actualVisits} / {record.requiredVisits}
              </div>
              <div className="mt-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-block ${targetBadgeColor}`}>
                  {record.targetStatus === 'Achieved' ? 'Target Achieved' : 'Pending'}
                </span>
              </div>
            </div>

            {/* Dimension 2: Spacing Status */}
            <div className="border border-slate-200 rounded p-3 bg-white">
              <div className="text-[10px] uppercase font-semibold text-slate-400">Visit Spacing</div>
              <div className="text-base font-bold text-slate-900 mt-1">
                {record.avgGap !== null ? `${record.avgGap}d Avg` : '—'}
              </div>
              <div className="mt-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-block ${spacingBadgeColor}`}>
                  {record.spacingStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Visit Gaps & Spacing Calculations (Section 49) */}
          <div className="border border-slate-200 rounded p-3.5 bg-white space-y-2">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
              Spacing Interval Details
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
              <div>
                <span className="text-slate-400 text-[10px] block">Expected Gap Norm</span>
                <span className="font-semibold text-slate-800">{expectedGapDays} Days</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Actual Gap</span>
                <span className="font-semibold text-slate-800">
                  {record.minGap !== null ? `${record.minGap} Days` : '—'}
                </span>
              </div>
              {record.lastVisitDate && (
                <div>
                  <span className="text-slate-400 text-[10px] block">Last Visit Date</span>
                  <span className="font-semibold text-slate-800">{record.lastVisitDate}</span>
                </div>
              )}
              {isC && record.overdueDays !== null && (
                <div>
                  <span className="text-slate-400 text-[10px] block">Overdue Days</span>
                  <span className={`font-semibold ${record.overdueDays > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {record.overdueDays > 0 ? `${record.overdueDays}d Overdue` : 'Rotation on track'}
                  </span>
                </div>
              )}
            </div>

            {record.gapDetails.length > 0 && (
              <div className="mt-3 pt-2 border-t border-slate-100">
                <div className="text-[11px] font-semibold text-slate-700 mb-1.5">Consecutive Intervals:</div>
                <div className="space-y-1">
                  {record.gapDetails.map((gap, gIdx) => (
                    <div
                      key={gIdx}
                      className={`flex items-center justify-between p-1.5 rounded text-[11px] font-mono border ${
                        gap.days < expectedGapDays
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      <span>{gap.fromDate} $\rightarrow$ {gap.toDate}</span>
                      <span className="font-bold">{gap.days} Days ({gap.days < expectedGapDays ? 'Violation' : 'Compliant'})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Visit Dates Log */}
          <div className="border border-slate-200 rounded p-3.5 bg-white space-y-2">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center justify-between">
              <span>Logged Valid Visits ({record.visitDatesFormatted.length})</span>
            </div>

            {record.visitDatesFormatted.length === 0 ? (
              <div className="py-3 text-center text-slate-400 italic">
                Zero visits recorded in current reporting period
              </div>
            ) : (
              <div className="space-y-1.5 pt-1">
                {record.visitDatesFormatted.map((dateStr, vIdx) => (
                  <div key={vIdx} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                        {vIdx + 1}
                      </span>
                      <span className="font-mono text-slate-800">{dateStr}</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Valid Visit
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Compliance Audit Remarks */}
          <div className="border border-slate-200 rounded p-3.5 bg-white">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100 mb-2">
              Audit Remarks &amp; Finding
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
              {record.complianceRemarks}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
