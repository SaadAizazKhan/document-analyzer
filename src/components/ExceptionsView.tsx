import React, { useState } from 'react';
import { AlertTriangle, ClockAlert, Filter, AlertCircle } from 'lucide-react';
import { ComplianceException } from '../types/analyzer';

interface ExceptionsViewProps {
  exceptions: ComplianceException[];
}

export const ExceptionsView: React.FC<ExceptionsViewProps> = ({ exceptions }) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  const filtered = exceptions.filter(e => {
    if (filterType === 'ALL') return true;
    return e.exceptionType === filterType;
  });

  const getExceptionBadge = (type: string) => {
    if (type.includes('Single Visit')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3 mr-1" />
          A-Class Single Visit (Short)
        </span>
      );
    }
    if (type.includes('Premature Repeat')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
          <ClockAlert className="w-3 h-3 mr-1" />
          B-Class Premature Repeat
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
        <AlertCircle className="w-3 h-3 mr-1" />
        Pending (0 Visits)
      </span>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-xs mb-6 overflow-hidden">
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Compliance Exceptions &amp; Management Action Items ({exceptions.length})
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Accounts requiring corrective frequency adherence or premature repeat review
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700"
          >
            <option value="ALL">All Exceptions ({exceptions.length})</option>
            <option value="A-Class Single Visit (Frequency Short)">A-Class Frequency Short</option>
            <option value="B-Class Premature Repeat">B-Class Premature Repeat</option>
            <option value="Pending Doctor (Zero Visits)">Pending Doctors</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
              <th className="py-2.5 px-3">Doctor Name</th>
              <th className="py-2.5 px-3 text-center w-16">Cat</th>
              <th className="py-2.5 px-3">Territory &amp; Hospital</th>
              <th className="py-2.5 px-3 text-center">Visits (Act/Exp)</th>
              <th className="py-2.5 px-3">Exception Category</th>
              <th className="py-2.5 px-3">Audit Details / Gaps</th>
              <th className="py-2.5 px-3">Management Recommendation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                  No exceptions found for this filter.
                </td>
              </tr>
            ) : (
              filtered.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                    {item.doctorName}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="font-bold text-[11px] text-slate-700">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    <div>{item.city}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-xs">{item.hospital}</div>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">
                    <span className="font-bold text-slate-900">{item.actualVisits}</span>
                    <span className="text-slate-400"> / {item.expectedVisits}</span>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {getExceptionBadge(item.exceptionType)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                    <div className="font-mono text-slate-700">{item.visitDates}</div>
                    {item.gapSummary !== '—' && (
                      <div className="text-amber-700 font-medium text-[10px] mt-0.5">{item.gapSummary}</div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-600 leading-relaxed font-medium">
                    {item.recommendation}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
