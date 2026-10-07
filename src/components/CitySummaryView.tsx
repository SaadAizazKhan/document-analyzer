import React from 'react';
import { CitySummary } from '../types/analyzer';

interface CitySummaryViewProps {
  citySummaries: CitySummary[];
}

export const CitySummaryView: React.FC<CitySummaryViewProps> = ({ citySummaries }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-xs mb-6 overflow-hidden">
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Territory &amp; City-wise Coverage Analysis
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Geographic field reach performance across active assigned zones
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
              <th className="py-2.5 px-4">City / Headquarters</th>
              <th className="py-2.5 px-4 text-right">Assigned Doctors</th>
              <th className="py-2.5 px-4 text-right">Doctors Met</th>
              <th className="py-2.5 px-4 text-right">Pending (O/S)</th>
              <th className="py-2.5 px-4 text-right">Total Visits</th>
              <th className="py-2.5 px-4 text-right">Unique Coverage %</th>
              <th className="py-2.5 px-4 min-w-[200px]">Coverage Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {citySummaries.map((city) => (
              <tr key={city.city} className="hover:bg-slate-50 transition">
                <td className="py-2.5 px-4 font-bold text-slate-900">
                  {city.city}
                </td>
                <td className="py-2.5 px-4 text-right font-medium text-slate-800">
                  {city.assigned}
                </td>
                <td className="py-2.5 px-4 text-right font-semibold text-emerald-700">
                  {city.met}
                </td>
                <td className="py-2.5 px-4 text-right font-semibold text-rose-700">
                  {city.pending}
                </td>
                <td className="py-2.5 px-4 text-right text-slate-800">
                  {city.totalVisits}
                </td>
                <td className="py-2.5 px-4 text-right font-bold">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                      city.coveragePct >= 75
                        ? 'bg-emerald-50 text-emerald-700'
                        : city.coveragePct >= 50
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {city.coveragePct}%
                  </span>
                </td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${
                          city.coveragePct >= 75
                            ? 'bg-emerald-600'
                            : city.coveragePct >= 50
                            ? 'bg-blue-600'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, city.coveragePct)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono w-9 text-right">
                      {city.met}/{city.assigned}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
