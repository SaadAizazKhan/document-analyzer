export interface NonDoctorCheckResult {
  isNonDoctor: boolean;
  reason?: string;
  isMultipleDoctors?: boolean;
}

const NON_DOCTOR_PATTERNS = [
  /\boffice\b/i,
  /\badmin\b/i,
  /\badmin\s*work\b/i,
  /\breview\s*meeting\b/i,
  /\bcme\b/i,
  /\bpurchase\b/i,
  /\bot\s*incharge\b/i,
  /\bpatient\s*parameters\b/i,
  /\bapex\s*meet\b/i,
  /\bhospital\s*admin\b/i,
  /\bhospital\s*administration\b/i,
  /\bmeeting\b/i,
  /\bweekly\s*off\b/i,
  /\bsunday\b/i,
  /\bholiday\b/i,
  /\bleave\b/i,
  /\btraining\b/i,
  /\btransit\b/i,
  /\btravel\b/i,
  /\bconference\b/i,
  /\bhead\s*office\b/i,
  /\bbranch\s*office\b/i,
  /^(xx|x|-|--|nil|na|n\/a)$/i,
  /\bteam(\s+at|\s+in)?\b/i,
  /& team/i,
  /sir & team/i,
  /\b(tne|coffee)\b/i,
  /^(u\s*n\s*mehta\s*hospital|cims\s*hospital|apollo\s*hospital|sterling\s*hospital)$/i,
];

/**
 * Checks if a daily report activity row is a non-doctor activity or contains multiple doctors
 */
export function checkNonDoctorActivity(rawDoctorOrActivityName: string | undefined | null): NonDoctorCheckResult {
  if (!rawDoctorOrActivityName || !rawDoctorOrActivityName.trim()) {
    return {
      isNonDoctor: true,
      reason: 'Empty customer / doctor field',
    };
  }

  const trimmed = rawDoctorOrActivityName.trim();

  // Check for multiple doctor record (e.g. "DR PRIYANK BHATT & DR XYZ")
  const hasMultipleDrPattern = /(\bDR\.?\s+[^&+\/]+(&|\band\b|\+|\/)\s*DR\.?)/i.test(trimmed);
  if (hasMultipleDrPattern) {
    return {
      isNonDoctor: true,
      isMultipleDoctors: true,
      reason: 'Multiple / Ambiguous Doctor Record (requires manual review)',
    };
  }

  // Check for non-doctor operational and administrative patterns
  for (const pattern of NON_DOCTOR_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isNonDoctor: true,
        reason: `Non-doctor administrative activity (${trimmed})`,
      };
    }
  }

  return { isNonDoctor: false };
}
