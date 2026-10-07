import * as XLSX from 'xlsx';
import { AssignedDoctor, DoctorCategory, NormalizedActivity, ReportingPeriod } from '../types/analyzer';
import { normalizeDoctorName } from '../analysis/normalizeDoctorName';
import { normalizeDailyActivities } from '../analysis/activityNormalizer';

export interface ParseDoctorsResult {
  doctors: AssignedDoctor[];
  errors: string[];
  warnings: string[];
}

export interface ParseDailyReportResult {
  activities: NormalizedActivity[];
  detectedPeriod?: ReportingPeriod;
  errors: string[];
  warnings: string[];
}

export { parseExcelDate } from '../utils/dateUtils';

/**
 * Parses Master Assigned Doctors Excel
 */
export function parseAssignedDoctorsExcel(data: ArrayBuffer | Uint8Array | Buffer): ParseDoctorsResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const doctors: AssignedDoctor[] = [];

  try {
    const workbook = XLSX.read(data, { type: 'buffer' });
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return { doctors: [], errors: ['Excel file does not contain any sheets.'], warnings: [] };
    }

    // Find the sheet that looks like the master list
    let targetSheetName = workbook.SheetNames[0];
    let sheet = workbook.Sheets[targetSheetName];

    for (const name of workbook.SheetNames) {
      const s = workbook.Sheets[name];
      const rows = XLSX.utils.sheet_to_json(s, { header: 1 }) as any[][];
      if (rows && rows.length > 0) {
        const headerRow = rows[0] || [];
        const hasDoctor = headerRow.some((h: any) => /doctor|name/i.test(String(h)));
        const hasCategory = headerRow.some((h: any) => /category|class/i.test(String(h)));
        if (hasDoctor && hasCategory) {
          targetSheetName = name;
          sheet = s;
          break;
        }
      }
    }

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    if (rows.length === 0) {
      return { doctors: [], errors: ['Target sheet is empty.'], warnings: [] };
    }

    const headers = (rows[0] || []).map((h: any) => String(h || '').trim());

    // Map column indices
    let colSr = -1;
    let colCity = -1;
    let colDoctor = -1;
    let colHospital = -1;
    let colCategory = -1;

    headers.forEach((h, idx) => {
      const lower = h.toLowerCase();
      if (/sr(\.|\s)?no/i.test(lower) || lower === 'sr') colSr = idx;
      else if (/city|location|hq/i.test(lower)) colCity = idx;
      else if (/name(\s+of)?(\s+the)?\s*doctor|doctor\s*name/i.test(lower)) colDoctor = idx;
      else if (/hospital/i.test(lower)) colHospital = idx;
      else if (/category|class/i.test(lower)) colCategory = idx;
    });

    // Fallbacks if doctor column name is just "NAME"
    if (colDoctor === -1) {
      colDoctor = headers.findIndex(h => /name/i.test(h) && !/hospital|joint/i.test(h));
    }

    if (colDoctor === -1) {
      errors.push('Unable to identify the Doctor Name column (Expected: "NAME OF THE DOCTOR"). Detected columns: ' + headers.join(', '));
    }
    if (colCategory === -1) {
      errors.push('Unable to identify the Category column (Expected: "Category"). Detected columns: ' + headers.join(', '));
    }

    if (errors.length > 0) {
      return { doctors: [], errors, warnings };
    }

    // Parse records starting from row 1
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      const rawDoctor = String(row[colDoctor] || '').trim();
      const rawCategory = String(row[colCategory] || '').trim().toUpperCase();

      if (!rawDoctor) continue;

      let category: DoctorCategory = 'B';
      if (rawCategory === 'A' || rawCategory === 'B' || rawCategory === 'C') {
        category = rawCategory as DoctorCategory;
      } else {
        warnings.push(`Row ${r + 1}: Doctor "${rawDoctor}" has invalid or missing Category "${rawCategory}". Defaulted to B.`);
      }

      const srNo = colSr !== -1 && row[colSr] !== undefined ? row[colSr] : r;
      const city = colCity !== -1 ? String(row[colCity] || '').trim() : '';
      const hospital = colHospital !== -1 ? String(row[colHospital] || '').trim() : '';

      doctors.push({
        id: `doc_${r}_${normalizeDoctorName(rawDoctor).replace(/\s+/g, '_')}`,
        srNo,
        city,
        rawName: rawDoctor,
        normalizedName: normalizeDoctorName(rawDoctor),
        hospital,
        category,
      });
    }

    if (doctors.length === 0) {
      errors.push('No valid doctor rows found in assigned doctor list.');
    }

  } catch (err: any) {
    errors.push(`Failed to parse Assigned Doctor Excel: ${err.message || String(err)}`);
  }

  return { doctors, errors, warnings };
}

