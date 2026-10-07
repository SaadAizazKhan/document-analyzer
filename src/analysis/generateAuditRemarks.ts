import { CategorySummary, DoctorAnalysisRecord, OverallSummary } from '../types/analyzer';

/**
 * Generates dynamic, executive-grade natural language audit remarks
 * supporting both Single-Month and Multi-Month analysis modes (per Section 28 of multi-month-logic.md)
 */
export function generateCategoryAuditRemark(
  category: 'A' | 'B' | 'C',
  records: DoctorAnalysisRecord[],
  summary: Omit<CategorySummary, 'auditRemarks'>
): string {
  const { assignedDoctors, drsMet, pendingDrs, uniqueCoveragePct, totalVisitsDone } = summary;

  if (assignedDoctors === 0) {
    return 'No doctors assigned in this category.';
  }

  const isMultiMonth = summary.numberMonths !== undefined && summary.numberMonths > 1;

  if (isMultiMonth) {
    const numMonths = summary.numberMonths!;
    const reqVisits = summary.totalRequiredVisits || 0;
    const shortfall = summary.visitShortfall || 0;
    const fullyCompliant = summary.fullyCompliantDrs || 0;
    const pendingDrsCount = summary.drsWithPendingMonths || 0;
    const pendingSlots = summary.pendingDoctorMonths || 0;
    const totalSlots = summary.totalDoctorMonthSlots || 0;

    const catRecords = records.filter(r => r.doctor.category === category);
    const spacingViolationCount = catRecords.filter(r => r.spacingStatus === 'Spacing Violation').length;

    if (category === 'A') {
      const parts = [
        `${uniqueCoveragePct.toFixed(1)}% unique coverage achieved (${drsMet}/${assignedDoctors}).`,
        `${fullyCompliant} of ${assignedDoctors} doctors were fully compliant across all ${numMonths} months.`,
        `${pendingDrsCount} doctor${pendingDrsCount === 1 ? '' : 's'} had one or more pending monthly targets (${pendingSlots}/${totalSlots} doctor-month targets pending).`,
        `Total required visits: ${reqVisits}. Total visits completed: ${totalVisitsDone}. Overall visit shortfall: ${shortfall}.`,
      ];
      if (spacingViolationCount > 0) {
        parts.push(`${spacingViolationCount} spacing violation${spacingViolationCount === 1 ? '' : 's'} identified.`);
      }
      return parts.join(' ');
    }

    if (category === 'B') {
      const parts = [
        `${uniqueCoveragePct.toFixed(1)}% unique coverage achieved (${drsMet}/${assignedDoctors}).`,
        `${fullyCompliant} of ${assignedDoctors} doctors maintained 100% monthly coverage across all ${numMonths} months.`,
        `${pendingDrsCount} doctor${pendingDrsCount === 1 ? '' : 's'} missed one or more monthly visits (${pendingSlots}/${totalSlots} doctor-months pending).`,
        `Total required visits: ${reqVisits}. Total visits completed: ${totalVisitsDone}. Shortfall: ${shortfall}.`,
      ];
      if (spacingViolationCount > 0) {
        parts.push(`${spacingViolationCount} premature repeat${spacingViolationCount === 1 ? '' : 's'} within 30 days.`);
      }
      return parts.join(' ');
    }

    if (category === 'C') {
      const overdueCount = catRecords.filter(r => r.spacingStatus === 'Overdue').length;
      const parts = [
        `${uniqueCoveragePct.toFixed(1)}% unique coverage achieved (${drsMet}/${assignedDoctors}) over ${numMonths} months.`,
        `45-day rotational coverage: ${drsMet} active, ${pendingDrs} pending rotation.`,
      ];
      if (overdueCount > 0) {
        parts.push(`${overdueCount} doctor${overdueCount === 1 ? '' : 's'} overdue beyond 45 days.`);
      }
      parts.push(`Total field visits logged: ${totalVisitsDone}.`);
      return parts.join(' ');
    }
  }

  // Single-Month Mode Remarks
  const catRecords = records.filter(r => r.doctor.category === category);
  const targetAchievedCount = catRecords.filter(r => r.targetStatus === 'Achieved').length;
  const targetPendingCount = catRecords.filter(r => r.targetStatus === 'Pending').length;
  const spacingViolationCount = catRecords.filter(r => r.spacingStatus === 'Spacing Violation').length;

  if (category === 'A') {
    const parts = [
      `${uniqueCoveragePct.toFixed(1)}% unique coverage achieved (${drsMet}/${assignedDoctors}).`,
      `${targetAchievedCount} doctor${targetAchievedCount === 1 ? '' : 's'} achieved the mandatory 2x monthly frequency target.`,
    ];

    if (targetPendingCount > 0) {
      parts.push(`${targetPendingCount} doctor${targetPendingCount === 1 ? '' : 's'} remained pending.`);
    }

    if (spacingViolationCount > 0) {
      parts.push(`${spacingViolationCount} doctor${spacingViolationCount === 1 ? '' : 's'} achieved the monthly target but had spacing violations.`);
    }

    parts.push(`Total field visits logged: ${totalVisitsDone}.`);
    return parts.join(' ');
  }

  if (category === 'B') {
    const parts = [
      `${uniqueCoveragePct.toFixed(1)}% unique coverage achieved (${drsMet}/${assignedDoctors}).`,
      `${targetAchievedCount} doctor${targetAchievedCount === 1 ? '' : 's'} achieved the 1x monthly frequency target.`,
    ];

    if (targetPendingCount > 0) {
      parts.push(`${targetPendingCount} doctor${targetPendingCount === 1 ? '' : 's'} remained pending.`);
    }

    if (spacingViolationCount > 0) {
      parts.push(`${spacingViolationCount} premature repeat${spacingViolationCount === 1 ? '' : 's'} logged within 30 days.`);
    }

    parts.push(`Total field visits logged: ${totalVisitsDone}.`);
    return parts.join(' ');
  }

  if (category === 'C') {
    const overdueCount = catRecords.filter(r => r.spacingStatus === 'Overdue').length;
    const parts = [
      `${uniqueCoveragePct.toFixed(1)}% unique coverage achieved (${drsMet}/${assignedDoctors}).`,
      `45-day rotational coverage: ${drsMet} active, ${pendingDrs} pending rotation.`,
    ];

    if (overdueCount > 0) {
      parts.push(`${overdueCount} doctor${overdueCount === 1 ? '' : 's'} overdue beyond 45 days.`);
    }

    parts.push(`Total field visits logged: ${totalVisitsDone}.`);
    return parts.join(' ');
  }

  return '';
}

