/**
 * Normalizes doctor names according to business specifications:
 * - Convert to uppercase
 * - Remove prefixes (DR, DR., DOCTOR, D R)
 * - Remove punctuation and special characters
 * - Normalize multiple spaces to single space and trim
 */
export function normalizeDoctorName(rawName: string | undefined | null): string {
  if (!rawName) return '';

  let name = String(rawName).trim().toUpperCase();

  // Remove common medical title prefixes at start of string or words
  name = name.replace(/^(DR\.?|DOCTOR|D\.R\.?)\s+/i, '');
  name = name.replace(/\b(DR\.?|DOCTOR)\b/gi, '');

  // Replace special characters and punctuation with spaces
  name = name.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'\[\]]/g, ' ');

  // Collapse multiple whitespaces
  name = name.replace(/\s+/g, ' ').trim();

  return name;
}

/**
 * Normalizes hospital or institution names for matching
 */
export function normalizeHospitalName(rawHospital: string | undefined | null): string {
  if (!rawHospital) return '';

  let hosp = String(rawHospital).trim().toUpperCase();
  hosp = hosp.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'\[\]]/g, ' ');
  hosp = hosp.replace(/\s+/g, ' ').trim();

  // Normalize common hospital abbreviations
  hosp = hosp.replace(/\bHOSP\b/g, 'HOSPITAL');
  return hosp;
}

/**
 * Normalizes city names
 */
export function normalizeCityName(rawCity: string | undefined | null): string {
  if (!rawCity) return '';
  return String(rawCity).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}
