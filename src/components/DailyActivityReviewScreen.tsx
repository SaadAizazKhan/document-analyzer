import React, { useState } from 'react';
import { RawMatchedRecord, AssignedDoctor } from '../types/analyzer';
import { Check, X, Filter, CheckCircle2, XCircle, Edit3 } from 'lucide-react';

interface DailyActivityReviewScreenProps {
  rawMatchedRecords: RawMatchedRecord[];
  assignedDoctors: AssignedDoctor[];
  onConfirmMatch: (activityId: string) => void;
  onRejectMatch: (activityId: string) => void;
  onAssignDoctor: (activityId: string, doctorId: string) => void;
}

export const DailyActivityReviewScreen: React.FC<DailyActivityReviewScreenProps> = ({
  rawMatchedRecords,
  assignedDoctors,
  onConfirmMatch,
  onRejectMatch,
  onAssignDoctor,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [editingRowIdx, setEditingRowIdx] = useState<number | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string>('');

  const filteredRecords = rawMatchedRecords.filter(r => {
    if (filterType === 'DOCTOR_VISIT' && r.activityType !== 'DOCTOR_VISIT') return false;
    if (filterType === 'NON_DOCTOR' && r.activityType === 'DOCTOR_VISIT') return false;
    if (filterType === 'COUNTED' && r.countedAsVisit !== 'Yes') return false;
    if (filterType === 'DUPLICATES' && !r.isDuplicateSameDay) return false;
    if (filterType === 'REVIEW_REQUIRED' && r.matchStatus !== 'Review Required') return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = r.originalDoctorName.toLowerCase().includes(term);
      const matchDoctor = r.matchedDoctor.toLowerCase().includes(term);
      const matchHosp = r.hospital.toLowerCase().includes(term);
      const matchCity = r.city.toLowerCase().includes(term);
      if (!matchName && !matchDoctor && !matchHosp && !matchCity) return false;
    }

    return true;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-xs mb-6 overflow-hidden">
      {/* Header Bar */}
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Daily Activity Review &amp; Matching Audit (Sections 18 &amp; 19)
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Transparent record-by-record verification for doctor visits, non-doctor activities, and same-day deduplications
          </p>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search customer, hospital, city..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="text-xs pl-3 pr-3 py-1 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700"
            >
              <option value="ALL">All Records ({rawMatchedRecords.length})</option>
              <option value="DOCTOR_VISIT">Doctor Visits Only</option>
              <option value="NON_DOCTOR">Non-Doctor Activities Only</option>
              <option value="COUNTED">Included in Analysis (✓)</option>
              <option value="DUPLICATES">Same-Day Duplicates</option>
              <option value="REVIEW_REQUIRED">Review Required</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[620px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
              <th className="py-2.5 px-3 w-10 text-center">Row</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Date</th>
              <th className="py-2.5 px-3">City</th>
              <th className="py-2.5 px-3">Original Name / Activity</th>
              <th className="py-2.5 px-3">Matched Master Doctor</th>
              <th className="py-2.5 px-3">Hospital</th>
              <th className="py-2.5 px-3 text-center">Score</th>
              <th className="py-2.5 px-3">Activity Type</th>
              <th className="py-2.5 px-3 text-center">Included</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-400 italic">
                  No records match the current filter.
                </td>
              </tr>
            ) : (
              filteredRecords.map((r, idx) => {
                const isDoctor = r.activityType === 'DOCTOR_VISIT';
                const isCounted = r.countedAsVisit === 'Yes';
                const activityId = `act_${r.rowNumber - 1}`;

                return (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                      {r.rowNumber}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap font-mono text-[11px] text-slate-800">
                      {r.date}
                    </td>
                    <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                      {r.city}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      <div>{r.candidateDoctorName && r.candidateDoctorName !== '—' ? r.candidateDoctorName : r.originalDoctorName}</div>
                      {r.candidateDoctorName && r.candidateDoctorName !== r.originalDoctorName && (
                        <div className="text-[10px] text-slate-400 truncate max-w-xs font-normal">
                          From: {r.originalDoctorName}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap font-medium text-slate-800">
                      {editingRowIdx === idx ? (
                        <div className="flex items-center space-x-1.5">
                          <select
                            value={selectedDocId}
                            onChange={e => setSelectedDocId(e.target.value)}
                            className="text-xs px-2 py-0.5 border border-blue-400 rounded bg-white"
                          >
                            <option value="">-- Choose Doctor --</option>
                            {assignedDoctors.map(d => (
                              <option key={d.id} value={d.id}>
                                {d.rawName} ({d.category} - {d.city})
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              if (selectedDocId) {
                                onAssignDoctor(activityId, selectedDocId);
                              }
                              setEditingRowIdx(null);
                            }}
                            className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                            title="Save reassignment"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setEditingRowIdx(null)}
                            className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span>{r.matchedDoctor}</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-600 truncate max-w-xs" title={r.hospital}>
                      {r.hospital || '—'}
                    </td>
                    <td className="py-2 px-3 text-center font-mono">
                      {r.matchScore > 0 ? (
                        <span className={`font-bold ${r.matchScore >= 85 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {r.matchScore}%
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        isDoctor ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}>
                        {r.activityType || 'DOCTOR_VISIT'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      {isCounted ? (
                        <span className="inline-flex items-center text-emerald-700 font-bold" title="Counted toward doctor coverage">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> ✓
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-slate-400" title={r.reason || 'Excluded'}>
                          <XCircle className="w-3.5 h-3.5 mr-1" /> ✕
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        {r.matchStatus === 'Review Required' && (
                          <button
                            onClick={() => onConfirmMatch(activityId)}
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 transition"
                          >
                            Confirm
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingRowIdx(idx);
                            setSelectedDocId('');
                          }}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition"
                          title="Change Matched Doctor"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onRejectMatch(activityId)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
                          title="Mark as Non-Doctor / Unassigned"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
