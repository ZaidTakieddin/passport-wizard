// Rules for the host's own ID form. Passport rules are not here: the PassportForm remote owns them.

export const NATIONALITIES = [
  { code: 'EG', name: 'Egypt' },
  { code: 'IN', name: 'India' },
  { code: 'JO', name: 'Jordan' },
  { code: 'LB', name: 'Lebanon' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'PH', name: 'Philippines' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
] as const;

/** ISO 3166-1 alpha-2 code, as used in the payload (e.g. "AE"). */
export type NationalityCode = (typeof NATIONALITIES)[number]['code'];

/** The ID form's values while editing. `nationality` is empty until one is chosen. */
export interface IdInfoValues {
  idNumber: string;
  nationality: string;
}

/** Valid ID details, exactly as they appear in the submitted payload. */
export interface IdInfo {
  idNumber: string;
  nationality: NationalityCode;
}

export type IdInfoErrors = Partial<Record<keyof IdInfoValues, string>>;

export const EMPTY_ID_INFO: IdInfoValues = { idNumber: '', nationality: '' };

function isNationalityCode(value: string): value is NationalityCode {
  return NATIONALITIES.some((nationality) => nationality.code === value);
}

// Emirates ID: 15 digits laid out as 784-YYYY-NNNNNNN-N, accepted with or without separators.
// 784 is the UAE's ISO 3166 numeric code. YYYY is usually the holder's birth year, but not
// always, so it isn't checked as a date. The last digit's algorithm isn't published by the
// issuing authority, so it isn't checked either: a guessed checksum would reject real IDs.
const EMIRATES_ID = /^784[-\s]?(\d{4})[-\s]?(\d{7})[-\s]?(\d)$/;

export const EMIRATES_ID_EXAMPLE = '784-1980-1234567-8';

/** The Emirates ID in its printed form (784-YYYY-NNNNNNN-N), or the reason it isn't valid. */
function parseEmiratesId(value: string): { idNumber: string } | { error: string } {
  const trimmed = value.trim();
  if (!trimmed) return { error: 'Enter your Emirates ID number.' };

  const match = EMIRATES_ID.exec(trimmed);
  if (!match) return { error: `Enter the 15 digits that start with 784, e.g. ${EMIRATES_ID_EXAMPLE}.` };

  const [, year, sequence, lastDigit] = match;
  return { idNumber: `784-${year}-${sequence}-${lastDigit}` };
}

export function validateIdInfo(values: IdInfoValues): IdInfoErrors {
  const errors: IdInfoErrors = {};
  const emiratesId = parseEmiratesId(values.idNumber);
  if ('error' in emiratesId) errors.idNumber = emiratesId.error;
  if (!isNationalityCode(values.nationality)) errors.nationality = 'Select your nationality.';
  return errors;
}

/** The ID details as they go into the payload when every rule passes, otherwise null. */
export function parseIdInfo(values: IdInfoValues): IdInfo | null {
  const emiratesId = parseEmiratesId(values.idNumber);
  const { nationality } = values;
  if ('error' in emiratesId || !isNationalityCode(nationality)) return null;
  return { idNumber: emiratesId.idNumber, nationality };
}
