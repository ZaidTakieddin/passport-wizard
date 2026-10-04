import type {
  PassportDocument,
  PassportDocumentMimeType,
  PassportFormState,
  PassportFormValues,
} from 'passport-contract';
import { z } from 'zod';

export const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
] as const satisfies readonly PassportDocumentMimeType[];

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const EMPTY_PASSPORT_VALUES: PassportFormValues = {
  passportNumber: '',
  firstName: '',
  lastName: '',
  issueDate: '',
  expiryDate: '',
  document: null,
};

export function isAcceptedMimeType(type: string): type is PassportDocumentMimeType {
  return (ACCEPTED_MIME_TYPES as readonly string[]).includes(type);
}

// Both values are YYYY-MM-DD, so comparing the strings compares the calendar dates
// without any time zone conversion.
export function isExpiryAfterIssue(issueDate: string, expiryDate: string): boolean {
  return expiryDate > issueDate;
}

/** The day after `date` as YYYY-MM-DD, or undefined if `date` is not a full date. */
export function nextDay(date: string): string | undefined {
  if (!ISO_DATE.test(date)) return undefined;
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + 1);
  return day.toISOString().slice(0, 10);
}

// First bytes of each format. The browser derives a file's type from its extension, so these
// catch a renamed file whose contents are something else.
const FILE_SIGNATURES: Record<PassportDocumentMimeType, readonly number[]> = {
  'application/pdf': [0x25, 0x50, 0x44, 0x46, 0x2d], // "%PDF-"
  'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/jpg': [0xff, 0xd8, 0xff],
};

export const CONTENT_MISMATCH_MESSAGE = 'This file isn’t a valid PDF, PNG or JPEG.';

/** Whether the file's contents start like the format its MIME type claims. */
export function hasMatchingSignature({
  mimeType,
  base64,
}: Pick<PassportDocument, 'mimeType' | 'base64'>): boolean {
  let header: string;
  try {
    // 12 base64 characters decode to the first 9 bytes, enough for every signature above.
    header = atob(base64.slice(0, 12));
  } catch {
    return false;
  }
  return FILE_SIGNATURES[mimeType].every((byte, index) => header.charCodeAt(index) === byte);
}

/** Checks a file selection before it is read. Returns an error message, or null if it is acceptable. */
export function getFileSelectionError(files: ArrayLike<Pick<File, 'type' | 'size'>>): string | null {
  if (files.length !== 1) return 'Upload one file only.';
  const file = files[0];
  if (!isAcceptedMimeType(file.type)) return 'Upload a PDF, PNG or JPEG file.';
  if (file.size === 0) return 'This file is empty. Choose another file.';
  if (file.size > MAX_FILE_SIZE_BYTES) return 'The file must be 5 MB or smaller.';
  return null;
}

const requiredText = (message: string) => z.string().trim().min(1, message);

// Passport number: 3 to 9 characters, capital letters A–Z and digits 0–9 only. The maximum and
// the character set follow ICAO Doc 9303 Part 4: the number fills positions 1–9 of the
// machine-readable zone, which has no lower-case letters, spaces or symbols. The minimum of 3 is
// a project rule. Lower-case letters are rejected, not converted.
export const PASSPORT_NUMBER_MIN_LENGTH = 3;
export const PASSPORT_NUMBER_MAX_LENGTH = 9;

const PASSPORT_NUMBER_LENGTH_MESSAGE = `A passport number has ${PASSPORT_NUMBER_MIN_LENGTH} to ${PASSPORT_NUMBER_MAX_LENGTH} characters.`;

const passportNumberSchema = z
  .string()
  .trim()
  .min(1, 'Enter your passport number.')
  .regex(/^[A-Z0-9]*$/, 'Use capital letters A–Z and digits 0–9 only, with no spaces or symbols.')
  .min(PASSPORT_NUMBER_MIN_LENGTH, PASSPORT_NUMBER_LENGTH_MESSAGE)
  .max(PASSPORT_NUMBER_MAX_LENGTH, PASSPORT_NUMBER_LENGTH_MESSAGE);

const requiredDate = (message: string) =>
  z.string().min(1, message).regex(ISO_DATE, 'Enter a complete date.');

const documentSchema = z
  .custom<PassportDocument | null>()
  .refine((document) => document !== null, 'Upload your passport document.')
  .refine(
    (document) => document === null || isAcceptedMimeType(document.mimeType),
    'Upload a PDF, PNG or JPEG file.',
  )
  .refine(
    (document) => document === null || document.base64.length > 0,
    'This file is empty. Choose another file.',
  )
  .refine((document) => document === null || hasMatchingSignature(document), CONTENT_MISMATCH_MESSAGE);

/** Every rule for the passport form. Used for inline errors and for the validity reported to the host. */
export const passportSchema = z
  .object({
    passportNumber: passportNumberSchema,
    firstName: requiredText('Enter your first name.'),
    lastName: requiredText('Enter your last name.'),
    issueDate: requiredDate('Enter the issue date.'),
    expiryDate: requiredDate('Enter the expiry date.'),
    document: documentSchema,
  })
  .superRefine(({ issueDate, expiryDate }, ctx) => {
    if (ISO_DATE.test(issueDate) && ISO_DATE.test(expiryDate) && !isExpiryAfterIssue(issueDate, expiryDate)) {
      ctx.addIssue({
        code: 'custom',
        path: ['expiryDate'],
        message: 'The expiry date must be after the issue date.',
      });
    }
  });

// Same trimming as the schema applies to valid data, so reports look alike either way.
function normalizeValues(values: PassportFormValues): PassportFormValues {
  return {
    ...values,
    passportNumber: values.passportNumber.trim(),
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
  };
}

/** Derives what the form reports to the host from its current values. */
export function getPassportFormState(values: PassportFormValues): PassportFormState {
  const result = passportSchema.safeParse(values);
  if (result.success) {
    const { document } = result.data;
    if (document) {
      return { valid: true, data: { ...result.data, document } };
    }
  }
  return { valid: false, data: normalizeValues(values) };
}
