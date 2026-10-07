import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown } from 'lucide-react';
import { SixMonthDoctorRecord } from '../types/analyzer';

interface SixMonthMatrixGridProps {
  records: SixMonthDoctorRecord[];
  monthsList: string[];
}

export const SixMonthMatrixGrid: React.FC<SixMonthMatrixGridProps> = ({
  records,
  monthsList,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [evaluationFilter, setEvaluationFilter] = useState<string>('ALL');

  const [sortField, setSortField] = useState<string>('srNo');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const doc = r.doctor;
      const term = searchTerm.toLowerCase().trim();

      if (term) {
        const matchesName = doc.rawName.toLowerCase().includes(term);
        const matchesHosp = doc.hospital.toLowerCase().includes(term);
        const matchesCity = doc.city.toLowerCase().includes(term);
        if (!matchesName && !matchesHosp && !matchesCity) return false;
      }

      if (categoryFilter !== 'ALL' && doc.category !== categoryFilter) return false;
      if (evaluationFilter !== 'ALL' && r.overallEvaluation !== evaluationFilter) return false;

      return true;
    });
  }, [records, searchTerm, categoryFilter, evaluationFilter]);

  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let valA: any = a.doctor.srNo;
      let valB: any = b.doctor.srNo;

      if (sortField === 'name') {
        valA = a.doctor.rawName;
        valB = b.doctor.rawName;
      } else if (sortField === 'category') {
        valA = a.doctor.category;
        valB = b.doctor.category;
      } else if (sortField === 'totalVisits') {
        valA = a.totalVisits;
        valB = b.totalVisits;
      } else if (sortField === 'achieved') {
        valA = a.monthsAchieved;
        valB = b.monthsAchieved;
      } else if (sortField === 'pending') {
        valA = a.monthsPending;
        valB = b.monthsPending;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredRecords, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const renderMonthCell = (mRec: any) => {
    if (!mRec) {
      return <span className="text-slate-300 font-mono">—</span>;
    }

    const isPending = mRec.targetStatus === 'Pending';
    const isViolation = mRec.spacingStatus === 'Spacing Violation';

    let badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (isPending) {
      badgeClass = 'bg-rose-50 text-rose-800 border-rose-200';
    } else if (isViolation) {
      badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
    }

    return (
      <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold border ${badgeClass}`}>
        {mRec.cellDisplay}
      </span>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-xs mb-6">
      {/* Search & Filter Bar */}
      <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50/60">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search doctor, hospital, or city..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="text-xs text-slate-500">
            Showing <strong>{filteredRecords.length}</strong> of {records.length} doctors
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs pt-1">
          <div>
            <label className="text-[10px] font-semibold uppercase text-slate-400 mr-1.5">Category:</label>
            <select
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="text-xs px-2 py-1 bg-white border border-slate-300 rounded"
            >
              <option value="ALL">All Categories</option>
              <option value="A">A-Class</option>
              <option value="B">B-Class</option>
              <option value="C">C-Class</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase text-slate-400 mr-1.5">Evaluation:</label>
            <select
              value={evaluationFilter}
              onChange={e => { setEvaluationFilter(e.target.value); setCurrentPage(1); }}
              className="text-xs px-2 py-1 bg-white border border-slate-300 rounded"
            >
              <option value="ALL">All Evaluations</option>
              <option value="Fully Compliant">Fully Compliant</option>
              <option value="Partially Compliant">Partially Compliant</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Six-Month Matrix Table (Section 29) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider select-none">
              <th onClick={() => handleSort('srNo')} className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/60 w-12 text-center">
                #
              </th>
              <th onClick={() => handleSort('name')} className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/60">
                Doctor Name
              </th>
              <th onClick={() => handleSort('category')} className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/60 text-center w-16">
                Cat
              </th>
              <th className="py-2.5 px-3">City / HQ</th>

              {/* Dynamic Month Columns */}
              {monthsList.map(mName => (
                <th key={mName} className="py-2.5 px-3 text-center whitespace-nowrap bg-slate-50/80">
                  {mName}
                </th>
              ))}

              <th className="py-2.5 px-3 text-center w-16">
                Req
              </th>
              <th onClick={() => handleSort('totalVisits')} className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/60 text-center w-16">
                <div className="flex items-center justify-center space-x-1">
                  <span>Actual</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center w-16">Shortfall</th>
              <th onClick={() => handleSort('achieved')} className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/60 text-center w-20">
                Achieved
              </th>
              <th onClick={() => handleSort('pending')} className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/60 text-center w-20">
                Pending
              </th>
              <th className="py-2.5 px-3 text-center w-20">Violations</th>
              <th className="py-2.5 px-3 text-center w-28">Overall</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={10 + monthsList.length} className="py-8 text-center text-slate-400 italic">
                  No records match current filters.
                </td>
              </tr>
            ) : (
              paginatedRecords.map(r => {
                const doc = r.doctor;
                const catClass =
                  doc.category === 'A' ? 'bg-purple-100 text-purple-800' :
                  doc.category === 'B' ? 'bg-blue-100 text-blue-800' :
                  'bg-emerald-100 text-emerald-800';

                return (
                  <tr key={doc.id} className="hover:bg-blue-50/40 transition">
                    <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                      {doc.srNo}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {doc.rawName}
                    </td>
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${catClass}`}>
                        {doc.category}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                      {doc.city}
                    </td>

                    {/* Month Matrix Cells (Section 29) */}
                    {monthsList.map(mh => {
                      const mRec = Object.values(r.monthlyRecords).find(
                        m => m.monthDisplay === mh || mh.startsWith(m.monthName)
                      );
                      return (
                        <td key={mh} className="py-2 px-3 text-center whitespace-nowrap">
                          {renderMonthCell(mRec)}
                        </td>
                      );
                    })}

                    <td className="py-2 px-3 text-center font-medium text-slate-700">
                      {r.requiredVisits}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-slate-900">
                      {r.totalVisits}
                    </td>
                    <td className="py-2 px-3 text-center font-semibold text-rose-600">
                      {r.visitShortfall > 0 ? `-${r.visitShortfall}` : '0'}
                    </td>
                    <td className="py-2 px-3 text-center font-semibold text-emerald-700">
                      {r.monthsAchieved}
                    </td>
                    <td className="py-2 px-3 text-center font-semibold text-rose-700">
                      {r.monthsPending}
                    </td>
                    <td className="py-2 px-3 text-center font-semibold text-amber-700">
                      {r.spacingViolations}
                    </td>
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        r.overallEvaluation === 'Fully Compliant'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : r.overallEvaluation === 'Partially Compliant'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {r.overallEvaluation}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center space-x-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={e => {
              setPageSize(parseInt(e.target.value, 10));
              setCurrentPage(1);
            }}
            className="border border-slate-300 rounded px-1.5 py-0.5 bg-white text-xs"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="flex items-center space-x-4">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-2 py-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 text-xs font-medium cursor-pointer"
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-2 py-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 text-xs font-medium cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
