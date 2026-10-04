import type { InputHTMLAttributes } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import styles from './PassportForm.module.css';

type TextFieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  /** Shows the value in upper case, matching how the form stores it. */
  uppercase?: boolean;
  registration: UseFormRegisterReturn;
} & Pick<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'autoComplete' | 'autoCapitalize' | 'spellCheck' | 'min'
>;

export default function TextField({
  id,
  label,
  hint,
  error,
  uppercase = false,
  registration,
  type = 'text',
  ...inputProps
}: TextFieldProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ');

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      <input
        id={id}
        type={type}
        className={uppercase ? `${styles.input} ${styles.uppercase}` : styles.input}
        required
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy || undefined}
        {...inputProps}
        {...registration}
      />
      <p id={errorId} className={styles.error} aria-live="polite">
        {error}
      </p>
    </div>
  );
}
