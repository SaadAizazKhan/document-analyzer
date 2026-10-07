import React from 'react';
import {
  Users,
  UserCheck,
  Percent,
  CalendarCheck,
  Repeat,
  ClockAlert,
  AlertTriangle,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react';
import { AnalysisResult } from '../types/analyzer';

interface KpiSummaryCardsProps {
  analysis: AnalysisResult;
}

export const KpiSummaryCards: React.FC<KpiSummaryCardsProps> = ({ analysis }) => {
  const o = analysis.overallSummary;
  const isMultiMonth = o.numberMonths !== undefined && o.numberMonths > 1;
  const numMonths = o.numberMonths || 1;

  if (isMultiMonth) {
    const cards = [
      {
        label: 'Assigned Doctors',
        value: o.totalAssigned,
        icon: Users,
        subtext: 'Master Universe',
        border: 'border-slate-200',
        badgeColor: 'bg-slate-100 text-slate-700',
      },
      {
        label: 'Required Visits',
        value: o.totalRequiredVisits || 0,
        icon: CalendarCheck,
        subtext: `Target over ${numMonths} mos`,
        border: 'border-blue-200',
        badgeColor: 'bg-blue-50 text-blue-700',
      },
      {
        label: 'Visits Done',
        value: o.totalVisitsDone,
        icon: UserCheck,
        subtext: 'Actual Field Calls',
        border: 'border-slate-200',
        badgeColor: 'bg-emerald-50 text-emerald-700',
      },
      {
        label: 'Visit Shortfall',
        value: o.totalVisitShortfall ? `-${o.totalVisitShortfall}` : '0',
        icon: TrendingDown,
        subtext: 'Deficit against target',
        border: 'border-rose-200',
        badgeColor: 'bg-rose-50 text-rose-700',
      },
      {
        label: 'Fully Compliant',
        value: o.totalFullyCompliantDrs || 0,
        icon: CheckCircle2,
        subtext: '0 pending months',
        border: 'border-emerald-200',
        badgeColor: 'bg-emerald-50 text-emerald-700',
      },
      {
        label: 'Pending Doctors',
        value: o.totalDrsWithPendingMonths || o.totalPendingDrs,
        icon: ClockAlert,
        subtext: 'Missed ≥ 1 month',
        border: 'border-rose-200',
        badgeColor: 'bg-rose-50 text-rose-700',
      },
      {
        label: 'Pending Mo-Slots',
        value: `${o.totalPendingDoctorMonths || 0}`,
        icon: AlertTriangle,
        subtext: `Out of ${o.totalDoctorMonthSlots || 0} slots`,
        border: 'border-amber-200',
        badgeColor: 'bg-amber-50 text-amber-700',
      },
    ];

    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`bg-white border ${card.border} rounded-md p-3 shadow-xs hover:border-slate-300 transition`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider truncate">
                  {card.label}
                </span>
                <div className={`p-1 rounded ${card.badgeColor}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl font-bold tracking-tight text-slate-900">
                {card.value}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                {card.subtext}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Single-Month Cards
  const cards = [
    {
      label: 'Assigned Doctors',
      value: o.totalAssigned,
      icon: Users,
      subtext: 'Master List',
      border: 'border-slate-200',
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      label: 'Doctors Met',
      value: o.totalDrsMet,
      icon: UserCheck,
      subtext: `${o.totalAssigned - o.totalDrsMet} untouched`,
      border: 'border-slate-200',
      badgeColor: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Unique Coverage',
      value: `${o.overallCoveragePct}%`,
      icon: Percent,
      subtext: `${o.totalDrsMet}/${o.totalAssigned} accounts`,
      border: 'border-slate-200',
      badgeColor: o.overallCoveragePct >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Total Visits Done',
      value: o.totalVisitsDone,
      icon: CalendarCheck,
      subtext: 'Validated field calls',
      border: 'border-slate-200',
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      label: 'Repeated Doctors',
      value: o.totalRepeatedDrs,
      icon: Repeat,
      subtext: '> 1 visit completed',
      border: 'border-slate-200',
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      label: 'Pending Doctors',
      value: o.totalPendingDrs,
      icon: ClockAlert,
      subtext: 'Missed monthly target',
      border: 'border-red-200',
      badgeColor: 'bg-red-50 text-red-700',
    },
    {
      label: 'Exceptions',
      value: o.totalExceptions,
      icon: AlertTriangle,
      subtext: 'Frequency short/repeats',
      border: 'border-amber-200',
      badgeColor: 'bg-amber-50 text-amber-700',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`bg-white border ${card.border} rounded-md p-3 shadow-xs hover:border-slate-300 transition`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider truncate">
                {card.label}
              </span>
              <div className={`p-1 rounded ${card.badgeColor}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-bold tracking-tight text-slate-900">
              {card.value}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
              {card.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
};