/**
 * Parses Daily Field Report Excel supporting Format A (Flat) and Format B (Date Header + Meetings)
 */
export function parseDailyReportExcel(data: ArrayBuffer | Uint8Array | Buffer): ParseDailyReportResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let activities: NormalizedActivity[] = [];
  let detectedPeriod: ReportingPeriod | undefined;

  try {
    const workbook = XLSX.read(data, { type: 'buffer' });
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return { activities: [], errors: ['Excel file does not contain any sheets.'], warnings: [] };
    }

    // Find the sheet for Daily activities (preference: "Daily update", "Daily report", etc.)
    let targetSheetName = '';
    for (const name of workbook.SheetNames) {
      const cleanName = name.trim().toLowerCase();
      if (cleanName.includes('daily') || cleanName.includes('activity') || cleanName.includes('update')) {
        targetSheetName = name;
        break;
      }
    }

    // If not found by name, scan headers
    if (!targetSheetName) {
      for (const name of workbook.SheetNames) {
        const s = workbook.Sheets[name];
        const rows = XLSX.utils.sheet_to_json(s, { header: 1 }) as any[][];
        if (rows && rows.length > 0) {
          const headerRow = rows[0] || [];
          const hasCustomer = headerRow.some((h: any) => /customer|doctor|admin/i.test(String(h)));
          if (hasCustomer) {
            targetSheetName = name;
            break;
          }
        }
      }
    }

    if (!targetSheetName) {
      targetSheetName = workbook.SheetNames[0];
    }

    const sheet = workbook.Sheets[targetSheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    if (rows.length === 0) {
      return { activities: [], errors: [`Sheet "${targetSheetName}" is empty.`], warnings: [] };
    }

    const headers = (rows[0] || []).map((h: any) => String(h || '').trim());

    // Call universal ActivityNormalizer
    activities = normalizeDailyActivities(rows, headers, targetSheetName);

    // Auto-detect reporting period from activities
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthCounts = new Map<string, number>();

    activities.forEach(act => {
      if (act.parsedDate) {
        const mName = monthNames[act.parsedDate.getMonth()];
        const key = `${mName}_${act.parsedDate.getFullYear()}`;
        monthCounts.set(key, (monthCounts.get(key) || 0) + 1);
      }
    });

    if (monthCounts.size > 0) {
      let maxMonth = '';
      let maxCount = 0;
      monthCounts.forEach((count, key) => {
        if (count > maxCount) {
          maxCount = count;
          maxMonth = key;
        }
      });
      if (maxMonth) {
        const [m, y] = maxMonth.split('_');
        detectedPeriod = { month: m, year: parseInt(y, 10) };
      }
    }

  } catch (err: any) {
    errors.push(`Failed to parse Daily Report Excel: ${err.message || String(err)}`);
  }

  return { activities, detectedPeriod, errors, warnings };
}

export interface DailyReportFileItem {
  name: string;
  buffer: ArrayBuffer;
}

/**
 * Parses multiple Daily Field Report Excels, combining and tagging their activities
 */
export function parseMultipleDailyReportExcels(files: DailyReportFileItem[]): ParseDailyReportResult {
  const allActivities: NormalizedActivity[] = [];
  const allErrors: string[] = [];
  const allWarnings: string[] = [];
  const monthCounts = new Map<string, number>();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  files.forEach(file => {
    try {
      const res = parseDailyReportExcel(file.buffer);
      // Tag source file name
      res.activities.forEach(act => {
        act.sourceFile = file.name;
        allActivities.push(act);

        if (act.parsedDate) {
          const mName = monthNames[act.parsedDate.getMonth()];
          const key = `${mName}_${act.parsedDate.getFullYear()}`;
          monthCounts.set(key, (monthCounts.get(key) || 0) + 1);
        }
      });

      if (res.errors.length > 0) {
        allErrors.push(`[${file.name}] ${res.errors.join(', ')}`);
      }
      if (res.warnings.length > 0) {
        allWarnings.push(`[${file.name}] ${res.warnings.join(', ')}`);
      }
    } catch (err: any) {
      allErrors.push(`Failed to process ${file.name}: ${err.message || String(err)}`);
    }
  });

  let detectedPeriod: ReportingPeriod | undefined;
  if (monthCounts.size > 0) {
    let maxMonth = '';
    let maxCount = 0;
    monthCounts.forEach((count, key) => {
      if (count > maxCount) {
        maxCount = count;
        maxMonth = key;
      }
    });
    if (maxMonth) {
      const [m, y] = maxMonth.split('_');
      detectedPeriod = { month: m, year: parseInt(y, 10) };
    }
  }

  return {
    activities: allActivities,
    detectedPeriod,
    errors: allErrors,
    warnings: allWarnings,
  };
}
