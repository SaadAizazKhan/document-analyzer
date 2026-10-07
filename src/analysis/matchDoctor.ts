import { AssignedDoctor, MatchEvaluation, MatchStatus, NormalizedActivity } from '../types/analyzer';
import { normalizeDoctorName, normalizeHospitalName, normalizeCityName } from './normalizeDoctorName';
import { checkNonDoctorActivity } from './nonDoctorDetector';

/**
 * Calculates Sorensen-Dice coefficient between two strings based on bigrams (0 to 1)
 */
function diceCoefficient(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1.0;
  if (s1.length < 2 || s2.length < 2) {
    return s1 === s2 ? 1.0 : 0;
  }

  const bigrams1 = new Map<string, number>();
  for (let i = 0; i < s1.length - 1; i++) {
    const bigram = s1.substring(i, i + 2);
    bigrams1.set(bigram, (bigrams1.get(bigram) || 0) + 1);
  }

  let intersection = 0;
  for (let i = 0; i < s2.length - 1; i++) {
    const bigram = s2.substring(i, i + 2);
    const count = bigrams1.get(bigram) || 0;
    if (count > 0) {
      bigrams1.set(bigram, count - 1);
      intersection++;
    }
  }

  return (2.0 * intersection) / (s1.length - 1 + s2.length - 1);
}

/**
 * Calculates Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix = Array.from({ length: bn + 1 }, (_, i) => [i]);
  for (let j = 0; j <= an; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[bn][an];
}

/**
 * Computes string similarity percentage (0 - 100) combining Levenshtein and Dice
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 100;

  const dice = diceCoefficient(str1, str2) * 100;
  const maxLen = Math.max(str1.length, str2.length);
  const levDist = levenshteinDistance(str1, str2);
  const levScore = Math.max(0, (1 - levDist / maxLen) * 100);

  // Check token permutation (e.g. "UDIT GADHVI" vs "GADHVI UDIT")
  const tokens1 = str1.split(' ').filter(Boolean).sort().join(' ');
  const tokens2 = str2.split(' ').filter(Boolean).sort().join(' ');
  if (tokens1 === tokens2) {
    return 98;
  }

  // Blended score
  return Math.round(0.6 * dice + 0.4 * levScore);
}

export function determineMatchStatus(score: number): MatchStatus {
  if (score >= 95) return 'Strong';
  if (score >= 85) return 'Good';
  if (score >= 70) return 'Review Required';
  return 'Unmatched';
}

/**
 * Matches an individual doctor candidate name against assigned doctors list
 */
