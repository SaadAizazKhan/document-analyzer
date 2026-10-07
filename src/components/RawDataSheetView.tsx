import React, { useState } from 'react';
import { RawMatchedRecord, UnmatchedActivityRecord } from '../types/analyzer';
import { CheckCircle2, XCircle } from 'lucide-react';

interface RawDataSheetViewProps {
  rawMatchedRecords: RawMatchedRecord[];
  unmatchedRecords: UnmatchedActivityRecord[];
}

export const RawDataSheetView: React.FC<RawDataSheetViewProps> = ({
  rawMatchedRecords,
  unmatchedRecords,
}) => {
  const [activeTab, setActiveTab] = useState<'RAW' | 'UNMATCHED'>('RAW');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRaw = rawMatchedRecords.filter(r => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.originalDoctorName.toLowerCase().includes(term) ||
      r.matchedDoctor.toLowerCase().includes(term) ||
      r.hospital.toLowerCase().includes(term) ||
      r.city.toLowerCase().includes(term) ||
      r.reason.toLowerCase().includes(term)
    );
  });

  const filteredUnmatched = unmatchedRecords.filter(u => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      u.dailyReportDoctorName.toLowerCase().includes(term) ||
      u.hospital.toLowerCase().includes(term) ||
      u.city.toLowerCase().includes(term) ||
      u.reason.toLowerCase().includes(term)
    );
  });

  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-xs mb-6 overflow-hidden">
      {/* Header and Sub Tabs */}
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('RAW')}
            className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded transition ${
              activeTab === 'RAW'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            All Activity Records ({rawMatchedRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('UNMATCHED')}
            className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded transition ${
              activeTab === 'UNMATCHED'
                ? 'bg-rose-700 text-white'
                : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
            }`}
          >
            Unmatched / Unassigned ({unmatchedRecords.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-xs">
          <input
            type="text"
            placeholder="Search raw activity logs..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-3 pr-3 py-1 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tab 1: Sheet 7 (Raw Matched Data) */}
      {activeTab === 'RAW' && (
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-2.5 px-3 w-12 text-center">Row</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Daily Report Customer/Doctor</th>
                <th className="py-2.5 px-3">Matched Doctor</th>
                <th className="py-2.5 px-3 text-center">Cat</th>
                <th className="py-2.5 px-3">City &amp; Hospital</th>
                <th className="py-2.5 px-3 text-center">Score</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Counted</th>
                <th className="py-2.5 px-3">Reason / Audit Trail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredRaw.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                    {r.rowNumber}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap font-mono text-[11px]">
                    {r.date}
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap">
                    {r.originalDoctorName}
                  </td>
                  <td className="py-2 px-3 text-slate-800 whitespace-nowrap">
                    {r.matchedDoctor}
                  </td>
                  <td className="py-2 px-3 text-center font-bold">
                    {r.category !== '—' ? r.category : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    <div>{r.city}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-xs">{r.hospital}</div>
                  </td>
                  <td className="py-2 px-3 text-center font-mono">
                    <span className="font-bold text-slate-800">{r.matchScore}%</span>
                  </td>
                  <td className="py-2 px-3 text-center whitespace-nowrap">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      r.matchStatus === 'Strong' ? 'bg-emerald-50 text-emerald-700' :
                      r.matchStatus === 'Good' ? 'bg-blue-50 text-blue-700' :
                      r.matchStatus === 'Review Required' ? 'bg-amber-50 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {r.matchStatus}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    {r.countedAsVisit === 'Yes' ? (
                      <span className="inline-flex items-center text-emerald-700 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-slate-400">
                        <XCircle className="w-3.5 h-3.5 mr-1" /> No
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-slate-500 text-[11px] max-w-sm truncate" title={r.reason}>
                    {r.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Sheet 6 (Unmatched / Unassigned Visits) */}
      {activeTab === 'UNMATCHED' && (
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="bg-rose-50 border-b border-rose-200 text-rose-800 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Daily Report Doctor / Customer Name</th>
                <th className="py-2.5 px-3">Hospital</th>
                <th className="py-2.5 px-3">City</th>
                <th className="py-2.5 px-3 text-center">Score</th>
                <th className="py-2.5 px-3">Reason For Exclusion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredUnmatched.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                    Zero unmatched records. All activities mapped successfully!
                  </td>
                </tr>
              ) : (
                filteredUnmatched.map((u, idx) => (
                  <tr key={idx} className="hover:bg-rose-50/40 transition">
                    <td className="py-2 px-3 whitespace-nowrap font-mono text-[11px]">
                      {u.date}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {u.dailyReportDoctorName}
                    </td>
                    <td className="py-2 px-3 text-slate-600">
                      {u.hospital || '—'}
                    </td>
                    <td className="py-2 px-3 text-slate-600">
                      {u.city || '—'}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-rose-700">
                      {u.matchingScore}%
                    </td>
                    <td className="py-2 px-3 text-slate-600 text-[11px]">
                      {u.reason}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
