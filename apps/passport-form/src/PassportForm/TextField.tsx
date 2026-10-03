import type { InputHTMLAttributes } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import styles from './PassportForm.module.css';

type TextFieldProps = {
  id: string;
  label: string;
  error?: string;
  registration: UseFormRegisterReturn;
} & Pick<InputHTMLAttributes<HTMLInputElement>, 'type' | 'autoComplete' | 'autoCapitalize' | 'spellCheck' | 'min'>;

export default function TextField({ id, label, error, registration, type = 'text', ...inputProps }: TextFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        className={styles.input}
        required
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
        {...registration}
      />
      <p id={errorId} className={styles.error} aria-live="polite">
        {error}
      </p>
    </div>
  );
}
