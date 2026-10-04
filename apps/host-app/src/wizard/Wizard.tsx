import { useEffect, useId, useReducer, useRef, type FormEvent } from 'react';
import IdInfoFields from '../id-info/IdInfoFields';
import RemotePassportForm from '../remote/RemotePassportForm';
import SubmissionResult from '../submission/SubmissionResult';
import { loadWizardState, usePersistWizardState } from './persistence';
import StepIndicator from './StepIndicator';
import styles from './Wizard.module.css';
import { canGoNext, canSubmit, getSubmissionPayload, wizardReducer, type WizardStep } from './wizardReducer';

const STEP_TITLES: Record<WizardStep, string> = {
  passport: 'Your passport',
  idInfo: 'Your ID',
  submitted: 'Application submitted',
};

export default function Wizard() {
  const [state, dispatch] = useReducer(wizardReducer, undefined, loadWizardState);
  usePersistWizardState(state);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(state.step);
  const nextHintId = useId();
  const submitHintId = useId();

  // Move focus to the new step's heading so keyboard and screen reader users start there.
  useEffect(() => {
    if (previousStep.current === state.step) return;
    previousStep.current = state.step;
    headingRef.current?.focus();
  }, [state.step]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = getSubmissionPayload(state);
    if (!payload) return;
    console.log(`Submitted payload:\n${JSON.stringify(payload, null, 2)}`);
    dispatch({ type: 'submitted', payload });
  }

  const nextEnabled = canGoNext(state);
  const submitEnabled = canSubmit(state);

  return (
    <div className={styles.wizard}>
      <StepIndicator current={state.step} />
      <h2 ref={headingRef} tabIndex={-1} className={styles.heading}>
        {STEP_TITLES[state.step]}
      </h2>

      {state.step === 'passport' && (
        <>
          {/* Read on mount only: after Back, this restores what the user entered. */}
          <RemotePassportForm
            initialValue={state.passport?.data}
            onChange={(passport) => dispatch({ type: 'passportChanged', passport })}
          />
          <div className={styles.actions}>
            {!nextEnabled && (
              <p id={nextHintId} className={styles.hint}>
                Complete every passport field to continue.
              </p>
            )}
            <button
              type="button"
              className={`${styles.button} ${styles.primary}`}
              disabled={!nextEnabled}
              aria-describedby={nextEnabled ? undefined : nextHintId}
              onClick={() => dispatch({ type: 'next' })}
            >
              Next
            </button>
          </div>
        </>
      )}

      {state.step === 'idInfo' && (
        <form className={styles.stepForm} noValidate onSubmit={handleSubmit}>
          <IdInfoFields
            values={state.idInfo}
            onChange={(field, value) => dispatch({ type: 'idInfoChanged', field, value })}
          />
          <div className={styles.actions}>
            {!submitEnabled && (
              <p id={submitHintId} className={styles.hint}>
                Complete your ID details to submit.
              </p>
            )}
            <button
              type="button"
              className={`${styles.button} ${styles.secondary}`}
              onClick={() => dispatch({ type: 'back' })}
            >
              Back
            </button>
            <button
              type="submit"
              className={`${styles.button} ${styles.primary}`}
              disabled={!submitEnabled}
              aria-describedby={submitEnabled ? undefined : submitHintId}
            >
              Submit
            </button>
          </div>
        </form>
      )}

      {state.step === 'submitted' && state.payload && (
        <>
          <SubmissionResult payload={state.payload} />
          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.button} ${styles.secondary}`}
              onClick={() => dispatch({ type: 'reset' })}
            >
              Start over
            </button>
          </div>
        </>
      )}
    </div>
  );
}
