// Contract between the passport-form remote and the apps that host it.
// Types only: nothing here exists at runtime, so it never ends up in a bundle.

export type PassportDocumentMimeType = 'application/pdf' | 'image/png' | 'image/jpeg' | 'image/jpg';

export interface PassportDocument {
  fileName: string;
  mimeType: PassportDocumentMimeType;
  /** File contents as raw base64, without a `data:...;base64,` prefix. */
  base64: string;
}

/** The form's values while the user is editing. Any field may still be empty or invalid. */
export interface PassportFormValues {
  passportNumber: string;
  firstName: string;
  lastName: string;
  /** Calendar date as `YYYY-MM-DD`, or an empty string. */
  issueDate: string;
  /** Calendar date as `YYYY-MM-DD`, or an empty string. */
  expiryDate: string;
  document: PassportDocument | null;
}

/** Values that passed every rule: ready to be used as `passport` in the submitted payload. */
export interface PassportData extends PassportFormValues {
  document: PassportDocument;
}

/** What the form reports to its host. `valid: true` guarantees complete `PassportData`. */
export type PassportFormState =
  { valid: true; data: PassportData } | { valid: false; data: PassportFormValues };

export interface PassportFormProps {
  /** Called once after mount and again whenever validity or data changes. */
  onChange: (state: PassportFormState) => void;
  /** Values to show when the form mounts, e.g. after navigating back. Read on mount only. */
  initialValue?: PassportFormValues;
}
