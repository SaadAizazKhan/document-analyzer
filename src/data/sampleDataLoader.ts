import { parseAssignedDoctorsExcel, parseDailyReportExcel, ParseDoctorsResult, ParseDailyReportResult } from '../services/excelParser';

export async function loadSampleDataFiles(month: 'August' | 'September' = 'August'): Promise<{
  doctorsResult: ParseDoctorsResult;
  dailyResult: ParseDailyReportResult;
}> {
  const dailyReportFile = month === 'September'
    ? '/sample-data/Sep_Daily_Report_2026.xlsx'
    : '/sample-data/Aug_Daily_Report_2026.xlsx';

  const [mclResp, dailyResp] = await Promise.all([
    fetch('/sample-data/PARESH_MCL_LIST.xlsx'),
    fetch(dailyReportFile),
  ]);

  if (!mclResp.ok) {
    throw new Error(`Failed to load sample master file: HTTP ${mclResp.status}`);
  }
  if (!dailyResp.ok) {
    throw new Error(`Failed to load sample daily report file: HTTP ${dailyResp.status}`);
  }

  const [mclBuffer, dailyBuffer] = await Promise.all([
    mclResp.arrayBuffer(),
    dailyResp.arrayBuffer(),
  ]);

  const doctorsResult = parseAssignedDoctorsExcel(mclBuffer);
  const dailyResult = parseDailyReportExcel(dailyBuffer);

  return { doctorsResult, dailyResult };
}
