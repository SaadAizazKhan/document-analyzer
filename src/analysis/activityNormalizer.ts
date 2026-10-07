import { ActivityType, NormalizedActivity } from '../types/analyzer';
import { parseExcelDate } from '../utils/dateUtils';

/**
 * Splits customer cell text containing multiple doctors into individual names
 */
export function splitMultipleDoctors(text: string): string[] {
  if (!text || !text.trim()) return [];

  const trimmed = text.trim();

  // If text contains multiple doctor markers or standard delimiters
  // Split on commas, semicolons, '&', 'and', '+'
  const parts = trimmed.split(/,|\band\b|&|\+/i);

  const results: string[] = [];
  for (const part of parts) {
    const clean = part.trim().replace(/^[-–—]\s*/, '').trim();
    if (clean.length > 1) {
      results.push(clean);
    }
  }

  return results.length > 0 ? results : [trimmed];
}

/**
 * Determines whether a given text represents a non-doctor activity
 */
export function classifyActivityType(customerText: string, hospitalText?: string, productText?: string): ActivityType {
  const trimmedCust = customerText ? customerText.trim() : '';
  const customerParts = splitMultipleDoctors(trimmedCust);

  // If there are multiple entries and at least one is a potential doctor candidate,
  // keep row as DOCTOR_VISIT so candidate-level evaluation processes each entity
  if (customerParts.length > 1) {
    const hasDoctorCandidate = customerParts.some(p => {
      const lowerP = p.toLowerCase().trim();
      return !/^(office|admin|tender|meeting|cme|conference|transit|travel|xx|nil|na|tne|coffee)$/i.test(lowerP) && p.length > 2;
    });
    if (hasDoctorCandidate) {
      return 'DOCTOR_VISIT';
    }
  }

  const combined = `${customerText} ${hospitalText || ''} ${productText || ''}`.toLowerCase();

  if (/\b(office|tne and coffee|coffee)\b/i.test(combined)) return 'OFFICE';
  if (/\b(admin|addmin|tender|payment)\b/i.test(combined)) return 'ADMIN';
  if (/\b(purchase)\b/i.test(combined)) return 'PURCHASE';
  if (/\b(ot incharge|ot activity|ot)\b/i.test(combined)) return 'OT_ACTIVITY';
  if (/\b(monthly meeting|review meeting|sales review|meeting)\b/i.test(combined) && !/\bdr\b/i.test(customerText)) return 'MEETING';
  if (/\b(cme)\b/i.test(combined)) return 'CME';
  if (/\b(conference)\b/i.test(combined)) return 'CONFERENCE';
  if (/\b(transit|travel)\b/i.test(combined)) return 'TRANSIT';
  if (/\b(apex meet|patient parameters|holiday|sunday|weekly off)\b/i.test(combined)) return 'OTHER';

  // If customer text contains doctor indicator or a person's name
  if (customerText && customerText.trim().length > 2) {
    return 'DOCTOR_VISIT';
  }

  return 'UNKNOWN';
}

/**
 * Extracts meeting number from text like "Meeting -1", "Meeting 2"
 */
