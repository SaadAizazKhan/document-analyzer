import React, { useState } from 'react';
import {
  CategoryMonthlyBreakdownRow,
  CategorySummary,
  ManagementSummaryRow,
  MonthlyPerformanceSummaryRow,
  OverallSummary,
} from '../types/analyzer';
import { Calendar, ChevronDown, ChevronRight, TrendingUp } from 'lucide-react';

interface ExecutiveCategoryTableProps {
  categorySummaries: CategorySummary[];
  overallSummary: OverallSummary;
  managementSummaryRows?: ManagementSummaryRow[];
  monthlyPerformanceSummary?: MonthlyPerformanceSummaryRow[];
  categoryMonthlyBreakdowns?: {
    A: CategoryMonthlyBreakdownRow[];
    B: CategoryMonthlyBreakdownRow[];
    C: CategoryMonthlyBreakdownRow[];
  };
}

export const ExecutiveCategoryTable: React.FC<ExecutiveCategoryTableProps> = ({
  categorySummaries,
  overallSummary,
  managementSummaryRows,
  monthlyPerformanceSummary,
  categoryMonthlyBreakdowns,
}) => {
  const isMultiMonth = overallSummary.numberMonths !== undefined && overallSummary.numberMonths > 1;
  const numMonths = overallSummary.numberMonths || 1;
  const [selectedCatTab, setSelectedCatTab] = useState<'A' | 'B' | 'C'>('A');
  const [showCategoryBreakdowns, setShowCategoryBreakdowns] = useState<boolean>(true);

  if (isMultiMonth && managementSummaryRows && managementSummaryRows.length > 0) {
    return (
      <div className="space-y-6 mb-6">
        {/* Top Reconciliation KPI Header Block (Section 7 & 28) */}
        <div className="bg-slate-900 text-white rounded-md p-4 border border-slate-800 shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-3">
            <div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                  6-Month Field Force Management Summary ({numMonths} Calendar Months)
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Evaluated strictly per calendar month. Class A (2 visits/mo, 15d frequency), Class B (1 visit/mo, 30d frequency), Class C (45d rotational coverage).
              </p>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-950 text-blue-300 border border-blue-800">
              {numMonths} Months Inclusive
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700/60">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Assigned Doctors</span>
              <span className="text-base font-bold text-slate-100">{overallSummary.totalAssigned}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">A+B+C Master List</span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700/60">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Required Visits (A+B)</span>
              <span className="text-base font-bold text-slate-100">{overallSummary.totalRequiredVisits || 0}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Assigned Target</span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700/60">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Assigned Completed</span>
              <span className="text-base font-bold text-blue-400">{overallSummary.totalVisitsDone}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">To Assigned Doctors</span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700/60">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Visit Gap</span>
              <span className="text-base font-bold text-rose-400">
                {overallSummary.totalVisitShortfall ? `-${overallSummary.totalVisitShortfall}` : '0'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Completed - Required</span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700/60">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Fully Compliant Drs</span>
              <span className="text-base font-bold text-emerald-400">{overallSummary.totalFullyCompliantDrs || 0}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">100% Monthly Quota</span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700/60">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Doctors Below Target</span>
              <span className="text-base font-bold text-amber-400">{overallSummary.totalDrsWithPendingMonths || 0}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">≥1 Missed Month</span>
            </div>
          </div>
        </div>

        {/* PRIMARY MANAGEMENT SUMMARY TABLE (Sections 10 & 31) */}
        <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
          <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Primary Management Summary Matrix (Section 10 &amp; 31)
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Executive breakdown by doctor category, required compliance quotas, visit gaps, and unlisted visits isolation.
              </p>
            </div>
            <div className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 self-start sm:self-auto">
              Single Source of Truth Audit
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Doctor Category</th>
                  <th className="py-2.5 px-3">Visit Rule</th>
                  <th className="py-2.5 px-3 text-right">Total Doctors</th>
                  <th className="py-2.5 px-3 text-right">Unique Doctors Visited</th>
                  <th className="py-2.5 px-3 text-right">Fully Compliant</th>
                  <th className="py-2.5 px-3 text-right">Doctors Below Target</th>
                  <th className="py-2.5 px-3 text-right">Visits Required</th>
                  <th className="py-2.5 px-3 text-right">Visits Completed</th>
                  <th className="py-2.5 px-3 text-right">Visit Gap</th>
                  <th className="py-2.5 px-3 text-right">Target Achievement (%)</th>
                  <th className="py-2.5 px-3 min-w-[260px]">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {managementSummaryRows.map((row) => {
                  const isTotal = row.categoryKey === 'Total Assigned List';
                  const isUnlisted = row.categoryKey === 'Unlisted / Extra Doctors';

                  let badgeColor = 'bg-slate-100 text-slate-800 border-slate-200';
                  if (row.categoryKey === 'Class A') {
                    badgeColor = 'bg-purple-100 text-purple-800 border-purple-200';
                  } else if (row.categoryKey === 'Class B') {
                    badgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
                  } else if (row.categoryKey === 'Class C') {
                    badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                  } else if (isUnlisted) {
                    badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
                  }

                  const trClass = isTotal
                    ? 'bg-slate-100/90 font-semibold border-t-2 border-slate-300 text-slate-900'
                    : isUnlisted
                    ? 'bg-amber-50/50 hover:bg-amber-50 transition border-t border-slate-200 text-slate-800'
                    : 'hover:bg-slate-50/80 transition';

                  const gapColor =
                    row.visitGap < 0
                      ? 'text-rose-700 font-bold'
                      : row.visitGap > 0
                      ? 'text-emerald-700 font-semibold'
                      : 'text-slate-700';

                  return (
                    <tr key={row.categoryKey} className={trClass}>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border mr-1.5 ${badgeColor}`}>
                          {row.categoryLabel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                        {row.visitRule}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                        {row.totalDoctors}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-blue-700">
                        {row.uniqueDoctorsVisited}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                        {row.fullyCompliant}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-amber-700">
                        {row.doctorsBelowTarget}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-800">
                        {row.visitsRequired}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {row.visitsCompleted}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono text-[11px] ${gapColor}`}>
                        {row.visitGapFormatted}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                        {row.targetAchievementFormatted}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px] leading-relaxed">
                        {row.auditStatus}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* SIX-MONTH MONTHLY SUMMARY TABLE (Section 24) */}
        {monthlyPerformanceSummary && monthlyPerformanceSummary.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Six-Month Monthly Performance Summary (Section 24)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Month-by-month tracking of visits completed, monthly targets, visit gaps, and compliance counts.
                </p>
              </div>
              <div className="flex items-center space-x-1 text-slate-600 text-xs">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-semibold text-[11px]">{monthlyPerformanceSummary.length} Months Tracked</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Month</th>
                    <th className="py-2.5 px-3 text-right">Unique Doctors Visited</th>
                    <th className="py-2.5 px-3 text-right">Visits Completed</th>
                    <th className="py-2.5 px-3 text-right">Required Visits</th>
                    <th className="py-2.5 px-3 text-right">Visit Gap</th>
                    <th className="py-2.5 px-3 text-right">Achievement %</th>
                    <th className="py-2.5 px-3 text-right">Doctors Fully Meeting Target</th>
                    <th className="py-2.5 px-3 text-right">Doctors Below Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {monthlyPerformanceSummary.map((m) => {
                    const gapColor =
                      m.visitGap < 0
                        ? 'text-rose-700 font-bold'
                        : m.visitGap > 0
                        ? 'text-emerald-700 font-semibold'
                        : 'text-slate-700';

                    return (
                      <tr key={m.monthKey} className="hover:bg-slate-50/80 transition">
                        <td className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap">
                          {m.month}
                        </td>
                        <td className="py-2 px-3 text-right font-medium text-blue-700">
                          {m.uniqueDoctorsVisited}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          {m.visitsCompleted}
                        </td>
                        <td className="py-2 px-3 text-right font-medium text-slate-700">
                          {m.requiredVisits}
                        </td>
                        <td className={`py-2 px-3 text-right font-mono text-[11px] ${gapColor}`}>
                          {m.visitGapFormatted}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                          {m.achievementPctFormatted}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-emerald-700">
                          {m.doctorsFullyMeetingMonthlyTarget}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-rose-700">
                          {m.doctorsBelowMonthlyTarget}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CATEGORY-WISE MONTHLY BREAKDOWNS (Section 25) */}
        {categoryMonthlyBreakdowns && (
          <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div
                className="flex items-center space-x-2 cursor-pointer select-none"
                onClick={() => setShowCategoryBreakdowns(!showCategoryBreakdowns)}
              >
                {showCategoryBreakdowns ? (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                )}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Category-Wise Monthly Breakdown (Section 25)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Drill down into monthly performance for Class A (2/2 target), Class B (1/1 target), and Class C (rotational)
                  </p>
                </div>
              </div>

              <div className="flex space-x-1.5 self-start sm:self-auto">
                {(['A', 'B', 'C'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCatTab(cat);
                      setShowCategoryBreakdowns(true);
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded border transition ${
                      selectedCatTab === cat
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    Class {cat}
                  </button>
                ))}
              </div>
            </div>

            {showCategoryBreakdowns && (
              <div className="p-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                        <th className="py-2 px-3">Month</th>
                        <th className="py-2 px-3 text-right">Assigned Doctors</th>
                        <th className="py-2 px-3 text-right">Required Visits</th>
                        <th className="py-2 px-3 text-right">Completed Visits</th>
                        <th className="py-2 px-3 text-right">Doctors Met</th>
                        <th className="py-2 px-3 text-right">
                          {selectedCatTab === 'A'
                            ? 'Doctors Meeting 2/2'
                            : selectedCatTab === 'B'
                            ? 'Doctors Meeting 1/1'
                            : 'Rotational Doctors Met'}
                        </th>
                        <th className="py-2 px-3 text-right">
                          {selectedCatTab === 'A'
                            ? 'Doctors Below 2/2'
                            : selectedCatTab === 'B'
                            ? 'Doctors Below 1/1'
                            : 'Pending Rotational'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {categoryMonthlyBreakdowns[selectedCatTab].map((row) => (
                        <tr key={row.monthKey} className="hover:bg-slate-50/80 transition">
                          <td className="py-2 px-3 font-semibold text-slate-900">{row.month}</td>
                          <td className="py-2 px-3 text-right font-medium text-slate-800">{row.assigned}</td>
                          <td className="py-2 px-3 text-right font-medium text-slate-800">{row.required}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">{row.completed}</td>
                          <td className="py-2 px-3 text-right font-medium text-blue-700">{row.doctorsMet}</td>
                          <td className="py-2 px-3 text-right font-semibold text-emerald-700">
                            {row.doctorsMeetingTarget}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-rose-700">
                            {row.doctorsBelowTarget}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // --- SINGLE MONTH MODE (Exact Existing Preserved Display) ---
  return (
    <div className="space-y-4 mb-6">
      <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
        <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Executive Compliance Matrix by Category (Main Management Report)
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Core Field Force Performance — Class A (15d / 2 visits), Class B (30d / 1 visit), Class C (45d rotational)
            </p>
          </div>
          <div className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 self-start sm:self-auto">
            Single-Month Audit
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-2.5 px-3">Class &amp; Sub-Section</th>
                <th className="py-2.5 px-3">FOV Rule</th>
                <th className="py-2.5 px-3 text-right">Assigned Doctors</th>
                <th className="py-2.5 px-3 text-right">Drs Met</th>
                <th className="py-2.5 px-3 text-right">Total Visits Done</th>
                <th className="py-2.5 px-3 text-right">Repeated Drs</th>
                <th className="py-2.5 px-3 text-right">Pending Drs (O/S)</th>
                <th className="py-2.5 px-3">Days Difference (Avg &amp; Range)</th>
                <th className="py-2.5 px-3 min-w-[280px]">Audit Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {categorySummaries.map((cat) => {
                const categoryBadge =
                  cat.category === 'A'
                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                    : cat.category === 'B'
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-200';

                return (
                  <tr key={cat.category} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border mr-1.5 ${categoryBadge}`}>
                        {cat.category}-Class
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                      {cat.fovRule}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                      {cat.assignedDoctors}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-emerald-700">
                      {cat.drsMet}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {cat.totalVisitsDone}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700 font-medium">
                      {cat.repeatedDrs}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-rose-700">
                      {cat.pendingDrs}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {cat.daysDifferenceFormatted}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px] leading-relaxed">
                      {cat.auditRemarks}
                    </td>
                  </tr>
                );
              })}

              {/* Total / Overall Row */}
              <tr className="bg-slate-100/90 font-semibold border-t-2 border-slate-300 text-slate-900">
                <td className="py-3 px-3 uppercase text-[11px] tracking-wider text-slate-900 font-bold">
                  Total / Overall
                </td>
                <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">—</td>
                <td className="py-3 px-3 text-right font-bold">{overallSummary.totalAssigned}</td>
                <td className="py-3 px-3 text-right font-bold text-emerald-700">{overallSummary.totalDrsMet}</td>
                <td className="py-3 px-3 text-right font-bold text-slate-900">{overallSummary.totalVisitsDone}</td>
                <td className="py-3 px-3 text-right font-bold">{overallSummary.totalRepeatedDrs}</td>
                <td className="py-3 px-3 text-right font-bold text-rose-700">{overallSummary.totalPendingDrs}</td>
                <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">—</td>
                <td className="py-3 px-3 text-[11px] font-normal text-slate-700 leading-relaxed">
                  {overallSummary.auditRemarks}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
