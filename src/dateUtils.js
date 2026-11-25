const MONTH_SHORT_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const MONTH_FULL_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Returns today's calendar date in Sri Lanka (Asia/Colombo) strictly formatted as YYYY-MM-DD.
 * Uses formatToParts so browser OS locale can never swap month and day.
 */
export function getSriLankaTodayString() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === 'year')?.value || '2026';
  const month = parts.find((p) => p.type === 'month')?.value || '01';
  const day = parts.find((p) => p.type === 'day')?.value || '01';
  return `${year}-${month}-${day}`;
}

/**
 * Exact days in a Gregorian calendar month (month is 1-based: 1..12).
 */
export function daysInMonth(year, month) {
  if (month === 2) {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return isLeap ? 29 : 28;
  }
  if (month === 4 || month === 6 || month === 9 || month === 11) {
    return 30;
  }
  return 31;
}

/**
 * Formats integer year, 1-based month, and day into canonical YYYY-MM-DD.
 */
export function buildIsoDate(year, month, day) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Strictly parses a YYYY-MM-DD date string (or midnight ISO timestamp YYYY-MM-DDT00:00:00...).
 * Validates leap years and real calendar days without using JS Date rollover or timezone shifts.
 * Returns { year, month, day, iso } or null.
 */
export function parseStrictIsoDate(str) {
  if (!str || typeof str !== 'string') return null;
  const trimmed = str.trim();
  const match = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:$|T00:00:00(?:\.0+)?(?:Z|[+-]\d{2}:?\d{2})?$)/
  );
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (year < 1850 || year > 2100) return null;
  if (month < 1 || month > 12) return null;

  const maxDay = daysInMonth(year, month);
  if (day < 1 || day > maxDay) return null;

  return {
    year,
    month,
    day,
    iso: `${match[1]}-${match[2]}-${match[3]}`
  };
}

/**
 * Normalizes unambiguous YYYY-M-D or YYYY/M/D input on blur into zero-padded YYYY-MM-DD.
 * Never attempts to guess 2-digit prefix formats like MM-DD-YYYY or DD-MM-YYYY.
 */
export function normalizeLooseIsoOnBlur(str) {
  if (!str || typeof str !== 'string') return '';
  const cleaned = str.trim().replace(/[./]/g, '-');
  const match = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return cleaned;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (year < 1850 || year > 2100 || month < 1 || month > 12) return cleaned;
  if (day < 1 || day > daysInMonth(year, month)) return cleaned;

  return buildIsoDate(year, month, day);
}

/**
 * Validates a user-entered ISO date string against strict YYYY-MM-DD rules and optional bounds.
 * Returns { valid: boolean, error: string | null, iso: string }.
 */
export function validateIsoDateInput(str, { required = false, minDate = null, maxDate = null } = {}) {
  const raw = typeof str === 'string' ? str.trim() : '';
  if (!raw) {
    if (required) {
      return { valid: false, error: 'Date is required (YYYY-MM-DD).', iso: '' };
    }
    return { valid: true, error: null, iso: '' };
  }

  // Catch accidental DD-MM-YYYY or MM-DD-YYYY entry immediately
  if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$/.test(raw)) {
    return {
      valid: false,
      error: 'Use YYYY-MM-DD format (4-digit year first, e.g. 1995-05-14).',
      iso: raw
    };
  }

  const normalized = normalizeLooseIsoOnBlur(raw);
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return {
      valid: false,
      error: 'Enter full date as YYYY-MM-DD (e.g. 1995-05-14).',
      iso: raw
    };
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (year < 1850 || year > 2100) {
    return { valid: false, error: 'Year must be between 1850 and 2100.', iso: normalized };
  }
  if (month < 1 || month > 12) {
    return {
      valid: false,
      error: 'Invalid month — use YYYY-MM-DD (month must be 01–12).',
      iso: normalized
    };
  }

  const maxDay = daysInMonth(year, month);
  if (day < 1 || day > maxDay) {
    return {
      valid: false,
      error: `Invalid day for ${MONTH_SHORT_NAMES[month - 1]} ${year} (1–${maxDay}).`,
      iso: normalized
    };
  }

  if (maxDate && normalized > maxDate) {
    return { valid: false, error: `Date cannot be after ${maxDate}.`, iso: normalized };
  }
  if (minDate && normalized < minDate) {
    return { valid: false, error: `Date cannot be before ${minDate}.`, iso: normalized };
  }

  return { valid: true, error: null, iso: normalized };
}

/**
 * Timezone-safe integer age calculation from YYYY-MM-DD birth date against Sri Lanka today.
 */
export function calculateAge(birthDateString) {
  const birth = parseStrictIsoDate(birthDateString);
  if (!birth) return 'Not Recorded';

  const today = parseStrictIsoDate(getSriLankaTodayString());
  if (!today) return 'Not Recorded';
  if (birth.iso > today.iso) return 'Invalid Date';

  let years = today.year - birth.year;
  let months = today.month - birth.month;
  if (today.day < birth.day) {
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years < 1) return `${Math.max(0, months)} Months`;
  return `${years} Years`;
}

/**
 * Returns integer completed years for clinical calculators (e.g. Framingham CVD).
 * Returns null if birthDateString is empty, invalid, or in the future.
 */
export function getAgeYears(birthDateString) {
  const birth = parseStrictIsoDate(birthDateString);
  if (!birth) return null;

  const today = parseStrictIsoDate(getSriLankaTodayString());
  if (!today || birth.iso > today.iso) return null;

  let years = today.year - birth.year;
  if (today.month < birth.month || (today.month === birth.month && today.day < birth.day)) {
    years -= 1;
  }
  return Math.max(0, years);
}

/**
 * Displays a clear, unambiguous date string (e.g. "14 May 1995").
 * Pure YYYY-MM-DD strings never shift by timezone; full UTC timestamps convert to Asia/Colombo.
 */
export function formatClearDate(dateString) {
  if (!dateString) return 'Not Recorded';

  const pure = parseStrictIsoDate(dateString);
  if (pure) {
    return `${String(pure.day).padStart(2, '0')} ${MONTH_SHORT_NAMES[pure.month - 1]} ${pure.year}`;
  }

  // Only treat as instant timestamp if it carries a non-midnight time component
  if (typeof dateString === 'string' && /T\d{2}:\d{2}/.test(dateString)) {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Colombo',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(date);
    }
  }

  return 'Not Recorded';
}

/**
 * Shifts a valid YYYY-MM-DD date by deltaDays without local timezone drift.
 */
export function shiftIsoDate(isoStr, deltaDays) {
  const parsed = parseStrictIsoDate(isoStr) || parseStrictIsoDate(getSriLankaTodayString());
  if (!parsed) return getSriLankaTodayString();

  const dt = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day + deltaDays, 12, 0, 0));
  return buildIsoDate(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}
