import * as XLSX from 'xlsx';
import { AnalysisResult } from '../types/analyzer';

/**
 * Calculates optimal column widths based on maximum content length
 */
function calculateAutoWidths(data: (string | number | undefined | null)[][]): { wch: number }[] {
  const colWidths: number[] = [];

  data.forEach(row => {
    row.forEach((cell, colIdx) => {
      const len = cell !== undefined && cell !== null ? String(cell).length : 0;
      colWidths[colIdx] = Math.max(colWidths[colIdx] || 10, len + 3);
    });
  });

  return colWidths.map(w => ({ wch: Math.min(Math.max(w, 12), 70) }));
}

/**
 * Builds the complete 8-sheet corporate Excel workbook matching final-requirement.md & multi-month-logic.md
 */
export function generateComplianceExcelWorkbook(analysis: AnalysisResult): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const empName = analysis.employeeName || 'Paresh';
  const isMultiMonth = analysis.overallSummary.numberMonths !== undefined && analysis.overallSummary.numberMonths > 1;
  const numMonths = analysis.overallSummary.numberMonths || 1;

  const periodStr = isMultiMonth
    ? `${analysis.monthsList[0]} – ${analysis.monthsList[analysis.monthsList.length - 1]} (${numMonths} Months)`
    : `${analysis.reportingPeriod.month} ${analysis.reportingPeriod.year}`;

  // ==========================================
  // Sheet 1: Executive Summary (Section 14 & 27 of multi-month-logic.md)
  // ==========================================
  const execRows: (string | number)[][] = [
    ['DOCTOR VISIT COMPLIANCE & FIELD FORCE AUDIT REPORT'],
    ['Employee Name:', empName, '', 'Generated Date:', new Date().toISOString().split('T')[0]],
    ['Reporting Period:', periodStr, '', 'Analysis Mode:', isMultiMonth ? `Multi-Month (${numMonths} Months)` : 'Single Month'],
    [],
    ['KEY PERFORMANCE INDICATORS (KPI)'],
  ];

  if (isMultiMonth && analysis.managementSummaryRows && analysis.managementSummaryRows.length > 0) {
    execRows.push(
      ['Assigned Doctors', 'Required Visits (A+B)', 'Assigned Completed', 'Visit Gap', 'Fully Compliant Doctors', 'Doctors Below Target', 'Pending Doctor-Months'],
      [
        analysis.overallSummary.totalAssigned,
        analysis.overallSummary.totalRequiredVisits || 0,
        analysis.overallSummary.totalVisitsDone,
        analysis.overallSummary.totalVisitShortfall ? `-${analysis.overallSummary.totalVisitShortfall}` : 0,
        analysis.overallSummary.totalFullyCompliantDrs || 0,
        analysis.overallSummary.totalDrsWithPendingMonths || 0,
        `${analysis.overallSummary.totalPendingDoctorMonths || 0} / ${analysis.overallSummary.totalDoctorMonthSlots || 0}`,
      ],
      [],
      ['PRIMARY MANAGEMENT SUMMARY TABLE (SECTIONS 10 & 31)'],
      [
        'Doctor Category',
        'Visit Rule',
        'Total Doctors',
        'Unique Doctors Visited',
        'Fully Compliant',
        'Doctors Below Target',
        'Visits Required',
        'Visits Completed',
        'Visit Gap',
        'Target Achievement (%)',
        'Audit Status',
      ]
    );

    analysis.managementSummaryRows.forEach(row => {
      execRows.push([
        row.categoryLabel,
        row.visitRule,
        row.totalDoctors,
        row.uniqueDoctorsVisited,
        row.fullyCompliant,
        row.doctorsBelowTarget,
        row.visitsRequired,
        row.visitsCompleted,
        row.visitGapFormatted,
        row.targetAchievementFormatted,
        row.auditStatus,
      ]);
    });

    if (analysis.monthlyPerformanceSummary && analysis.monthlyPerformanceSummary.length > 0) {
      execRows.push(
        [],
        ['SIX-MONTH MONTHLY PERFORMANCE SUMMARY (SECTION 24)'],
        [
          'Month',
          'Unique Doctors Visited',
          'Visits Completed',
          'Required Visits',
          'Visit Gap',
          'Achievement %',
          'Doctors Fully Meeting Monthly Target',
          'Doctors Below Monthly Target',
        ]
      );

      analysis.monthlyPerformanceSummary.forEach(m => {
        execRows.push([
          m.month,
          m.uniqueDoctorsVisited,
          m.visitsCompleted,
          m.requiredVisits,
          m.visitGapFormatted,
          m.achievementPctFormatted,
          m.doctorsFullyMeetingMonthlyTarget,
          m.doctorsBelowMonthlyTarget,
        ]);
      });
    }

    if (analysis.categoryMonthlyBreakdowns) {
      execRows.push(
        [],
        ['CATEGORY-WISE MONTHLY BREAKDOWN — CLASS A (SECTION 25)'],
        [
          'Month',
          'Assigned Doctors',
          'Required Visits',
          'Completed Visits',
          'Doctors Met',
          'Doctors Meeting 2/2',
          'Doctors Below 2/2',
        ]
      );

      analysis.categoryMonthlyBreakdowns.A.forEach(r => {
        execRows.push([
          r.month,
          r.assigned,
          r.required,
          r.completed,
          r.doctorsMet,
          r.doctorsMeetingTarget,
          r.doctorsBelowTarget,
        ]);
      });

      execRows.push(
        [],
        ['CATEGORY-WISE MONTHLY BREAKDOWN — CLASS B (SECTION 25)'],
        [
          'Month',
          'Assigned Doctors',
          'Required Visits',
          'Completed Visits',
          'Doctors Met',
          'Doctors Meeting 1/1',
          'Doctors Below 1/1',
        ]
      );

      analysis.categoryMonthlyBreakdowns.B.forEach(r => {
        execRows.push([
          r.month,
          r.assigned,
          r.required,
          r.completed,
          r.doctorsMet,
          r.doctorsMeetingTarget,
          r.doctorsBelowTarget,
        ]);
      });
    }

    execRows.push(
      [],
      ['KEY AUDIT FINDINGS & RECOMMENDATIONS'],
      ['Audit Summary:', analysis.overallSummary.auditRemarks]
    );
  } else if (isMultiMonth) {
    execRows.push(
      ['Assigned Doctors', 'Required Visits (A+B)', 'Actual Visits Done', 'Visit Shortfall', 'Fully Compliant Doctors', 'Doctors With Pending Months', 'Pending Doctor-Months'],
      [
        analysis.overallSummary.totalAssigned,
        analysis.overallSummary.totalRequiredVisits || 0,
        analysis.overallSummary.totalVisitsDone,
        analysis.overallSummary.totalVisitShortfall ? `-${analysis.overallSummary.totalVisitShortfall}` : 0,
        analysis.overallSummary.totalFullyCompliantDrs || 0,
        analysis.overallSummary.totalDrsWithPendingMonths || 0,
        `${analysis.overallSummary.totalPendingDoctorMonths || 0} / ${analysis.overallSummary.totalDoctorMonthSlots || 0}`,
      ],
      [],
      ['EXECUTIVE COMPLIANCE SUMMARY (MAIN MANAGEMENT REPORT)'],
      [
        'Class & Sub-Section',
        'FOV Rule',
        'Assigned Doctors',
        'Drs Met',
        'Total Visits Done',
        'Repeated Drs',
        'Pending Drs (O/S)',
        'Days Difference (Avg & Range)',
        'Audit Remarks',
      ]
    );

    analysis.categorySummaries.forEach(c => {
      execRows.push([
        `${c.category}-Class`,
        c.fovRule,
        c.assignedDoctors,
        c.drsMet,
        c.totalVisitsDone,
        c.repeatedDrs,
        c.pendingDrs,
        c.daysDifferenceFormatted,
        c.auditRemarks,
      ]);
    });

    const o = analysis.overallSummary;
    execRows.push([
      'Total / Overall',
      '—',
      o.totalAssigned,
      o.totalDrsMet,
      o.totalVisitsDone,
      o.totalRepeatedDrs,
      o.totalPendingDrs,
      '—',
      o.auditRemarks,
    ]);
  } else {
    // Single Month KPI & Table
    execRows.push(
      ['Assigned Doctors', 'Doctors Met', 'Total Visits Done', 'Pending Doctors (O/S)', 'Repeated Doctors', 'Spacing Violations'],
      [
        analysis.overallSummary.totalAssigned,
        analysis.overallSummary.totalDrsMet,
        analysis.overallSummary.totalVisitsDone,
        analysis.overallSummary.totalPendingDrs,
        analysis.overallSummary.totalRepeatedDrs,
        analysis.doctorRecords.filter(r => r.spacingStatus === 'Spacing Violation').length,
      ],
      [],
      ['EXECUTIVE SUMMARY TABLE'],
      [
        'Class & Sub-Section',
        'FOV Rule',
        'Assigned Doctors',
        'Drs Met',
        'Total Visits Done',
        'Repeated Drs',
        'Pending Drs (O/S)',
        'Days Difference (Avg & Range)',
        'Audit Remarks',
      ]
    );

    analysis.categorySummaries.forEach(c => {
      execRows.push([
        `${c.category}-Class`,
        c.fovRule,
        c.assignedDoctors,
        c.drsMet,
        c.totalVisitsDone,
        c.repeatedDrs,
        c.pendingDrs,
        c.daysDifferenceFormatted,
        c.auditRemarks,
      ]);
    });

    const o = analysis.overallSummary;
    execRows.push([
      'Total / Overall',
      '—',
      o.totalAssigned,
      o.totalDrsMet,
      o.totalVisitsDone,
      o.totalRepeatedDrs,
      o.totalPendingDrs,
      '—',
      o.auditRemarks,
    ]);
  }

  const wsExec = XLSX.utils.aoa_to_sheet(execRows);
  wsExec['!cols'] = calculateAutoWidths(execRows);
  (wsExec as any)['!freeze'] = { xSplit: 0, ySplit: 10 };
  XLSX.utils.book_append_sheet(wb, wsExec, 'Executive Summary');

  // ==========================================
  // Sheet 2: Doctor Analysis (Section 25 of multi-month-logic.md)
  // ==========================================
  if (isMultiMonth && analysis.sixMonthRecords && analysis.sixMonthRecords.length > 0) {
    const monthHeaders = analysis.monthsList || [];
    const docMatrixHeaders = [
      'Doctor',
      'Category',
      'Hospital',
      'City',
      ...monthHeaders,
      'Required Visits',
      'Actual Visits',
      'Visit Shortfall',
      'Months Achieved',
      'Months Pending',
      'Spacing Violations',
      'Overall Status',
    ];

    const docMatrixRows: (string | number)[][] = [docMatrixHeaders];

    analysis.sixMonthRecords.forEach(r => {
      const doc = r.doctor;
      const monthCells = monthHeaders.map(mh => {
        const mRec = Object.values(r.monthlyRecords).find(m => m.monthDisplay === mh || mh.startsWith(m.monthName));
        return mRec ? mRec.cellDisplay : '0/0 —';
      });

      docMatrixRows.push([
        doc.rawName,
        doc.category,
        doc.hospital,
        doc.city,
        ...monthCells,
        r.requiredVisits,
        r.totalVisits,
        r.visitShortfall ? `-${r.visitShortfall}` : 0,
        r.monthsAchieved,
        r.monthsPending,
        r.spacingViolations,
        r.overallEvaluation,
      ]);
    });

    const wsDoc = XLSX.utils.aoa_to_sheet(docMatrixRows);
    wsDoc['!cols'] = calculateAutoWidths(docMatrixRows);
    (wsDoc as any)['!freeze'] = { xSplit: 0, ySplit: 1 };
    XLSX.utils.book_append_sheet(wb, wsDoc, 'Doctor Analysis');
  } else {
    // Single Month Doctor Analysis
    const docHeaders = [
      'Doctor',
      'Hospital',
      'City',
      'Category',
      'Month',
      'Required Visits',
      'Actual Visits',
      'Target Status',
      'Visit Dates',
      'Visit Gaps',
      'Average Gap',
      'Spacing Status',
      'Overall Status',
    ];

    const docRows: (string | number)[][] = [docHeaders];

    analysis.doctorRecords.forEach(r => {
      const doc = r.doctor;
      docRows.push([
        doc.rawName,
        doc.hospital,
        doc.city,
        doc.category,
        r.month,
        r.requiredVisits,
        r.actualVisits,
        r.targetStatus,
        r.visitDatesFormatted.join(', ') || '—',
        r.gaps.length > 0 ? r.gaps.join(', ') : '—',
        r.avgGap !== null ? `${r.avgGap}d` : '—',
        r.spacingStatus,
        r.overallStatus,
      ]);
    });

    const wsDoc = XLSX.utils.aoa_to_sheet(docRows);
    wsDoc['!cols'] = calculateAutoWidths(docRows);
    (wsDoc as any)['!freeze'] = { xSplit: 0, ySplit: 1 };
    XLSX.utils.book_append_sheet(wb, wsDoc, 'Doctor Analysis');
  }

  // ==========================================
  // Sheet 3: Visit Details (Section 34)
  // ==========================================
  const visitHeaders = [
    'Visit Date',
    'Employee',
    'City',
    'Doctor',
    'Matched Assigned Doctor',
    'Hospital',
    'Category',
    'Source File',
    'Source Sheet',
    'Source Row',
    'Format Detected',
    'Meeting Number',
    'Original Doctor Text',
    'Original Hospital Text',
    'Match Confidence',
  ];

  const visitRows: (string | number)[][] = [visitHeaders];

  analysis.rawMatchedRecords
    .filter(r => r.countedAsVisit === 'Yes')
    .forEach(r => {
      visitRows.push([
        r.date,
        empName,
        r.city,
        r.candidateDoctorName || r.originalDoctorName,
        r.matchedDoctor,
        r.hospital,
        r.category,
        'Daily Report',
        'Report Sheet',
        r.rowNumber,
        'Format A / B',
        '—',
        r.originalDoctorName,
        r.hospital,
        `${r.matchScore}%`,
      ]);
    });

  const wsVisit = XLSX.utils.aoa_to_sheet(visitRows);
  wsVisit['!cols'] = calculateAutoWidths(visitRows);
  (wsVisit as any)['!freeze'] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, wsVisit, 'Visit Details');

  // ==========================================
  // Sheet 4: Pending Doctors (Section 35)
  // ==========================================
  if (isMultiMonth && analysis.sixMonthRecords) {
    const pendingHeaders = [
      'Doctor',
      'Hospital',
      'City',
      'Category',
      'Required Visits',
      'Actual Visits',
      'Visit Shortfall',
      'Months Pending',
      'Months Achieved',
      'Overall Status',
      'Audit Reason',
    ];

    const pendingRows: (string | number)[][] = [pendingHeaders];

    analysis.sixMonthRecords
      .filter(r => r.monthsPending > 0)
      .forEach(r => {
        const doc = r.doctor;
        const reason = r.totalVisits === 0
          ? 'Zero visits completed across the multi-month period'
          : `Missed targets in ${r.monthsPending} of ${numMonths} months (${r.visitShortfall} visits short)`;

        pendingRows.push([
          doc.rawName,
          doc.hospital,
          doc.city,
          doc.category,
          r.requiredVisits,
          r.totalVisits,
          `-${r.visitShortfall}`,
          r.monthsPending,
          r.monthsAchieved,
          r.overallEvaluation,
          reason,
        ]);
      });

    const wsPending = XLSX.utils.aoa_to_sheet(pendingRows);
    wsPending['!cols'] = calculateAutoWidths(pendingRows);
    (wsPending as any)['!freeze'] = { xSplit: 0, ySplit: 1 };
    XLSX.utils.book_append_sheet(wb, wsPending, 'Pending Doctors');
  } else {
    const pendingHeaders = [
      'Doctor',
      'Hospital',
      'City',
      'Category',
      'Month',
      'Required Visits',
      'Actual Visits',
      'Pending Visits',
      'Visit Dates',
      'Reason',
    ];

    const pendingRows: (string | number)[][] = [pendingHeaders];

    analysis.doctorRecords
      .filter(r => r.targetStatus === 'Pending')
      .forEach(r => {
        const doc = r.doctor;
        const pendingVisits = Math.max(0, r.requiredVisits - r.actualVisits);
        const reason = r.actualVisits === 0
          ? 'Zero visits completed in reporting period'
          : `Only ${r.actualVisits}/${r.requiredVisits} visit completed; monthly target not achieved`;

        pendingRows.push([
          doc.rawName,
          doc.hospital,
          doc.city,
          doc.category,
          r.month,
          r.requiredVisits,
          r.actualVisits,
          pendingVisits,
          r.visitDatesFormatted.join(', ') || 'None',
          reason,
        ]);
      });

    const wsPending = XLSX.utils.aoa_to_sheet(pendingRows);
    wsPending['!cols'] = calculateAutoWidths(pendingRows);
    (wsPending as any)['!freeze'] = { xSplit: 0, ySplit: 1 };
    XLSX.utils.book_append_sheet(wb, wsPending, 'Pending Doctors');
  }

  // ==========================================
  // Sheet 5: Spacing Violations (Section 36)
  // ==========================================
  const spacingHeaders = [
    'Doctor',
    'Hospital',
    'City',
    'Category',
    'Month',
    'Visit 1',
    'Visit 2',
    'Actual Gap',
    'Expected Gap',
    'Difference',
    'Monthly Target Status',
    'Spacing Status',
    'Remarks',
  ];

  const spacingRows: (string | number)[][] = [spacingHeaders];

  analysis.doctorRecords
    .filter(r => r.spacingStatus === 'Spacing Violation')
    .forEach(r => {
      const doc = r.doctor;
      const v1 = r.visitDatesFormatted[0] || '—';
      const v2 = r.visitDatesFormatted[1] || '—';
      const actualGap = r.minGap !== null ? `${r.minGap} Days` : '—';
      const expectedGap = doc.category === 'A' ? '15 Days' : '30 Days';
      const diffVal = r.minGap !== null
        ? `${Math.abs((doc.category === 'A' ? 15 : 30) - r.minGap)} Days short`
        : '—';

      spacingRows.push([
        doc.rawName,
        doc.hospital,
        doc.city,
        doc.category,
        r.month,
        v1,
        v2,
        actualGap,
        expectedGap,
        diffVal,
        r.targetStatus,
        r.spacingStatus,
        r.complianceRemarks,
      ]);
    });

  const wsSpacing = XLSX.utils.aoa_to_sheet(spacingRows);
  wsSpacing['!cols'] = calculateAutoWidths(spacingRows);
  (wsSpacing as any)['!freeze'] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, wsSpacing, 'Spacing Violations');

  // ==========================================
  // Sheet 6: Repeated Doctors (Section 37)
  // ==========================================
  const repeatHeaders = [
    'Doctor',
    'Hospital',
    'City',
    'Category',
    'Month',
    'Total Visits',
    'Visit Dates',
    'Visit Gaps',
    'Average Gap',
    'Spacing Status',
  ];

  const repeatRows: (string | number)[][] = [repeatHeaders];

  analysis.doctorRecords
    .filter(r => r.actualVisits > 1)
    .forEach(r => {
      const doc = r.doctor;
      repeatRows.push([
        doc.rawName,
        doc.hospital,
        doc.city,
        doc.category,
        r.month,
        r.actualVisits,
        r.visitDatesFormatted.join(', '),
        r.gaps.join(', ') || '—',
        r.avgGap !== null ? `${r.avgGap}d` : '—',
        r.spacingStatus,
      ]);
    });

  const wsRepeat = XLSX.utils.aoa_to_sheet(repeatRows);
  wsRepeat['!cols'] = calculateAutoWidths(repeatRows);
  (wsRepeat as any)['!freeze'] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, wsRepeat, 'Repeated Doctors');

  // ==========================================
  // Sheet 7: Unmatched Records (Section 38)
  // ==========================================
  const unmatchHeaders = [
    'Date',
    'Original Doctor Text',
    'Hospital',
    'City',
    'Source File',
    'Source Sheet',
    'Source Row',
    'Match Confidence',
    'Reason',
  ];

  const unmatchRows: (string | number)[][] = [unmatchHeaders];

  analysis.unmatchedRecords.forEach((u, idx) => {
    unmatchRows.push([
      u.date,
      u.dailyReportDoctorName,
      u.hospital,
      u.city,
      'Daily Report',
      'Daily Reporting',
      idx + 1,
      `${u.matchingScore}%`,
      u.reason,
    ]);
  });

  const wsUnmatch = XLSX.utils.aoa_to_sheet(unmatchRows);
  wsUnmatch['!cols'] = calculateAutoWidths(unmatchRows);
  (wsUnmatch as any)['!freeze'] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, wsUnmatch, 'Unmatched Records');

  // ==========================================
  // Sheet 8: Data Validation (Section 39)
  // ==========================================
  const diag = analysis.diagnostics;
  const valStats = analysis.validationStats;

  const validRows: (string | number)[][] = [
    ['METRIC / AUDIT ITEM', 'COUNT / VALUE', 'AUDIT NOTES'],
    ['Files Processed', 1, 'Assigned Master + Daily Activity Reports'],
    ['Sheets Processed', 1, 'Normalized activity sheets parsed in-memory'],
    ['Reporting Date Range', periodStr, 'Calendar period analyzed'],
    ['Total Raw Rows', diag.rawActivitiesCount, 'Input daily reporting lines read'],
    ['Format A / B Rows', `${diag.rawActivitiesCount} rows`, 'Processed via Format A / B detector & normalizer'],
    ['Matched Records', diag.matchedAssignedDoctorsCount, 'Doctor candidates linked to assigned master accounts'],
    ['Unmatched Records', diag.unmatchedDoctorCandidatesCount, 'Logged in Sheet 7 for audit verification'],
    ['Duplicate Records (Deduplicated)', diag.duplicateSameDayRemovedCount, 'Same-day / same-row multiple meetings deduplicated to 1 valid visit'],
    ['Non-Doctor Activities', diag.nonDoctorActivitiesCount, 'Admin, Office, OT, Travel activities filtered out'],
    ['Manual Review Required', diag.manualReviewsRequiredCount, 'Ambiguous phonetic candidates flagged for review'],
    ['Assigned Doctors in Master', valStats.totalAssignedLoaded, 'Full target universe from master file'],
    ['Valid Visits Counted', valStats.doctorVisitsIdentified, 'Distinct valid visits after deduplication'],
  ];

  const wsValid = XLSX.utils.aoa_to_sheet(validRows);
  wsValid['!cols'] = calculateAutoWidths(validRows);
  (wsValid as any)['!freeze'] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, wsValid, 'Data Validation');

  return wb;
}

/**
 * Triggers client-side browser file download for ONE complete 8-sheet Excel workbook (Section 31)
 */
export function exportComplianceExcel(analysis: AnalysisResult): string {
  const wb = generateComplianceExcelWorkbook(analysis);
  const employeePart = analysis.employeeName ? `${analysis.employeeName}_` : 'Doctor_';

  let filename: string;
  if (analysis.analysisMode === 'six_months') {
    filename = `${employeePart}Doctor_Analysis_${analysis.reportingPeriod.year}_MultiMonth.xlsx`;
  } else {
    const monthPart = analysis.reportingPeriod.month;
    const yearPart = analysis.reportingPeriod.year;
    filename = `${employeePart}Doctor_Analysis_${monthPart}_${yearPart}.xlsx`;
  }

  XLSX.writeFile(wb, filename);
  return filename;
}