function extractMeetingNumber(text: string): number | undefined {
  const match = text.match(/meeting\s*[-–—]?\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : undefined;
}

/**
 * Normalizes raw sheet rows (handling Format A Flat, Format B Meetings, and Format C Dr's Met) into unified NormalizedActivity[]
 */
export function normalizeDailyActivities(
  rows: any[][],
  headers: string[],
  sourceFileName: string = 'Daily Report'
): NormalizedActivity[] {
  if (!rows || rows.length <= 1) return [];

  // Map header column indices
  let colDate = -1;
  let colDay = -1;
  let colCity = -1;
  let colJoint = -1;
  let colCustomer = -1;
  let colHospital = -1;
  let colProduct = -1;
  let colOutcome = -1;
  let colRemarks = -1;
  let colSupport = -1;
  let colCampaign = -1;

  headers.forEach((h, idx) => {
    const lower = String(h || '').trim().toLowerCase();
    if ((/month|date/i.test(lower) || idx === 0) && colDate === -1) colDate = idx;
    else if (/^day$/i.test(lower)) colDay = idx;
    else if (/^(city|town|station)$/i.test(lower)) colCity = idx;
    else if (/joint/i.test(lower)) colJoint = idx;
    else if (/name(\s+of)?(\s+the)?\s*customer|doctor|dr'?s?\s*met/i.test(lower)) colCustomer = idx;
    else if (/hospital/i.test(lower)) colHospital = idx;
    else if (/product|product\s*discussed/i.test(lower) && colProduct === -1) colProduct = idx;
    else if (/outcome|mktg\s*commitment|marketing\s*commitment/i.test(lower)) colOutcome = idx;
    else if (/remark|other\s*commitment/i.test(lower)) colRemarks = idx;
    else if (/support|next\s*visit\s*objective|objective/i.test(lower) && colSupport === -1) colSupport = idx;
    else if (/campaign/i.test(lower)) colCampaign = idx;
  });

  // Fallback if colCustomer not matched
  if (colCustomer === -1) {
    colCustomer = headers.findIndex((_, idx) => idx === 4);
  }
  if (colHospital === -1) {
    colHospital = headers.findIndex((_, idx) => idx === 5);
  }

  const activities: NormalizedActivity[] = [];

  // Propagation trackers
  let currentDate: string = '';
  let currentParsedDate: Date | null = null;
  let currentDay: string = '';
  let currentCity: string = '';
  let currentJoint: string = '';

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const cell0 = row[colDate !== -1 ? colDate : 0];
    const cell0Str = cell0 !== undefined && cell0 !== null ? String(cell0).trim() : '';

    const isMeetingRow = /meeting\s*[-–—]?\s*\d+/i.test(cell0Str);

    // Check if cell0 is a date
    const { date, dateStr } = parseExcelDate(cell0);
    const hasValidDateInCell0 = date !== null && !isMeetingRow;

    if (hasValidDateInCell0) {
      currentDate = dateStr;
      currentParsedDate = date;
      if (colDay !== -1 && row[colDay]) currentDay = String(row[colDay]).trim();
      if (colCity !== -1 && row[colCity]) currentCity = String(row[colCity]).trim();
      if (colJoint !== -1 && row[colJoint]) currentJoint = String(row[colJoint]).trim();
    }

    // Row-level overrides
    const rowCity = colCity !== -1 && row[colCity] ? String(row[colCity]).trim() : currentCity;
    const rowDay = colDay !== -1 && row[colDay] ? String(row[colDay]).trim() : currentDay;
    const rowJoint = colJoint !== -1 && row[colJoint] ? String(row[colJoint]).trim() : currentJoint;

    const rawCustomer = colCustomer !== -1 && row[colCustomer] !== undefined && row[colCustomer] !== null
      ? String(row[colCustomer]).trim()
      : '';
    const rawHospital = colHospital !== -1 && row[colHospital] !== undefined && row[colHospital] !== null
      ? String(row[colHospital]).trim()
      : '';
    const rawProduct = colProduct !== -1 && row[colProduct] !== undefined && row[colProduct] !== null
      ? String(row[colProduct]).trim()
      : '';
    const rawOutcome = colOutcome !== -1 && row[colOutcome] !== undefined && row[colOutcome] !== null
      ? String(row[colOutcome]).trim()
      : '';
    const rawRemarks = colRemarks !== -1 && row[colRemarks] !== undefined && row[colRemarks] !== null
      ? String(row[colRemarks]).trim()
      : '';
    const rawSupport = colSupport !== -1 && row[colSupport] !== undefined && row[colSupport] !== null
      ? String(row[colSupport]).trim()
      : '';
    const rawCampaign = colCampaign !== -1 && row[colCampaign] !== undefined && row[colCampaign] !== null
      ? String(row[colCampaign]).trim()
      : '';

    // Discard empty meeting slots (e.g. `["Meeting  -3"]` where customer, hospital, product, etc. are empty)
    if (!rawCustomer && !rawHospital && !rawProduct && !rawOutcome && !rawRemarks) {
      continue;
    }

    // Identify meeting number if Format B
    const meetingNumber = isMeetingRow ? extractMeetingNumber(cell0Str) : undefined;

    // Split multiple doctors in customer cell
    const customerNames = splitMultipleDoctors(rawCustomer);

    // Classify activity type
    const activityType = classifyActivityType(rawCustomer, rawHospital, rawProduct);

    activities.push({
      id: `act_${r}_${activities.length}`,
      date: currentDate || (dateStr || ''),
      parsedDate: currentParsedDate || date,
      day: rowDay,
      city: rowCity,
      meetingNumber,
      jointWorkingWith: rowJoint,
      originalCustomerText: rawCustomer,
      originalHospitalText: rawHospital,
      customerNames,
      hospital: rawHospital,
      product: rawProduct,
      outcome: rawOutcome,
      remarks: rawRemarks,
      supportRequired: rawSupport,
      campaignFeedback: rawCampaign,
      activityType,
      sourceFile: sourceFileName,
      sourceRowNumber: r + 1,
    });
  }

  return activities;
}
