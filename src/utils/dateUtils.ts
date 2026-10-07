/**
 * Converts Excel serial date or string date to JS Date and formatted string (YYYY-MM-DD)
 */
export function parseExcelDate(val: any): { date: Date | null; dateStr: string } {
  if (val === undefined || val === null || val === '') {
    return { date: null, dateStr: '' };
  }

  // 1. Handle number or 5-digit numeric string (Excel serial date)
  let numVal: number = NaN;
  if (typeof val === 'number') {
    numVal = val;
  } else if (typeof val === 'string' && /^\d{5}$/.test(val.trim())) {
    numVal = Number(val.trim());
  }

  if (!isNaN(numVal) && numVal > 30000 && numVal < 60000) {
    // Excel base date: 1899-12-30 (handling the 1900 leap year bug)
    // 25569 is the number of days between 1899-12-30 and 1970-01-01
    const msSinceEpoch = Math.round((numVal - 25569) * 86400 * 1000);
    const date = new Date(msSinceEpoch);

    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');

    return {
      date: new Date(yyyy, date.getUTCMonth(), date.getUTCDate()),
      dateStr: `${yyyy}-${mm}-${dd}`,
    };
  }

  // 2. Handle Date object
  if (val instanceof Date) {
    const yyyy = val.getFullYear();
    const mm = String(val.getMonth() + 1).padStart(2, '0');
    const dd = String(val.getDate()).padStart(2, '0');
    return { date: val, dateStr: `${yyyy}-${mm}-${dd}` };
  }

  // 3. Handle string dates
  const str = String(val).trim();

  // If string contains non-date words (e.g. "Meeting -1", "Office", "Admin"), do NOT parse
  if (/\b(meeting|admin|office|purchase|holiday|sunday|review|cme)\b/i.test(str)) {
    return { date: null, dateStr: str };
  }

  // Check standard formatted date strings: YYYY-MM-DD or DD/MM/YYYY or MM/DD/YYYY
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    const date = new Date(y, m - 1, d);
    return { date, dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` };
  }

  const slashMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (slashMatch) {
    const m = parseInt(slashMatch[1], 10);
    const d = parseInt(slashMatch[2], 10);
    const y = parseInt(slashMatch[3], 10);
    const date = new Date(y, m - 1, d);
    return { date, dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` };
  }

  const parsedTimestamp = Date.parse(str);
  if (!isNaN(parsedTimestamp)) {
    const date = new Date(parsedTimestamp);
    if (date.getFullYear() >= 2020 && date.getFullYear() <= 2035) {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return { date, dateStr: `${yyyy}-${mm}-${dd}` };
    }
  }

  return { date: null, dateStr: str };
}