/**
 * Generates overall executive summary remark
 */
export function generateOverallAuditRemark(
  overall: Omit<OverallSummary, 'auditRemarks'>
): string {
  const { totalAssigned, totalDrsMet, overallCoveragePct, totalVisitsDone, totalPendingDrs, totalExceptions, numberMonths } = overall;

  if (totalAssigned === 0) return 'No data available for audit generation.';

  if (numberMonths && numberMonths > 1) {
    const totalReq = overall.totalRequiredVisits || 0;
    const totalShort = overall.totalVisitShortfall || 0;
    const fullyComp = overall.totalFullyCompliantDrs || 0;
    const pendingMonthsDrs = overall.totalDrsWithPendingMonths || 0;
    const pendingSlots = overall.totalPendingDoctorMonths || 0;

    let remark = `Multi-Month Field Force Audit (${numberMonths} Months): ${overallCoveragePct.toFixed(1)}% unique doctor coverage across ${totalAssigned} accounts (${totalDrsMet} doctors met). `;
    remark += `Total visits completed: ${totalVisitsDone} vs ${totalReq} required (Shortfall: ${totalShort} visits). `;
    remark += `${fullyComp} doctor${fullyComp === 1 ? '' : 's'} maintained 100% monthly compliance across all months, while ${pendingMonthsDrs} had one or more pending monthly targets (${pendingSlots} doctor-month targets missed).`;
    return remark;
  }

  let remark = `Overall Field Force Compliance: ${overallCoveragePct.toFixed(1)}% unique coverage across ${totalAssigned} assigned doctors (${totalDrsMet} doctors met across ${totalVisitsDone} total field visits). `;

  if (totalPendingDrs > 0) {
    remark += `A total of ${totalPendingDrs} doctors remained completely pending (O/S). `;
  } else {
    remark += `100% coverage reach with zero pending accounts. `;
  }

  if (totalExceptions > 0) {
    remark += `${totalExceptions} compliance exception${totalExceptions > 1 ? 's require' : ' requires'} management attention regarding visit frequency and premature repeats.`;
  }

  return remark.trim();
}
