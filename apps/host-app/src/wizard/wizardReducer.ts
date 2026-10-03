import type { PassportFormState } from 'passport-contract';
import { EMPTY_ID_INFO, parseIdInfo, type IdInfoValues } from '../id-info/idInfo';
import { buildPayload, type SubmissionPayload } from '../submission/buildPayload';

export type WizardStep = 'passport' | 'idInfo' | 'submitted';

export interface WizardState {
  step: WizardStep;
  /** The last state reported by the PassportForm remote; null until it first reports. */
  passport: PassportFormState | null;
  idInfo: IdInfoValues;
  /** Set when the wizard is submitted. */
  payload: SubmissionPayload | null;
}

export type WizardAction =
  | { type: 'passportChanged'; passport: PassportFormState }
  | { type: 'idInfoChanged'; field: keyof IdInfoValues; value: string }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'submitted'; payload: SubmissionPayload }
  | { type: 'reset' };

export const initialWizardState: WizardState = {
  step: 'passport',
  passport: null,
  idInfo: EMPTY_ID_INFO,
  payload: null,
};

// Passport validity is whatever the remote reported: the host never re-checks passport rules.
export function canGoNext(state: WizardState): boolean {
  return state.passport?.valid === true;
}

export function canSubmit(state: WizardState): boolean {
  return canGoNext(state) && parseIdInfo(state.idInfo) !== null;
}

/** The payload to submit, or null while either form is invalid. */
export function getSubmissionPayload(state: WizardState): SubmissionPayload | null {
  const idInfo = parseIdInfo(state.idInfo);
  if (!state.passport?.valid || !idInfo) return null;
  return buildPayload(state.passport.data, idInfo);
}

// Transitions are checked here too, so a disabled button is not the only guard.
export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'passportChanged':
      return { ...state, passport: action.passport };
    case 'idInfoChanged':
      return { ...state, idInfo: { ...state.idInfo, [action.field]: action.value } };
    case 'next':
      return state.step === 'passport' && canGoNext(state) ? { ...state, step: 'idInfo' } : state;
    case 'back':
      return state.step === 'idInfo' ? { ...state, step: 'passport' } : state;
    case 'submitted':
      return state.step === 'idInfo' && canSubmit(state)
        ? { ...state, step: 'submitted', payload: action.payload }
        : state;
    case 'reset':
      return initialWizardState;
  }
}
