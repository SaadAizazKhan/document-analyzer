import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, Eye, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { DoctorAnalysisRecord } from '../types/analyzer';
import { DoctorDetailDrawer } from './DoctorDetailDrawer';

interface DoctorDataGridProps {
  records: DoctorAnalysisRecord[];
}

export const DoctorDataGrid: React.FC<DoctorDataGridProps> = ({ records }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [targetStatusFilter, setTargetStatusFilter] = useState<string>('ALL');

  const [sortField, setSortField] = useState<string>('srNo');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  const [selectedRecord, setSelectedRecord] = useState<DoctorAnalysisRecord | null>(null);

  // Distinct cities for filter dropdown
  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      if (r.doctor.city) set.add(r.doctor.city);
    });
    return Array.from(set).sort();
  }, [records]);

  // Filtering & Search (Section 48)
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
      if (cityFilter !== 'ALL' && doc.city !== cityFilter) return false;
      if (statusFilter !== 'ALL' && r.overallStatus !== statusFilter) return false;
      if (targetStatusFilter !== 'ALL' && r.targetStatus !== targetStatusFilter) return false;

      return true;
    });
  }, [records, searchTerm, categoryFilter, cityFilter, statusFilter, targetStatusFilter]);

  // Sorting
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
      } else if (sortField === 'city') {
        valA = a.doctor.city;
        valB = b.doctor.city;
      } else if (sortField === 'visits') {
        valA = a.actualVisits;
        valB = b.actualVisits;
      } else if (sortField === 'target') {
        valA = a.targetStatus;
        valB = b.targetStatus;
      } else if (sortField === 'overall') {
        valA = a.overallStatus;
        valB = b.overallStatus;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredRecords, sortField, sortAsc]);

  // Pagination
  const totalItems = sortedRecords.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
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

  const getOverallBadge = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
      case 'ROTATION COMPLIANT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {status}
          </span>
        );
      case 'SPACING VIOLATION':
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {status}
          </span>
        );
      case 'PENDING':
      case 'PENDING ROTATION':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <Clock className="w-3 h-3 mr-1" />
            {status}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-xs mb-6">
      {/* Search and Filters Bar (Section 48) */}
      <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50/60">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
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

          {/* Quick Stats count */}
          <div className="text-xs text-slate-500 flex items-center space-x-2">
            <span>Showing <strong>{filteredRecords.length}</strong> of {records.length} doctors</span>
          </div>
        </div>

        {/* Filter Dropdowns Grid (Section 48) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
          {/* Category Filter */}
          <div>
            <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-0.5">Category</label>
            <select
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded"
            >
              <option value="ALL">All Categories</option>
              <option value="A">A-Class (15d / 2v)</option>
              <option value="B">B-Class (30d / 1v)</option>
              <option value="C">C-Class (45d rotational)</option>
            </select>
          </div>

          {/* City Filter */}
          <div>
            <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-0.5">City / HQ</label>
            <select
              value={cityFilter}
              onChange={e => { setCityFilter(e.target.value); setCurrentPage(1); }}
              className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded"
            >
              <option value="ALL">All Cities</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Overall Status Filter */}
          <div>
            <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-0.5">Overall Status</label>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLIANT">COMPLIANT</option>
              <option value="SPACING VIOLATION">SPACING VIOLATION</option>
              <option value="PENDING">PENDING</option>
              <option value="ROTATION COMPLIANT">ROTATION COMPLIANT</option>
              <option value="OVERDUE">OVERDUE</option>
            </select>
          </div>

          {/* Target Status Filter */}
          <div>
            <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-0.5">Target Status</label>
            <select
              value={targetStatusFilter}
              onChange={e => { setTargetStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded"
            >
              <option value="ALL">All Targets</option>
              <option value="Achieved">Target Achieved</option>
              <option value="Pending">Target Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* High-density Data Table (Section 27) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider select-none">
              <th onClick={() => handleSort('srNo')} className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/60 w-12 text-center">
                <div className="flex items-center justify-center space-x-1">
                  <span>#</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th onClick={() => handleSort('name')} className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/60">
                <div className="flex items-center space-x-1">
                  <span>Doctor Name</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th onClick={() => handleSort('category')} className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/60 text-center w-16">
                <div className="flex items-center justify-center space-x-1">
                  <span>Cat</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th onClick={() => handleSort('city')} className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/60">
                <div className="flex items-center space-x-1">
                  <span>City</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3">Hospital</th>
              <th onClick={() => handleSort('visits')} className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/60 text-center w-24">
                <div className="flex items-center justify-center space-x-1">
                  <span>Visits (Act/Req)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th onClick={() => handleSort('target')} className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/60 text-center w-28">
                <div className="flex items-center justify-center space-x-1">
                  <span>Target Status</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center w-28">Spacing Status</th>
              <th onClick={() => handleSort('overall')} className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/60 text-center">
                <div className="flex items-center justify-center space-x-1">
                  <span>Overall Status</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3">Visit Dates / Gaps</th>
              <th className="py-2.5 px-3 text-right w-16">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-slate-400 italic">
                  No doctors found matching the current search filters.
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
                  <tr
                    key={doc.id}
                    onClick={() => setSelectedRecord(r)}
                    className="hover:bg-blue-50/40 cursor-pointer transition"
                  >
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
                    <td className="py-2 px-3 text-slate-600 truncate max-w-xs" title={doc.hospital}>
                      {doc.hospital || '—'}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-slate-900 whitespace-nowrap">
                      {r.actualVisits} / {r.requiredVisits}
                    </td>
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        r.targetStatus === 'Achieved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {r.targetStatus}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        r.spacingStatus === 'Compliant' || r.spacingStatus === 'Rotation Compliant'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : r.spacingStatus === 'Spacing Violation' || r.spacingStatus === 'Overdue'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {r.spacingStatus}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      {getOverallBadge(r.overallStatus)}
                    </td>
                    <td className="py-2 px-3 text-slate-600 font-mono text-[11px] truncate max-w-xs">
                      {r.visitDatesFormatted.length > 0 ? (
                        <span>
                          {r.visitDatesFormatted.join(', ')}
                          {r.gaps.length > 0 && (
                            <span className="text-blue-600 font-semibold ml-1.5">
                              ({r.gaps.join('d, ')}d)
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No visits</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(r);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition"
                        title="View detailed calculations"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
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
              className="px-2 py-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-xs font-medium cursor-pointer"
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-2 py-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-xs font-medium cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Detail Drawer Slideout (Section 49) */}
      <DoctorDetailDrawer
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
};
