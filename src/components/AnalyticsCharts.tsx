import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AnalysisResult } from '../types/analyzer';

interface AnalyticsChartsProps {
  analysis: AnalysisResult;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ analysis }) => {
  const isMultiMonth = !!(
    analysis.sixMonthRecords &&
    analysis.sixMonthRecords.length > 0 &&
    analysis.monthsList.length > 1
  );

  if (isMultiMonth && analysis.managementSummaryRows) {
    // --- Chart 1: Required vs Completed Visits (Category-wise: Class A, Class B, Class C) ---
    const reqVsCompletedData = analysis.managementSummaryRows
      .filter(r => r.categoryKey === 'Class A' || r.categoryKey === 'Class B' || r.categoryKey === 'Class C')
      .map(r => ({
        category: r.categoryLabel,
        'Required Visits': r.visitsRequired,
        'Completed Visits': r.visitsCompleted,
      }));

    // --- Chart 2: Monthly Visit Trend (Required Visits vs Completed Visits for April -> September) ---
    const monthlyTrendData = analysis.monthlyPerformanceSummary
      ? analysis.monthlyPerformanceSummary.map(m => ({
          month: m.month,
          'Required Visits': m.requiredVisits,
          'Completed Visits': m.visitsCompleted,
        }))
      : [];

    // --- Chart 3: Fully Compliant vs Below Target Doctors (Category-wise) ---
    const complianceByCatData = analysis.managementSummaryRows
      .filter(r => r.categoryKey === 'Class A' || r.categoryKey === 'Class B' || r.categoryKey === 'Class C')
      .map(r => ({
        category: r.categoryLabel,
        'Fully Compliant': typeof r.fullyCompliant === 'number' ? r.fullyCompliant : 0,
        'Below Target': typeof r.doctorsBelowTarget === 'number' ? r.doctorsBelowTarget : 0,
      }));

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Chart 1 — Required vs Completed Visits (Section 33) */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            1. Required vs Completed Visits
          </h3>
          <p className="text-[11px] text-slate-400 mb-3">Category-wise volume comparison</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reqVsCompletedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ fontSize: '11px', borderRadius: '4px', border: '1px solid #CBD5E1' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="Required Visits" fill="#94A3B8" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Completed Visits" fill="#2563EB" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2 — Monthly Visit Trend (Section 33) */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            2. Monthly Visit Trend
          </h3>
          <p className="text-[11px] text-slate-400 mb-3">Target requirement vs actual visits by calendar month</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ fontSize: '11px', borderRadius: '4px', border: '1px solid #CBD5E1' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="Required Visits" fill="#CBD5E1" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Completed Visits" fill="#0284C7" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3 — Fully Compliant vs Below Target Doctors (Section 33) */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            3. Compliant vs Below Target Doctors
          </h3>
          <p className="text-[11px] text-slate-400 mb-3">100% quota achieved vs ≥1 missed month</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complianceByCatData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ fontSize: '11px', borderRadius: '4px', border: '1px solid #CBD5E1' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="Fully Compliant" fill="#059669" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Below Target" fill="#EF4444" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  // --- SINGLE MONTH MODE (Exact Existing Preserved Display) ---
  const categoryChartData = analysis.categorySummaries.map(c => ({
    name: `${c.category}-Class`,
    Assigned: c.assignedDoctors,
    'Doctors Met': c.drsMet,
    Pending: c.pendingDrs,
  }));

  const territoryData = analysis.citySummaries.slice(0, 7).map(c => ({
    city: c.city,
    'Coverage %': c.coveragePct,
    Assigned: c.assigned,
    Met: c.met,
  }));

  const compliantCount = analysis.doctorRecords.filter(
    r => r.overallStatus === 'COMPLIANT' || r.overallStatus === 'ROTATION COMPLIANT'
  ).length;
  const violationCount = analysis.doctorRecords.filter(
    r => r.overallStatus === 'SPACING VIOLATION' || r.overallStatus === 'OVERDUE'
  ).length;
  const pendingCount = analysis.doctorRecords.filter(
    r => r.overallStatus === 'PENDING' || r.overallStatus === 'PENDING ROTATION'
  ).length;

  const visitStatusData = [
    { name: 'Compliant', Doctors: compliantCount, fill: '#059669' },
    { name: 'Spacing Violation', Doctors: violationCount, fill: '#D97706' },
    { name: 'Pending Target', Doctors: pendingCount, fill: '#DC2626' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
      {/* Chart 1: Category Coverage */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
          1. Category Coverage
        </h3>
        <p className="text-[11px] text-slate-400 mb-3">Assigned vs Met vs Pending per category</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
              <Tooltip
                contentStyle={{ fontSize: '11px', borderRadius: '4px', border: '1px solid #CBD5E1' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
              <Bar dataKey="Assigned" fill="#94A3B8" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Doctors Met" fill="#2563EB" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Pending" fill="#EF4444" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Top Territory Reach */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
          2. Top Territory Reach
        </h3>
        <p className="text-[11px] text-slate-400 mb-3">Coverage rate across key cities</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={territoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="city" tick={{ fontSize: 10, fill: '#64748B' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} unit="%" />
              <Tooltip
                contentStyle={{ fontSize: '11px', borderRadius: '4px', border: '1px solid #CBD5E1' }}
              />
              <Bar dataKey="Coverage %" fill="#059669" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 3: Visit Compliance Status */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
          3. Doctor Compliance Status
        </h3>
        <p className="text-[11px] text-slate-400 mb-3">Compliant vs Spacing Violation vs Pending</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={visitStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
              <Tooltip
                contentStyle={{ fontSize: '11px', borderRadius: '4px', border: '1px solid #CBD5E1' }}
              />
              <Bar dataKey="Doctors" radius={[2, 2, 0, 0]} fill="#2563EB" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
