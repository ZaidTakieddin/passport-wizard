import { useId, useState } from 'react';
import styles from './IdInfoFields.module.css';
import { NATIONALITIES, validateIdInfo, type IdInfoValues } from './idInfo';

type IdInfoFieldsProps = {
  values: IdInfoValues;
  onChange: (field: keyof IdInfoValues, value: string) => void;
};

// Values are controlled by the wizard so they survive Back and Next. Whether a field has
// been touched is local: it only decides when its error becomes visible.
export default function IdInfoFields({ values, onChange }: IdInfoFieldsProps) {
  const id = useId();
  const [touched, setTouched] = useState<Record<keyof IdInfoValues, boolean>>({
    idNumber: false,
    nationality: false,
  });

  const errors = validateIdInfo(values);
  const visibleError = (field: keyof IdInfoValues) => (touched[field] ? errors[field] : undefined);
  const markTouched = (field: keyof IdInfoValues) =>
    setTouched((current) => (current[field] ? current : { ...current, [field]: true }));

  const idNumberId = `${id}-idNumber`;
  const nationalityId = `${id}-nationality`;
  const idNumberError = visibleError('idNumber');
  const nationalityError = visibleError('nationality');

  return (
    <div className={styles.card}>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>ID details</legend>
        <p className={styles.intro}>All fields are required.</p>

        <div className={styles.field}>
          <label htmlFor={idNumberId} className={styles.label}>
            ID number
          </label>
          <input
            id={idNumberId}
            type="text"
            className={styles.control}
            value={values.idNumber}
            required
            autoComplete="off"
            spellCheck={false}
            aria-invalid={Boolean(idNumberError)}
            aria-describedby={idNumberError ? `${idNumberId}-error` : undefined}
            onChange={(event) => {
              onChange('idNumber', event.target.value);
              markTouched('idNumber');
            }}
            onBlur={() => markTouched('idNumber')}
          />
          <p id={`${idNumberId}-error`} className={styles.error} aria-live="polite">
            {idNumberError}
          </p>
        </div>

        <div className={styles.field}>
          <label htmlFor={nationalityId} className={styles.label}>
            Nationality
          </label>
          <select
            id={nationalityId}
            className={styles.control}
            value={values.nationality}
            required
            aria-invalid={Boolean(nationalityError)}
            aria-describedby={nationalityError ? `${nationalityId}-error` : undefined}
            onChange={(event) => {
              onChange('nationality', event.target.value);
              markTouched('nationality');
            }}
            onBlur={() => markTouched('nationality')}
          >
            <option value="" disabled>
              Select your nationality
            </option>
            {NATIONALITIES.map(({ code, name }) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
          <p id={`${nationalityId}-error`} className={styles.error} aria-live="polite">
            {nationalityError}
          </p>
        </div>
      </fieldset>
    </div>
  );
}
