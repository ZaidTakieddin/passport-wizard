import styles from './Wizard.module.css';
import type { WizardStep } from './wizardReducer';

const STEPS = [
  { step: 'passport', label: 'Passport' },
  { step: 'idInfo', label: 'ID details' },
] as const;

export default function StepIndicator({ current }: { current: WizardStep }) {
  const currentIndex =
    current === 'submitted' ? STEPS.length : STEPS.findIndex(({ step }) => step === current);

  return (
    <ol className={styles.steps} aria-label="Progress">
      {STEPS.map(({ step, label }, index) => {
        const status = index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming';
        return (
          <li
            key={step}
            className={styles.step}
            data-status={status}
            aria-current={status === 'current' ? 'step' : undefined}
          >
            <span className={styles.stepNumber} aria-hidden="true">
              {status === 'complete' ? '✓' : index + 1}
            </span>
            {label}
            {status === 'complete' && <span className={styles.visuallyHidden}> (completed)</span>}
          </li>
        );
      })}
    </ol>
  );
}