export function matchDoctorCandidateName(
  candidateName: string,
  hospitalName: string,
  cityName: string,
  assignedDoctors: AssignedDoctor[]
): {
  matchedDoctor: AssignedDoctor | null;
  score: number;
  status: MatchStatus;
  matchLevel: 'Level 1: Exact' | 'Level 2: Hospital' | 'Level 3: City' | 'Level 4: Fuzzy' | 'Unmatched';
  reason: string;
} {
  const normCandidate = normalizeDoctorName(candidateName);
  if (!normCandidate) {
    return {
      matchedDoctor: null,
      score: 0,
      status: 'Unmatched',
      matchLevel: 'Unmatched',
      reason: 'Empty doctor candidate name',
    };
  }

  const dailyHosp = normalizeHospitalName(hospitalName);
  const dailyCity = normalizeCityName(cityName);

  // Level 1: Check Exact Normalized Name match
  const exactNameMatches = assignedDoctors.filter(d => d.normalizedName === normCandidate);
  if (exactNameMatches.length === 1) {
    return {
      matchedDoctor: exactNameMatches[0],
      score: 100,
      status: 'Strong',
      matchLevel: 'Level 1: Exact',
      reason: 'Exact normalized doctor name match',
    };
  } else if (exactNameMatches.length > 1) {
    // Disambiguate by Hospital or City
    const withHosp = exactNameMatches.filter(d => normalizeHospitalName(d.hospital) === dailyHosp);
    if (withHosp.length === 1) {
      return {
        matchedDoctor: withHosp[0],
        score: 98,
        status: 'Strong',
        matchLevel: 'Level 2: Hospital',
        reason: 'Name matched multiple master doctors; disambiguated by Hospital',
      };
    }
    const withCity = exactNameMatches.filter(d => normalizeCityName(d.city) === dailyCity);
    if (withCity.length === 1) {
      return {
        matchedDoctor: withCity[0],
        score: 96,
        status: 'Strong',
        matchLevel: 'Level 3: City',
        reason: 'Name matched multiple master doctors; disambiguated by City',
      };
    }
    return {
      matchedDoctor: exactNameMatches[0],
      score: 80,
      status: 'Review Required',
      matchLevel: 'Level 1: Exact',
      reason: 'Multiple master doctors share this name across hospitals/cities',
    };
  }

  // Level 2, 3 & 4: Evaluate fuzzy and contextual match across all assigned doctors
  let bestCandidate: AssignedDoctor | null = null;
  let bestScore = 0;
  let bestLevel: 'Level 2: Hospital' | 'Level 3: City' | 'Level 4: Fuzzy' | 'Unmatched' = 'Unmatched';
  let bestReason = '';

  for (const doc of assignedDoctors) {
    const nameSim = calculateStringSimilarity(normCandidate, doc.normalizedName);
    const docHosp = normalizeHospitalName(doc.hospital);
    const docCity = normalizeCityName(doc.city);

    const hospMatch = dailyHosp && docHosp && (dailyHosp === docHosp || docHosp.includes(dailyHosp) || dailyHosp.includes(docHosp));
    const cityMatch = dailyCity && docCity && dailyCity === docCity;

    let adjustedScore = nameSim;
    let level: 'Level 2: Hospital' | 'Level 3: City' | 'Level 4: Fuzzy' = 'Level 4: Fuzzy';
    let matchDesc = `Fuzzy name match (${nameSim}%)`;

    // Apply contextual boosts if names are closely related
    if (nameSim >= 70) {
      if (hospMatch && cityMatch) {
        adjustedScore = Math.min(100, nameSim + 8);
        level = 'Level 2: Hospital';
        matchDesc = `Fuzzy name (${nameSim}%) confirmed by Hospital & City`;
      } else if (hospMatch) {
        adjustedScore = Math.min(100, nameSim + 6);
        level = 'Level 2: Hospital';
        matchDesc = `Fuzzy name (${nameSim}%) confirmed by Hospital`;
      } else if (cityMatch) {
        adjustedScore = Math.min(100, nameSim + 4);
        level = 'Level 3: City';
        matchDesc = `Fuzzy name (${nameSim}%) confirmed by City`;
      }
    }

    if (adjustedScore > bestScore) {
      bestScore = adjustedScore;
      bestCandidate = doc;
      bestLevel = level;
      bestReason = matchDesc;
    }
  }

  const finalStatus = determineMatchStatus(bestScore);

  if (bestScore >= 85 && bestCandidate) {
    return {
      matchedDoctor: bestCandidate,
      score: bestScore,
      status: finalStatus,
      matchLevel: bestLevel,
      reason: bestReason,
    };
  } else if (bestScore >= 70 && bestCandidate) {
    return {
      matchedDoctor: bestCandidate,
      score: bestScore,
      status: 'Review Required',
      matchLevel: bestLevel,
      reason: `${bestReason} - requires manual confirmation`,
    };
  } else {
    return {
      matchedDoctor: null,
      score: bestScore,
      status: 'Unmatched',
      matchLevel: 'Unmatched',
      reason: bestCandidate
        ? `No sufficient match found (Closest: "${bestCandidate.rawName}", ${bestScore}%)`
        : 'Doctor not found in master assigned list',
    };
  }
}

/**
 * Matches a single daily activity candidate against assigned doctors list
 */
export function matchDailyActivity(
  activity: NormalizedActivity,
  candidateName: string,
  assignedDoctors: AssignedDoctor[]
): MatchEvaluation {
  // If activity is explicitly non-doctor
  if (activity.activityType && activity.activityType !== 'DOCTOR_VISIT') {
    return {
      activityId: activity.id,
      candidateName,
      matchedDoctor: null,
      score: 0,
      status: 'Unmatched',
      matchLevel: 'Non-Doctor Activity',
      reason: `Non-doctor activity (${activity.activityType}: ${activity.originalCustomerText || activity.hospital || activity.product})`,
      isCountedAsVisit: false,
    };
  }

  // Check additional keyword patterns
  const nonDoctorCheck = checkNonDoctorActivity(candidateName);
  if (nonDoctorCheck.isNonDoctor && !nonDoctorCheck.isMultipleDoctors) {
    return {
      activityId: activity.id,
      candidateName,
      matchedDoctor: null,
      score: 0,
      status: 'Unmatched',
      matchLevel: 'Non-Doctor Activity',
      reason: nonDoctorCheck.reason || 'Non-doctor administrative activity',
      isCountedAsVisit: false,
    };
  }

  const result = matchDoctorCandidateName(
    candidateName,
    activity.hospital || '',
    activity.city || '',
    assignedDoctors
  );

  return {
    activityId: activity.id,
    candidateName,
    matchedDoctor: result.matchedDoctor,
    score: result.score,
    status: result.status,
    matchLevel: result.matchLevel,
    reason: result.reason,
    isCountedAsVisit: result.status === 'Strong' || result.status === 'Good',
  };
}
