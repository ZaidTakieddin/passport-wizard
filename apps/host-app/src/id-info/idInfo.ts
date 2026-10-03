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

function hasIdNumber(values: IdInfoValues): boolean {
  return values.idNumber.trim().length > 0;
}

export function validateIdInfo(values: IdInfoValues): IdInfoErrors {
  const errors: IdInfoErrors = {};
  if (!hasIdNumber(values)) errors.idNumber = 'Enter your ID number.';
  if (!isNationalityCode(values.nationality)) errors.nationality = 'Select your nationality.';
  return errors;
}

/** The trimmed ID details when every rule passes, otherwise null. */
export function parseIdInfo(values: IdInfoValues): IdInfo | null {
  const { nationality } = values;
  if (!hasIdNumber(values) || !isNationalityCode(nationality)) return null;
  return { idNumber: values.idNumber.trim(), nationality };
}
