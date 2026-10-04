import type { PassportDocument, PassportFormValues } from 'passport-contract';
import { useEffect, useRef } from 'react';
import type { IdInfoValues } from '../id-info/idInfo';
import { initialWizardState, type WizardState } from './wizardReducer';

// sessionStorage survives a page refresh but is cleared when the tab closes, which suits
// personal data better than localStorage. The file is stored under its own key because it is
// large and changes rarely, while the other values change on every keystroke.
const STATE_KEY = 'passport-wizard:state';
const DOCUMENT_KEY = 'passport-wizard:document';

type SavedPassport = Omit<PassportFormValues, 'document'>;

type SavedState = {
  passport: SavedPassport | null;
  idInfo: IdInfoValues;
};

const PASSPORT_FIELDS = ['passportNumber', 'firstName', 'lastName', 'issueDate', 'expiryDate'];

function readJson(key: string): unknown {
  try {
    const raw = sessionStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Returns false when storage is unavailable or full. */
function writeJson(key: string, value: unknown): boolean {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function remove(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Storage unavailable: nothing was saved.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function hasStrings(value: Record<string, unknown>, keys: string[]): boolean {
  return keys.every((key) => typeof value[key] === 'string');
}

// Stored data can be stale or edited by hand, so anything unexpected is ignored.
function parseSavedState(value: unknown): SavedState | null {
  if (!isRecord(value) || !isRecord(value.idInfo) || !hasStrings(value.idInfo, ['idNumber', 'nationality'])) {
    return null;
  }
  const { passport } = value;
  if (passport !== null && !(isRecord(passport) && hasStrings(passport, PASSPORT_FIELDS))) return null;
  return value as SavedState;
}

// Only the shape is checked here: the passport form re-validates the restored file, MIME type
// and contents included, when it mounts.
function parseDocument(value: unknown): PassportDocument | null {
  if (!isRecord(value)) return null;
  const { fileName, mimeType, base64 } = value;
  if (typeof fileName !== 'string' || typeof mimeType !== 'string' || typeof base64 !== 'string') return null;
  return { fileName, mimeType: mimeType as PassportDocument['mimeType'], base64 };
}

function isSameDocument(a: PassportDocument | null | undefined, b: PassportDocument | null | undefined) {
  return a?.fileName === b?.fileName && a?.mimeType === b?.mimeType && a?.base64 === b?.base64;
}

/**
 * Restores a wizard interrupted by a page refresh. It always reopens on Step 1, so the passport
 * form re-checks the restored values itself before Next is enabled.
 */
export function loadWizardState(): WizardState {
  const saved = parseSavedState(readJson(STATE_KEY));
  if (!saved) return initialWizardState;

  const document = parseDocument(readJson(DOCUMENT_KEY));
  return {
    ...initialWizardState,
    passport: saved.passport && { valid: false, data: { ...saved.passport, document } },
    idInfo: saved.idInfo,
  };
}

/** Saves the wizard after every change, and clears it once the payload has been submitted. */
export function usePersistWizardState(state: WizardState) {
  const savedDocument = useRef<PassportDocument | null>();

  useEffect(() => {
    if (state.step === 'submitted') {
      remove(STATE_KEY);
      remove(DOCUMENT_KEY);
      savedDocument.current = undefined;
      return;
    }

    const data = state.passport?.data;
    const passport: SavedPassport | null = data
      ? {
          passportNumber: data.passportNumber,
          firstName: data.firstName,
          lastName: data.lastName,
          issueDate: data.issueDate,
          expiryDate: data.expiryDate,
        }
      : null;
    writeJson(STATE_KEY, { passport, idInfo: state.idInfo } satisfies SavedState);

    const document = data?.document ?? null;
    if (!isSameDocument(document, savedDocument.current)) {
      // If the file doesn't fit in storage, drop it rather than restore an outdated one later.
      if (document === null || !writeJson(DOCUMENT_KEY, document)) remove(DOCUMENT_KEY);
      savedDocument.current = document;
    }
  }, [state]);
}
